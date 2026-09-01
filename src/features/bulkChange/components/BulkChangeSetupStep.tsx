'use client';

import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Users, MapPin, Download, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermission } from '@/hooks';
import { toast } from '@/utils/toast';
import { useGetBulkChangeTemplateQuery, useLazyGetBulkChangeExportQuery } from '../api/bulkChangeApi';
import { buildTemplateWorkbook } from '../utils/parseWorkbook';
import { BULK_CHANGE_TABLES, ENTITY_TYPE_BY_TABLE, type BulkChangeTableKey } from '../constants';

const ICONS = { Building2, Users, MapPin } as const;

interface BulkChangeSetupStepProps {
  selectedTable: BulkChangeTableKey;
  onSelectTable: (table: BulkChangeTableKey) => void;
}

export function BulkChangeSetupStep({ selectedTable, onSelectTable }: BulkChangeSetupStepProps) {
  const { t } = useTranslation();

  // A bulk submit still requires the target table's own Edit permission — enforced by the API
  // and again by SBR_PORTAL_PKG. Offering a table the user cannot edit would let them build a
  // whole upload only to be refused at the final step, so only editable tables are shown.
  const establishments = usePermission('establishments');
  const contacts = usePermission('contacts');
  const addresses = usePermission('addresses');
  const canEditTable: Record<BulkChangeTableKey, boolean> = useMemo(() => ({
    Establishments: establishments.canEdit,
    Contacts: contacts.canEdit,
    Addresses: addresses.canEdit,
  }), [establishments.canEdit, contacts.canEdit, addresses.canEdit]);

  const availableTables = BULK_CHANGE_TABLES.filter((o) => canEditTable[o.key]);

  // The wizard opens on Establishments by default; move off it if that is not one the user can
  // edit, so the Setup step never starts on a table they are not allowed to submit.
  useEffect(() => {
    if (availableTables.length === 0) return;
    if (!canEditTable[selectedTable]) onSelectTable(availableTables[0].key);
    // onSelectTable is a stable parent callback; re-running on it would fight the parent's state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTable, canEditTable]);

  const entityType = ENTITY_TYPE_BY_TABLE[selectedTable];

  // The column dictionary comes from the API, which builds it from the same editable-column
  // specs the server validates against — so the template can never offer a column the submit
  // would reject.
  const { data, isLoading } = useGetBulkChangeTemplateQuery(entityType);
  const template = data?.data;

  // NPC-260 follow-up: fetched only on click (lazy), never on mount — the export is a snapshot
  // for this one download, not something the page needs to keep current in the background.
  const [fetchExport, { isFetching: isExporting }] = useLazyGetBulkChangeExportQuery();

  const handleDownloadTemplate = async () => {
    if (!template) return;
    try {
      // Pre-fill with the operator's actual current records so nobody has to discover or type a
      // row ID themselves (see buildTemplateWorkbook's own note). If the export call fails for
      // any reason, fall back to the plain blank template rather than blocking the download
      // entirely — pre-filling is a convenience on top of the template, not a requirement of it.
      let records: Record<string, string | number | null>[] | undefined;
      try {
        records = (await fetchExport(entityType).unwrap()).data?.records;
      } catch {
        records = undefined;
      }

      const blob = await buildTemplateWorkbook(
        selectedTable,
        template.idColumn,
        template.columns.map((c) => ({ key: c.key, type: c.type, allowed: c.allowed })),
        records,
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedTable}_Bulk_Update_Template.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('bulkChange.wizard.setup.templateFailed', { defaultValue: 'Could not build the template file.' }));
    }
  };

  const describeAllowed = (column: NonNullable<typeof template>['columns'][number]): string => {
    if (column.required) return t('bulkChange.wizard.setup.mustMatch', { defaultValue: 'Must match an existing record' });
    if (column.allowed?.length) return column.allowed.join(' · ');
    if (column.type === 'integer') {
      return column.min !== null && column.min !== undefined
        ? t('bulkChange.wizard.setup.minValue', { defaultValue: '{{min}} or greater', min: column.min })
        : t('bulkChange.wizard.setup.wholeNumber', { defaultValue: 'Whole number' });
    }
    if (column.maxLength) return t('bulkChange.wizard.setup.maxChars', { defaultValue: 'Text up to {{max}} characters', max: column.maxLength });
    return t('bulkChange.wizard.setup.anyText', { defaultValue: 'Any text' });
  };

  // NPC-258: a conditionally-required column (e.g. EST_STATUS_CATEGORY, only mandatory when
  // EST_STATUS is Inactive) isn't flagged `mandatory`, since it isn't always required — the
  // condition is surfaced here instead, appended to whatever describeAllowed() already shows.
  const describeAllowedWithNote = (column: NonNullable<typeof template>['columns'][number]): string => {
    const base = describeAllowed(column);
    return column.note ? `${base} — ${column.note}` : base;
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
          {availableTables.map((option) => {
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
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownloadTemplate} disabled={!template || isExporting}>
            <Download className="h-4 w-4" />
            {t('bulkChange.wizard.setup.downloadTemplate', { defaultValue: 'Download template' })}
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="whitespace-nowrap px-5 py-2.5 text-start text-xs font-medium uppercase tracking-wide text-slate-500">
                    {t('bulkChange.wizard.setup.excelHeader', { defaultValue: 'Excel header' })}
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
                {template?.columns.map((column) => (
                  <tr key={column.key} className="hover:bg-slate-50 transition-colors">
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-xs font-medium text-blue-700">{column.key}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-sm text-slate-700">{column.type}</td>
                    <td className="whitespace-nowrap px-5 py-3">
                      {column.mandatory ? (
                        <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                          {t('bulkChange.wizard.setup.mandatory', { defaultValue: 'Mandatory' })}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">{t('bulkChange.wizard.setup.optional', { defaultValue: 'Optional' })}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{describeAllowedWithNote(column)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-start gap-2 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          <Info className="h-4 w-4 shrink-0 text-slate-400" />
          <span>
            {/* SBR_ID is the identifier for every table. For Contacts/Addresses it only resolves
                when exactly one active record shares that SBR_ID — see each column's note. */}
            {t('bulkChange.wizard.setup.noteIdColumn', {
              defaultValue:
                'Only {{idColumn}} is mandatory — it matches each row to a record. Include only the columns you want to change; omitted columns are left untouched.',
              idColumn: template?.idColumn ?? 'ID',
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
