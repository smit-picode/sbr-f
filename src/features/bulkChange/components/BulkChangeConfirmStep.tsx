import { useTranslation } from 'react-i18next';
import { CheckCircle2 } from 'lucide-react';
import { BULK_CHANGE_DICTIONARIES, type BulkChangeTableKey } from '../constants';
import type { BulkChangeValidationResult } from '../types';

interface BulkChangeConfirmStepProps {
  selectedTable: BulkChangeTableKey;
  fileName: string | undefined;
  validation: BulkChangeValidationResult;
  reason: string;
  onReasonChange: (value: string) => void;
}

export function BulkChangeConfirmStep({ selectedTable, fileName, validation, reason, onReasonChange }: BulkChangeConfirmStepProps) {
  const { t } = useTranslation();
  const dictionary = BULK_CHANGE_DICTIONARIES[selectedTable];
  const validRows = validation.rows.filter((_, index) => !validation.invalidRowIndexes.has(index));

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800">
          {t('bulkChange.wizard.confirm.title', { defaultValue: 'Confirm bulk update' })}
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              {t('bulkChange.wizard.confirm.table', { defaultValue: 'Table' })}
            </p>
            <p className="mt-0.5 text-sm font-medium text-slate-800">{selectedTable}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              {t('bulkChange.wizard.confirm.file', { defaultValue: 'File' })}
            </p>
            <p className="mt-0.5 truncate text-sm font-medium text-slate-800">{fileName ?? '—'}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              {t('bulkChange.wizard.confirm.recordsToUpdate', { defaultValue: 'Records to update' })}
            </p>
            <p className="mt-0.5 text-sm font-medium text-slate-800">{validRows.length}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
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
            className="w-full rounded-md border border-slate-200 p-2.5 text-sm text-slate-800 focus:border-[#A71D3A]/40 focus:outline-none focus:ring-2 focus:ring-[#A71D3A]/20"
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t('bulkChange.wizard.confirm.recordsThatWillBeUpdated', { defaultValue: 'Records that will be updated' })}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="w-10 px-3 py-2.5" />
                {dictionary.map((col) => (
                  <th key={col.excelHeader} className="whitespace-nowrap px-3 py-2.5 text-start text-xs font-medium uppercase tracking-wide text-slate-500">
                    {col.excelHeader}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {validRows.map((row) => (
                <tr key={String(row.SBR_ID)} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-3 align-top">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </td>
                  {dictionary.map((col) => (
                    <td key={col.excelHeader} className="px-3 py-3 text-sm text-slate-800">
                      {String(row[col.excelHeader] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
