import { useTranslation } from 'react-i18next';
import { Building2, Users, MapPin, Download, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BULK_CHANGE_TABLES, BULK_CHANGE_DICTIONARIES, type BulkChangeTableKey } from '../constants';

const ICONS = { Building2, Users, MapPin } as const;

interface BulkChangeSetupStepProps {
  selectedTable: BulkChangeTableKey;
  onSelectTable: (table: BulkChangeTableKey) => void;
}

export function BulkChangeSetupStep({ selectedTable, onSelectTable }: BulkChangeSetupStepProps) {
  const { t } = useTranslation();
  const dictionary = BULK_CHANGE_DICTIONARIES[selectedTable];

  const handleDownloadTemplate = () => {
    const headerRow = dictionary.map((row) => row.excelHeader).join(',');
    const csv = `${headerRow}\n`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedTable}_Bulk_Update_Template.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800">
          {t('bulkChange.wizard.setup.chooseData', { defaultValue: 'Choose the data to update' })}
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">
          {t('bulkChange.wizard.setup.chooseDataDesc', { defaultValue: 'Pick which table your Excel file targets.' })}
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {BULK_CHANGE_TABLES.map((option) => {
            const Icon = ICONS[option.icon];
            const isActive = option.key === selectedTable;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onSelectTable(option.key)}
                className={`flex flex-col items-start gap-3 rounded-lg border p-4 text-start transition-colors ${
                  isActive ? 'border-[#A71D3A] bg-[#A71D3A]/5' : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-md ${
                    isActive ? 'bg-[#A71D3A] text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className={`text-sm font-medium ${isActive ? 'text-[#A71D3A]' : 'text-slate-700'}`}>
                  {t(option.navKey, { defaultValue: option.label })}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              {t('bulkChange.wizard.setup.columnDictionary', { defaultValue: 'Column dictionary' })}
            </h2>
            <p className="text-sm text-slate-500">
              {t('bulkChange.wizard.setup.columnDictionaryDesc', { defaultValue: 'Use these exact column headers in your file.' })}
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4" />
            {t('bulkChange.wizard.setup.downloadTemplate', { defaultValue: 'Download template' })}
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="whitespace-nowrap px-5 py-2.5 text-start text-xs font-medium uppercase tracking-wide text-slate-500">
                  {t('bulkChange.wizard.setup.excelHeader', { defaultValue: 'Excel header' })}
                </th>
                <th className="whitespace-nowrap px-5 py-2.5 text-start text-xs font-medium uppercase tracking-wide text-slate-500">
                  {t('bulkChange.wizard.setup.attribute', { defaultValue: 'Attribute' })}
                </th>
                <th className="whitespace-nowrap px-5 py-2.5 text-start text-xs font-medium uppercase tracking-wide text-slate-500">
                  {t('bulkChange.wizard.setup.type', { defaultValue: 'Type' })}
                </th>
                <th className="whitespace-nowrap px-5 py-2.5 text-start text-xs font-medium uppercase tracking-wide text-slate-500">
                  {t('bulkChange.wizard.setup.required', { defaultValue: 'Required' })}
                </th>
                <th className="whitespace-nowrap px-5 py-2.5 text-start text-xs font-medium uppercase tracking-wide text-slate-500">
                  {t('bulkChange.wizard.setup.allowedValues', { defaultValue: 'Allowed values' })}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dictionary.map((row) => (
                <tr key={row.excelHeader} className="hover:bg-slate-50 transition-colors">
                  <td className="whitespace-nowrap px-5 py-3 font-mono text-xs font-medium text-blue-700">{row.excelHeader}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-sm text-slate-700">{row.attribute}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-sm text-slate-700">{row.type}</td>
                  <td className="whitespace-nowrap px-5 py-3">
                    {row.required ? (
                      <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                        {t('bulkChange.wizard.setup.mandatory', { defaultValue: 'Mandatory' })}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">{t('bulkChange.wizard.setup.optional', { defaultValue: 'Optional' })}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">{row.allowedValues}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-start gap-2 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          <Info className="h-4 w-4 shrink-0 text-slate-400" />
          <span>
            {t('bulkChange.wizard.setup.note', {
              defaultValue:
                'Only SBR_ID is mandatory — it matches each row to a record. Include only the columns you want to change; omitted columns are left untouched.',
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
