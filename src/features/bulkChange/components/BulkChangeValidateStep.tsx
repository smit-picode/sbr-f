'use client';

import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { BULK_CHANGE_DICTIONARIES, BULK_CHANGE_PREVIEW_ROWS, BULK_CHANGE_TABLES, type BulkChangeTableKey } from '../constants';
import type { BulkChangeValidationIssue, BulkChangeValidationMessageKey, BulkChangeValidationResult } from '../types';

const KNOWN_SBR_IDS = new Set([47, 48, 53, 54]);
const EST_STATUS_VALUES = new Set(['Active', 'Inactive']);
const SECTOR_VALUES = new Set(['Private', 'Mixed-Private', 'Mixed-Government', 'Government']);
const ROLE_VALUES = new Set(['Owner', 'Manager']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MESSAGE_DEFAULTS: Record<BulkChangeValidationMessageKey, string> = {
  sbrIdMandatory: 'SBR_ID is mandatory.',
  sbrIdNotFound: 'SBR_ID does not match an existing record.',
  estStatusInvalid: 'Must be one of Active, Inactive.',
  sectorInvalid: 'Not a recognized sector.',
  employmentNegative: 'Must be 0 or greater.',
  roleInvalid: 'Must be one of Owner, Manager.',
  emailInvalid: 'Not a valid email address.',
};

// No backend/API exists yet to parse & validate a real workbook — this re-checks the same
// mandatory/enum rules shown in the Setup step's column dictionary against the mock preview
// rows, so the Validate step reads as a real pass rather than a static screenshot.
function validateRows(table: BulkChangeTableKey): BulkChangeValidationResult {
  const rows = BULK_CHANGE_PREVIEW_ROWS[table];
  const issues: BulkChangeValidationIssue[] = [];
  const invalidRowIndexes = new Set<number>();

  rows.forEach((row, index) => {
    const rowNum = index + 1;
    const sbrId = Number(row.SBR_ID);
    if (!row.SBR_ID || Number.isNaN(sbrId)) {
      issues.push({ row: rowNum, field: 'SBR_ID', messageKey: 'sbrIdMandatory' });
      invalidRowIndexes.add(index);
    } else if (!KNOWN_SBR_IDS.has(sbrId)) {
      issues.push({ row: rowNum, field: 'SBR_ID', messageKey: 'sbrIdNotFound' });
      invalidRowIndexes.add(index);
    }

    if (table === 'Establishments') {
      if (row.EST_STATUS && !EST_STATUS_VALUES.has(String(row.EST_STATUS))) {
        issues.push({ row: rowNum, field: 'EST_STATUS', messageKey: 'estStatusInvalid' });
        invalidRowIndexes.add(index);
      }
      if (row.SECTOR_ID && !SECTOR_VALUES.has(String(row.SECTOR_ID))) {
        issues.push({ row: rowNum, field: 'SECTOR_ID', messageKey: 'sectorInvalid' });
        invalidRowIndexes.add(index);
      }
      if (row.EMPLOYMENT_COUNT !== undefined && Number(row.EMPLOYMENT_COUNT) < 0) {
        issues.push({ row: rowNum, field: 'EMPLOYMENT_COUNT', messageKey: 'employmentNegative' });
        invalidRowIndexes.add(index);
      }
    }

    if (table === 'Contacts') {
      if (row.ROLE && !ROLE_VALUES.has(String(row.ROLE))) {
        issues.push({ row: rowNum, field: 'ROLE', messageKey: 'roleInvalid' });
        invalidRowIndexes.add(index);
      }
      if (row.EMAIL && !EMAIL_PATTERN.test(String(row.EMAIL))) {
        issues.push({ row: rowNum, field: 'EMAIL', messageKey: 'emailInvalid' });
        invalidRowIndexes.add(index);
      }
    }
  });

  return {
    totalRows: rows.length,
    validRows: rows.length - invalidRowIndexes.size,
    errorRows: invalidRowIndexes.size,
    issues,
    rows,
    invalidRowIndexes,
  };
}

interface BulkChangeValidateStepProps {
  selectedTable: BulkChangeTableKey;
  fileName: string | undefined;
  onValidated: (result: BulkChangeValidationResult) => void;
}

export function BulkChangeValidateStep({ selectedTable, fileName, onValidated }: BulkChangeValidateStepProps) {
  const { t } = useTranslation();
  const result = useMemo(() => validateRows(selectedTable), [selectedTable]);
  const dictionary = BULK_CHANGE_DICTIONARIES[selectedTable];
  const tableOption = BULK_CHANGE_TABLES.find((o) => o.key === selectedTable);
  const tableLabel = tableOption ? t(tableOption.navKey, { defaultValue: tableOption.label }) : selectedTable;

  // Report the computed result to the parent so Next/Confirm can use the valid-row subset.
  useEffect(() => {
    onValidated(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTable]);

  const issuesByRow = useMemo(() => {
    const map = new Map<number, BulkChangeValidationIssue[]>();
    result.issues.forEach((issue) => {
      const list = map.get(issue.row) ?? [];
      list.push(issue);
      map.set(issue.row, list);
    });
    return map;
  }, [result.issues]);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800">
          {t('bulkChange.wizard.validate.title', { defaultValue: 'Validation results' })}
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">
          {t('bulkChange.wizard.validate.description', {
            defaultValue: '{{fileName}} was checked against the {{table}} column dictionary.',
            fileName: fileName ?? t('bulkChange.wizard.validate.yourFile', { defaultValue: 'Your file' }),
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
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="w-16 px-5 py-2.5 text-start text-xs font-medium uppercase tracking-wide text-slate-500">
                  {t('bulkChange.wizard.validate.row', { defaultValue: 'Row' })}
                </th>
                {dictionary.map((col) => (
                  <th key={col.excelHeader} className="whitespace-nowrap px-3 py-2.5 text-start text-xs font-medium uppercase tracking-wide text-slate-500">
                    {col.excelHeader}
                  </th>
                ))}
                <th className="px-3 py-2.5 text-start text-xs font-medium uppercase tracking-wide text-slate-500">
                  {t('bulkChange.wizard.validate.status', { defaultValue: 'Status' })}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.rows.map((row, index) => {
                const rowNum = index + 1;
                const rowIssues = issuesByRow.get(rowNum) ?? [];
                const hasError = result.invalidRowIndexes.has(index);
                return (
                  <tr key={rowNum} className={hasError ? 'bg-red-50/40' : 'hover:bg-slate-50 transition-colors'}>
                    <td className="px-5 py-3 text-sm text-slate-500">{rowNum}</td>
                    {dictionary.map((col) => {
                      const fieldIssue = rowIssues.find((issue) => issue.field === col.excelHeader);
                      return (
                        <td key={col.excelHeader} className="px-3 py-3 align-top">
                          <p className="text-sm text-slate-800">{String(row[col.excelHeader] ?? '—')}</p>
                          {fieldIssue && (
                            <p className="mt-0.5 text-xs text-red-600">
                              {t(`bulkChange.wizard.validate.messages.${fieldIssue.messageKey}`, {
                                defaultValue: MESSAGE_DEFAULTS[fieldIssue.messageKey],
                              })}
                            </p>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-3">
                      {hasError ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                          <XCircle className="h-3.5 w-3.5" /> {t('bulkChange.wizard.validate.errorLabel', { defaultValue: 'Error' })}
                        </span>
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
