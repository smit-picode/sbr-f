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
import { ESTABLISHMENTS_FIELD_LABELS } from '@/features/establishments/constants';
import { CONTACT_FIELD_LABELS } from '@/features/contacts/constants';
import { ADDRESS_FIELD_LABELS } from '@/features/addresses/constants';

// The id-column labels aren't in any feature's FIELD_LABELS map (that map is for editable
// business fields, not the row key) — named here to match the reference's "Establishment ID".
const ID_COLUMN_LABELS: Record<BulkChangeTableKey, Record<string, string>> = {
  Establishments: { SBR_ID: 'Establishment ID' },
  Contacts: { ID: 'Contact ID' },
  Addresses: { ID: 'Address ID' },
};

const FIELD_LABELS_BY_TABLE: Record<BulkChangeTableKey, Record<string, string>> = {
  Establishments: ESTABLISHMENTS_FIELD_LABELS,
  Contacts: CONTACT_FIELD_LABELS,
  Addresses: ADDRESS_FIELD_LABELS,
};

// Falls back to a humanized version of the raw column key (TRADE_NAME_ARA -> "Trade Name
// (Arabic)") for any bulk-editable column that predates or otherwise isn't in a feature's
// FIELD_LABELS map, so the Attribute column is never blank for a column the API does support.
function humanizeColumnKey(key: string): string {
  const words = key.split('_').filter(Boolean);
  const suffix = words[words.length - 1];
  const languageSuffix = suffix === 'ENU' ? 'English' : suffix === 'ARA' ? 'Arabic' : null;
  const base = (languageSuffix ? words.slice(0, -1) : words)
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
  return languageSuffix ? `${base} (${languageSuffix})` : base;
}

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

  // Fetched only on click (lazy), never on mount — the export is a snapshot for this one
  // download, not something the page needs to keep current in the background.
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

  // A conditionally-required column (e.g. EST_STATUS_CATEGORY, only mandatory when
  // EST_STATUS is Inactive) isn't flagged `mandatory`, since it isn't always required — the
  // condition is surfaced here instead, appended to whatever describeAllowed() already shows.
  const describeAllowedWithNote = (column: NonNullable<typeof template>['columns'][number]): string => {
    const base = describeAllowed(column);
    return column.note ? `${base} — ${column.note}` : base;
  };

  const describeAttribute = (column: NonNullable<typeof template>['columns'][number]): string =>
    ID_COLUMN_LABELS[selectedTable][column.key]
    ?? FIELD_LABELS_BY_TABLE[selectedTable][column.key]
    ?? humanizeColumnKey(column.key);

  // Mandatory business fields beyond the row key itself (e.g. Contacts requires CONTACT_NAME
  // and PRIORITY) — the footer note below must call these out, not just claim the id column
  // alone is required, or an operator following it hits a validation error on their first try.
  const otherMandatoryColumns = useMemo(
    () => (template?.columns ?? []).filter((c) => c.mandatory && c.key !== template?.idColumn).map((c) => c.key),
    [template],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg bg-white p-5 shadow-card">
        <h2 className="text-base font-semibold text-slate-800">
          {t('bulkChange.wizard.setup.chooseData', { defaultValue: 'Choose the data to update' })}
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">
          {t('bulkChange.wizard.setup.chooseDataDesc', { defaultValue: 'Pick which table your Excel file targets.' })}
        </p>

        <div className="mt-3 grid max-w-lg grid-cols-3 gap-2">
          {availableTables.map((option) => {
            const Icon = ICONS[option.icon];
            const isActive = option.key === selectedTable;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onSelectTable(option.key)}
                className={`flex flex-col items-start gap-2 rounded-xl border p-3 text-start transition-all ${
                  isActive ? 'border-[#A29374] bg-adaam-tint' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    isActive ? 'bg-[#A29374] text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-[12.5px] font-semibold text-slate-700">
                  {t(option.navKey, { defaultValue: option.label })}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg bg-white shadow-card">
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
                  <th className="whitespace-nowrap px-5 py-2.5 text-start text-[11.5px] font-semibold text-slate-500">
                    {t('bulkChange.wizard.setup.excelHeader', { defaultValue: 'Excel header' })}
                  </th>
                  <th className="whitespace-nowrap px-5 py-2.5 text-start text-[11.5px] font-semibold text-slate-500">
                    {t('bulkChange.wizard.setup.attribute', { defaultValue: 'Attribute' })}
                  </th>
                  <th className="whitespace-nowrap px-5 py-2.5 text-start text-[11.5px] font-semibold text-slate-500">
                    {t('bulkChange.wizard.setup.type', { defaultValue: 'Type' })}
                  </th>
                  <th className="whitespace-nowrap px-5 py-2.5 text-start text-[11.5px] font-semibold text-slate-500">
                    {t('bulkChange.wizard.setup.required', { defaultValue: 'Required' })}
                  </th>
                  <th className="whitespace-nowrap px-5 py-2.5 text-start text-[11.5px] font-semibold text-slate-500">
                    {t('bulkChange.wizard.setup.allowedValues', { defaultValue: 'Allowed values' })}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {template?.columns.map((column) => (
                  <tr key={column.key} className="hover:bg-slate-50 transition-colors">
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-xs font-medium text-slate-700">{column.key}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-sm text-slate-600">{describeAttribute(column)}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-sm text-slate-500">{column.type}</td>
                    <td className="whitespace-nowrap px-5 py-3">
                      {column.mandatory ? (
                        <span className="inline-flex items-center rounded-full bg-adaam-tint px-2 py-0.5 text-xs font-semibold text-adaam">
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
            {/* The identifier is ID for every table — the real, always-unique row key (SBR_ID
                is not unique on Contacts/Addresses: one establishment can have several active
                contacts or addresses). SBR_ID still appears as its own reference column so the
                operator can see which establishment a row belongs to. */}
            {otherMandatoryColumns.length === 0
              ? t('bulkChange.wizard.setup.noteIdColumnOnly', {
                  defaultValue:
                    'Only {{idColumn}} is mandatory — it matches each row to a record. Include only the columns you want to change; omitted columns are left untouched.',
                  idColumn: template?.idColumn ?? 'ID',
                })
              : t('bulkChange.wizard.setup.noteIdColumnAndOthers', {
                  defaultValue:
                    'Mandatory columns: {{mandatoryColumns}}. {{idColumn}} is the row key — it matches each row to a record. Every other column is optional; include only the ones you want to change, omitted columns are left untouched.',
                  idColumn: template?.idColumn ?? 'ID',
                  mandatoryColumns: [template?.idColumn ?? 'ID', ...otherMandatoryColumns].join(', '),
                })}
          </span>
        </div>
      </div>
    </div>
  );
}
