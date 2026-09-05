'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { useGetBulkChangeTemplateQuery, useValidateBulkChangeMutation } from '../api/bulkChangeApi';
import { parseWorkbook } from '../utils/parseWorkbook';
import {
  BULK_CHANGE_MAX_ROWS,
  BULK_CHANGE_TABLES,
  BULK_CHANGE_VALIDATION_DEFAULTS,
  ENTITY_TYPE_BY_TABLE,
  type BulkChangeTableKey,
} from '../constants';
import type { BulkChangeItemInput, BulkChangeValidationIssue, BulkChangeValidationResult } from '../types';

interface BulkChangeValidateStepProps {
  selectedTable: BulkChangeTableKey;
  file: File | null;
  onValidated: (result: BulkChangeValidationResult | null, items: BulkChangeItemInput[]) => void;
}

// Parses the uploaded workbook in the browser, then sends the parsed rows to
// POST /bulk-change/validate. The server is what decides validity: it checks each row against
// live data (does the record exist, is the column editable, is the value legal, does it
// actually differ) and returns the real old/new diff. The browser only reads the file.
export function BulkChangeValidateStep({ selectedTable, file, onValidated }: BulkChangeValidateStepProps) {
  const { t } = useTranslation();
  const entityType = ENTITY_TYPE_BY_TABLE[selectedTable];
  const { data: templateResponse } = useGetBulkChangeTemplateQuery(entityType);
  const [validateBulkChange] = useValidateBulkChangeMutation();

  const [result, setResult] = useState<BulkChangeValidationResult | null>(null);
  // Kept so each result row can be labelled with its real spreadsheet line: the server returns
  // rows in the order they were posted, but only the parsed items know which sheet row that was.
  const [parsedItems, setParsedItems] = useState<BulkChangeItemInput[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileWarnings, setFileWarnings] = useState<string[]>([]);

  const template = templateResponse?.data;
  // Re-run only when the inputs that define the result change, not on every parent render.
  const runKey = `${file?.name ?? ''}:${file?.lastModified ?? ''}:${entityType}:${template?.idColumn ?? ''}`;
  const lastRunKey = useRef<string | null>(null);

  useEffect(() => {
    if (!file || !template) return;
    if (lastRunKey.current === runKey) return;
    lastRunKey.current = runKey;

    let cancelled = false;

    const run = async () => {
      setIsRunning(true);
      setParseError(null);
      setFileWarnings([]);
      try {
        const editable = template.columns.filter((c) => !c.required).map((c) => c.key);
        const parsed = await parseWorkbook(file, template.idColumn, editable);

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

        const response = await validateBulkChange({ entityType, items: parsed.items }).unwrap();
        if (cancelled) return;

        const validation = response.data ?? null;
        setResult(validation);
        setParsedItems(parsed.items);
        onValidated(validation, parsed.items);
      } catch (error) {
        if (cancelled) return;
        const msg = error instanceof Error
          ? error.message
          : t('bulkChange.wizard.validate.parseFailed', { defaultValue: 'The file could not be read. Check that it is a valid .xlsx, .xls or .csv file.' });
        setParseError(msg);
        setResult(null);
        onValidated(null, []);
      } finally {
        if (!cancelled) setIsRunning(false);
      }
    };

    void run();
    return () => { cancelled = true; };
    // onValidated is a parent callback and is intentionally not a dependency — including it
    // would re-parse the workbook on every parent render.
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
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
          <div className="mt-4 grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="mb-2 h-8 w-full" />)}
        </div>
      </div>
    );
  }

  if (parseError) {
    return <ErrorState message={parseError} />;
  }

  if (!result) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">
          {t('bulkChange.wizard.validate.waiting', { defaultValue: 'Waiting for a file to validate…' })}
        </p>
      </div>
    );
  }

  // The identifier column plus every column the file actually touched.
  const columns = result.columns;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
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

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t('bulkChange.wizard.validate.rowDetails', { defaultValue: 'Row details' })}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="w-16 px-5 py-2.5 text-start text-xs font-medium uppercase tracking-wide text-slate-500">
                  {t('bulkChange.wizard.validate.row', { defaultValue: 'Row' })}
                </th>
                {columns.map((col) => (
                  <th key={col.key} className="whitespace-nowrap px-3 py-2.5 text-start text-xs font-medium uppercase tracking-wide text-slate-500">
                    {col.label}
                  </th>
                ))}
                <th className="w-64 min-w-[220px] px-3 py-2.5 text-start text-xs font-medium uppercase tracking-wide text-slate-500">
                  {t('bulkChange.wizard.validate.status', { defaultValue: 'Status' })}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.rows.map((row, index) => {
                // rows[] comes back in the order the items were posted, so index lines each
                // one up with the parsed item that carries its real spreadsheet row number.
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
                              {/* The server's own message is specific to this row (e.g. names the
                                  actual value and the real allowed list) — rendered directly rather
                                  than as an i18n defaultValue, since en.json/ar.json define a static
                                  string for every code, and a loaded translation always wins over
                                  defaultValue regardless of what it's set to. Falls back to the
                                  generic, translated per-code text only when the server sent none. */}
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
                              {/* Same server-message-first rule as the field-level issue above. */}
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
      </div>
    </div>
  );
}
