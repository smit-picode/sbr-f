'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { TablePagination } from '@/components/table/TablePagination';
import { DEFAULT_PAGE_SIZE } from '@/constants';
import { useGetBulkChangeTemplateQuery, useValidateBulkChangeMutation } from '../api/bulkChangeApi';
import { parseWorkbookInWorker } from '../utils/parseWorkbookInWorker';
import { isTransientFailure, requestFailureStatus } from '../utils/requestFailure';
import {
  BULK_CHANGE_MAX_ROWS,
  BULK_CHANGE_TABLES,
  BULK_CHANGE_VALIDATION_DEFAULTS,
  ENTITY_TYPE_BY_TABLE,
  type BulkChangeTableKey,
} from '../constants';
import type { BulkChangeItemInput, BulkChangeValidationIssue, BulkChangeValidationResult } from '../types';

// Best-effort text for a caught value that isn't an Error instance.
function describeThrownValue(error: unknown): string | null {
  if (error === null || error === undefined) return null;
  if (typeof error === 'string') return error;
  if (typeof error === 'object') {
    const obj = error as Record<string, unknown>;
    const data = obj.data as Record<string, unknown> | undefined;
    if (typeof data?.message === 'string' && data.message) return data.message;
    if (typeof obj.message === 'string' && obj.message) return obj.message;
    if (typeof obj.type === 'string' && obj.type) return `${obj.type} error while reading the file`;
  }
  return null;
}

interface BulkChangeValidateStepProps {
  selectedTable: BulkChangeTableKey;
  file: File | null;
  onValidated: (result: BulkChangeValidationResult | null, items: BulkChangeItemInput[]) => void;
  onRunningChange?: (running: boolean) => void;
}

// Parses the uploaded workbook in the browser
export function BulkChangeValidateStep({ selectedTable, file, onValidated, onRunningChange }: BulkChangeValidateStepProps) {
  const { t } = useTranslation();
  const entityType = ENTITY_TYPE_BY_TABLE[selectedTable];
  const { data: templateResponse } = useGetBulkChangeTemplateQuery(entityType);
  const [validateBulkChange] = useValidateBulkChangeMutation();

  const [result, setResult] = useState<BulkChangeValidationResult | null>(null);
  const [parsedItems, setParsedItems] = useState<BulkChangeItemInput[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [stage, setStage] = useState<'parsing' | 'validating'>('parsing');
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileWarnings, setFileWarnings] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const rowDetailsRef = useRef<HTMLDivElement>(null);

  const template = templateResponse?.data;
  const [attempt, setAttempt] = useState(0);
  const runKey = `${file?.name ?? ''}:${file?.lastModified ?? ''}:${entityType}:${template?.idColumn ?? ''}:${attempt}`;
  const lastRunKey = useRef<string | null>(null);

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  useEffect(() => {
    if (!file || !template) return;
    if (lastRunKey.current === runKey) return;
    lastRunKey.current = runKey;

    let cancelled = false;

    const run = async () => {
      setIsRunning(true);
      setStage('parsing');
      setParseError(null);
      setFileWarnings([]);
      try {
        const editable = template.columns.filter((c) => !c.required).map((c) => c.key);
        const parsed = await parseWorkbookInWorker(file, template.idColumn, editable);

        if (parsed.items.length === 0) {
          throw new Error(t('bulkChange.wizard.validate.emptyFile', { defaultValue: 'The file contains no data rows.' }));
        }
        if (parsed.items.length > BULK_CHANGE_MAX_ROWS) {
          throw new Error(
            t('bulkChange.wizard.validate.tooManyRows', {
              defaultValue: 'The file has {{count}} rows; the maximum is {{max}}. Please split it.',
              count: parsed.items.length,
              max: BULK_CHANGE_MAX_ROWS,
            })
          );
        }

        const warnings: string[] = [];
        if (parsed.missingIdColumn) {
          warnings.push(
            t('bulkChange.wizard.validate.missingIdColumn', {
              defaultValue: 'The file has no {{idColumn}} column, so no row can be matched to a record.',
              idColumn: template.idColumn,
            })
          );
        }
        if (parsed.unknownHeaders.length) {
          warnings.push(
            t('bulkChange.wizard.validate.unknownHeaders', {
              defaultValue: 'These columns are not part of the template and will be reported as errors: {{headers}}',
              headers: parsed.unknownHeaders.join(', '),
            })
          );
        }
        if (cancelled) return;
        setFileWarnings(warnings);
        setStage('validating');

        const response = await validateBulkChange({ entityType, items: parsed.items }).unwrap();
        if (cancelled) return;

        const validation = response.data ?? null;
        setResult(validation);
        setParsedItems(parsed.items);
        setPage(1);
        onValidated(validation, parsed.items);
      } catch (error) {
        if (cancelled) return;
        console.warn('Bulk change validate step failed:', error);
        const failedStatus = requestFailureStatus(error);
        let requestMessage: string | null = null;
        if (failedStatus === 413) {
          requestMessage = t('bulkChange.wizard.validate.uploadTooLarge', { defaultValue: 'The upload is too large for the server to accept. Please split the file into smaller parts and try again.' });
        } else if (isTransientFailure(failedStatus)) {
          requestMessage = t('bulkChange.wizard.validate.connectionLost', { defaultValue: 'We could not reach the server, or the connection dropped before the check finished. Your file is fine. Please try again.' });
        } else if (failedStatus !== null) {
          requestMessage = t('bulkChange.wizard.validate.serverFailed', { defaultValue: 'The server could not check this file right now. Please try again, or contact support if it keeps happening.' });
        }
        const msg =
          error instanceof Error
            ? error.message
            : describeThrownValue(error) ??
              requestMessage ??
              t('bulkChange.wizard.validate.parseFailed', { defaultValue: 'The file could not be read. Check that it is a valid .xlsx, .xls or .csv file.' });
        setParseError(msg);
        setResult(null);
        onValidated(null, []);
      } finally {
        if (!cancelled) setIsRunning(false);
      }
    };

    void run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey, file, template]);

  const issuesByRow = useMemo(() => {
    const map = new Map<number, BulkChangeValidationIssue[]>();
    (result?.issues ?? []).forEach((issue) => {
      const list = map.get(issue.rowNumber) ?? [];
      list.push(issue);
      map.set(issue.rowNumber, list);
    });
    return map;
  }, [result?.issues]);

  const tableOption = BULK_CHANGE_TABLES.find((o) => o.key === selectedTable);
  const tableLabel = tableOption ? t(tableOption.navKey, { defaultValue: tableOption.label }) : selectedTable;

  if (isRunning) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-lg border border-[#A29374]/30 bg-[#A29374]/5 p-4">
          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-[#A29374]" />
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {stage === 'parsing'
                ? t('bulkChange.wizard.validate.stageParsing', { defaultValue: 'Reading your file…' })
                : t('bulkChange.wizard.validate.stageValidating', { defaultValue: 'Validating rows against the register…' })}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {t('bulkChange.wizard.validate.stageHint', {
                defaultValue: 'Large files can take a little while to process. Please keep this tab open and don’t navigate away until it finishes.',
              })}
            </p>
          </div>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-card">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
          <div className="mt-4 grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-card">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="mb-2 h-8 w-full" />)}
        </div>
      </div>
    );
  }

  if (parseError) {
    return <ErrorState message={parseError} onRetry={() => setAttempt((n) => n + 1)} />;
  }

  if (!result) {
    return (
      <div className="rounded-lg bg-white p-5 shadow-card">
        <p className="text-sm text-slate-500">
          {t('bulkChange.wizard.validate.waiting', { defaultValue: 'Waiting for a file to validate…' })}
        </p>
      </div>
    );
  }

  const columns = result.columns;
  const pageStart = (page - 1) * limit;
  const pageRows = result.rows.slice(pageStart, pageStart + limit);

  const handlePageChange = (next: number) => {
    setPage(next);
    rowDetailsRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg bg-white p-5 shadow-card">
        <h2 className="text-base font-semibold text-slate-800">
          {t('bulkChange.wizard.validate.title', { defaultValue: 'Validation results' })}
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">
          {t('bulkChange.wizard.validate.description', {
            defaultValue: '{{fileName}} was checked against the {{table}} column dictionary.',
            fileName: file?.name ?? t('bulkChange.wizard.validate.yourFile', { defaultValue: 'Your file' }),
            table: tableLabel,
          })}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
            <p className="text-lg font-semibold text-slate-800">{result.totalRows}</p>
            <p className="text-xs text-slate-500">{t('bulkChange.wizard.validate.totalRows', { defaultValue: 'Total rows' })}</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
            <p className="text-lg font-semibold text-emerald-700">{result.validRows}</p>
            <p className="text-xs text-emerald-600">{t('bulkChange.wizard.validate.valid', { defaultValue: 'Valid' })}</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
            <p className="text-lg font-semibold text-red-700">{result.errorRows}</p>
            <p className="text-xs text-red-600">{t('bulkChange.wizard.validate.errors', { defaultValue: 'Errors' })}</p>
          </div>
        </div>

        {fileWarnings.map((warning) => (
          <div key={warning} className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{warning}</span>
          </div>
        ))}

        {result.errorRows > 0 && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              {t('bulkChange.wizard.validate.errorsWarning', {
                defaultValue:
                  'Rows with errors will be excluded from the bulk update. Fix them in your file and re-upload, or continue with only the valid rows.',
              })}
            </span>
          </div>
        )}
      </div>

      <div ref={rowDetailsRef} className="rounded-lg bg-white shadow-card">
        <div className="border-b border-slate-100 px-5 py-3 text-[12px] font-bold tracking-[0.08em] text-slate-400">
          {t('bulkChange.wizard.validate.rowDetails', { defaultValue: 'Row details' })}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="w-16 px-5 py-2.5 text-start text-[11.5px] font-semibold text-slate-500">
                  {t('bulkChange.wizard.validate.row', { defaultValue: 'Row' })}
                </th>
                {columns.map((col) => (
                  <th key={col.key} className="whitespace-nowrap px-3 py-2.5 text-start text-[11.5px] font-semibold text-slate-500">
                    {col.label}
                  </th>
                ))}
                <th className="w-64 min-w-[220px] px-3 py-2.5 text-start text-[11.5px] font-semibold text-slate-500">
                  {t('bulkChange.wizard.validate.status', { defaultValue: 'Status' })}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageRows.map((row, pageIndex) => {
                const index = pageStart + pageIndex;
                const rowNumber = parsedItems[index]?.rowNumber ?? index + 1;
                const rowIssues = issuesByRow.get(rowNumber) ?? [];
                const hasError = row.status === 'ERROR';
                const generalIssues = rowIssues.filter((issue) => issue.field === null);

                return (
                  <tr key={`${row.id}-${index}`} className={hasError ? 'bg-red-50/40' : 'hover:bg-slate-50 transition-colors'}>
                    <td className="px-5 py-3 text-sm text-slate-500">{rowNumber}</td>
                    {columns.map((col) => {
                      const field = row.fields.find((f) => f.key === col.key);
                      const fieldIssue = rowIssues.find((issue) => issue.field === col.key);
                      return (
                        <td key={col.key} className="px-3 py-3 align-top">
                          <p className="text-sm text-slate-800">
                            {field?.value === null || field?.value === undefined || field?.value === '' ? '—' : String(field.value)}
                          </p>
                          {field?.changed && (
                            <p className="mt-0.5 truncate text-xs text-slate-400 line-through">
                              {field.oldValue === null || field.oldValue === '' ? '—' : String(field.oldValue)}
                            </p>
                          )}
                          {fieldIssue && (
                            <p className="mt-0.5 text-xs text-red-600">
                              {fieldIssue.message?.trim()
                                ? fieldIssue.message
                                : t(`bulkChange.wizard.validate.codes.${fieldIssue.code}`, {
                                    defaultValue: BULK_CHANGE_VALIDATION_DEFAULTS[fieldIssue.code],
                                  })}
                            </p>
                          )}
                        </td>
                      );
                    })}
                    <td className="w-64 min-w-[220px] px-3 py-3">
                      {hasError ? (
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                            <XCircle className="h-3.5 w-3.5" /> {t('bulkChange.wizard.validate.errorLabel', { defaultValue: 'Error' })}
                          </span>
                          {generalIssues.map((issue) => (
                            <p key={issue.code} className="mt-0.5 text-xs text-red-600">
                              {issue.message?.trim()
                                ? issue.message
                                : t(`bulkChange.wizard.validate.codes.${issue.code}`, {
                                    defaultValue: BULK_CHANGE_VALIDATION_DEFAULTS[issue.code],
                                  })}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" /> {t('bulkChange.wizard.validate.valid', { defaultValue: 'Valid' })}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          limit={limit}
          total={result.rows.length}
          onPageChange={handlePageChange}
          onLimitChange={setLimit}
        />
      </div>
    </div>
  );
}
