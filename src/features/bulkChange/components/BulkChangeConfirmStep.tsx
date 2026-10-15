'use client';

import { useTranslation } from 'react-i18next';
import { CheckCircle2 } from 'lucide-react';
import { BULK_CHANGE_TABLES } from '../constants';
import type { BulkChangeSubmitFailure, BulkChangeValidationResult } from '../types';

import type { BulkChangeTableKey } from '@/features/bulkChange/types';
interface BulkChangeConfirmStepProps {
  selectedTable: BulkChangeTableKey;
  fileName: string | undefined;
  validation: BulkChangeValidationResult;
  reason: string;
  onReasonChange: (value: string) => void;
  submitFailures?: BulkChangeSubmitFailure[];
}

const fmt = (v: string | number | null | undefined): string => (v == null || v === '' ? '—' : String(v));

export function BulkChangeConfirmStep({ selectedTable, fileName, validation, reason, onReasonChange, submitFailures = [] }: BulkChangeConfirmStepProps) {
  const { t } = useTranslation();
  const tableOption = BULK_CHANGE_TABLES.find((o) => o.key === selectedTable);
  const tableLabel = tableOption ? t(tableOption.navKey, { defaultValue: tableOption.label }) : selectedTable;

  const validRows = validation.rows.filter((row) => row.status === 'VALID');
  const columns = validation.columns;

  return (
    <div className="flex flex-col gap-4">
      {submitFailures.length > 0 && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700">
            {t('bulkChange.wizard.confirm.submitFailedTitle', { defaultValue: 'These rows could not be submitted' })}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-red-700">
            {submitFailures.map((failure, index) => (
              <li key={`${failure.rowNumber ?? 'row'}-${index}`}>
                {failure.rowNumber != null && (
                  <span className="font-medium">{t('bulkChange.wizard.confirm.rowLabel', { defaultValue: 'Row {{row}}', row: failure.rowNumber })}: </span>
                )}
                {failure.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg bg-white p-5 shadow-card">
        <h2 className="text-base font-semibold text-slate-800">
          {t('bulkChange.wizard.confirm.title', { defaultValue: 'Confirm bulk update' })}
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          <div>
            <p className="text-[11px] text-slate-400">
              {t('bulkChange.wizard.confirm.table', { defaultValue: 'Table' })}
            </p>
            <p className="mt-0.5 text-sm font-medium text-slate-800">{tableLabel}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">
              {t('bulkChange.wizard.confirm.file', { defaultValue: 'File' })}
            </p>
            <p className="mt-0.5 truncate text-sm font-medium text-slate-800">{fmt(fileName)}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">
              {t('bulkChange.wizard.confirm.recordsToUpdate', { defaultValue: 'Records to update' })}
            </p>
            <p className="mt-0.5 text-sm font-medium text-slate-800">{validation.validRows}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">
              {t('bulkChange.wizard.confirm.excludedErrors', { defaultValue: 'Excluded (errors)' })}
            </p>
            <p className="mt-0.5 text-sm font-medium text-slate-800">{validation.errorRows}</p>
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <label htmlFor="bulk-change-reason" className="text-sm font-medium text-slate-700">
            {t('bulkChange.wizard.confirm.reasonLabel', { defaultValue: 'Reason for change' })}
          </label>
          <textarea
            id="bulk-change-reason"
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder={t('bulkChange.wizard.confirm.reasonPlaceholder', { defaultValue: 'Briefly describe why these records are being updated…' })}
            className="w-full rounded-md border border-slate-200 p-2.5 text-sm text-slate-800 focus:border-[#A29374]/40 focus:outline-none focus:ring-2 focus:ring-[#A29374]/20"
          />
          <p className="text-xs text-slate-400">
            {t('bulkChange.wizard.confirm.reasonHint', {
              defaultValue: 'This reason is recorded on every change request created by this upload.',
            })}
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-white shadow-card">
        <div className="border-b border-slate-100 px-5 py-3 text-[12px] font-bold tracking-[0.08em] text-slate-400">
          {t('bulkChange.wizard.confirm.recordsThatWillBeUpdated', { defaultValue: 'Records that will be updated' })}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="w-10 px-3 py-2.5" />
                {columns.map((col) => (
                  <th key={col.key} className="whitespace-nowrap px-3 py-2.5 text-start text-[11.5px] font-semibold text-slate-500">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {validRows.map((row, index) => (
                <tr key={`${row.id}-${index}`} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-3 align-top">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </td>
                  {columns.map((col) => {
                    const field = row.fields.find((f) => f.key === col.key);
                    return (
                      <td key={col.key} className={`px-3 py-3 align-top ${field?.changed ? 'bg-amber-50/70 rounded-md' : ''}`}>
                        {field?.changed && (
                          <p className="truncate text-xs text-slate-400 line-through">{fmt(field.oldValue)}</p>
                        )}
                        <p className={`truncate text-sm text-slate-800 ${field?.changed ? 'font-semibold' : ''}`}>
                          {fmt(field?.value)}
                        </p>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
