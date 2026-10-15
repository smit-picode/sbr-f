import type { ColumnDef } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import type { SnapshotEntity, SnapshotRow, ColumnFilterOption } from '@/types';
import { Layers, Tag } from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { nullableText, formatDate, formatNumber } from '@/utils/format';

function MonoCell({ value }: { value: unknown }) {
  return value != null && value !== '' ? (
    <span className="font-mono text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{String(value)}</span>
  ) : (
    <span className="text-slate-400">—</span>
  );
}

function IdCell({ value, prefix = '' }: { value: unknown; prefix?: string }) {
  return value != null ? <span className="font-mono text-xs font-medium text-adaam">{prefix}{String(value)}</span> : <span className="text-slate-400">—</span>;
}

function TextCell({ value }: { value: unknown }) {
  return <span className="text-sm text-slate-700">{nullableText(value == null ? null : String(value))}</span>;
}

function SourceCell({ value }: { value: unknown }) {
  return <span className="text-xs text-slate-400">{nullableText(value == null ? null : String(value))}</span>;
}

function EnterpriseIdCell({ value }: { value: unknown }) {
  return value != null ? <span className="font-mono text-xs font-medium text-[#77748B]">ENT-{String(value)}</span> : <span className="text-slate-400">—</span>;
}

function BadgeCell({ value }: { value: unknown }) {
  return value != null && value !== '' ? <Badge variant="secondary" className="rounded-md">{String(value)}</Badge> : <span className="text-slate-400">—</span>;
}

function MainFlagCell({ value }: { value: unknown }) {
  if (value == null || value === '') return <span className="text-slate-400">—</span>;
  return value === 'MAIN' ? <Badge className="rounded-md bg-[#A29374] text-white font-bold">MAIN</Badge> : <span className="text-xs text-slate-600">{String(value)}</span>;
}

// A frozen count that predates the column is empty, so it shows a dash rather than 0 units.
function UnitCountCell({ value, t }: { value: unknown; t: TFunction }) {
  if (value == null || value === '') return <span className="text-slate-400">—</span>;
  const count = Number(value);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-[#A29374]/10 px-2 py-0.5 text-xs font-medium text-[#A29374]">
      <Layers className="h-3.5 w-3.5" />
      {count} {count === 1 ? t('table.unit', { lng: 'en' }) : t('table.units', { lng: 'en' })}
    </span>
  );
}

function TagsCell({ value }: { value: unknown }) {
  if (value == null || value === '') return <span className="text-slate-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {String(value).split(',').map((code) => (
        <span key={code} className="inline-flex items-center gap-1 rounded-full bg-[#F4F0E8] px-2 py-0.5 text-[10.5px] font-semibold text-[#87795D]">
          <Tag className="h-2.5 w-2.5" />{code.trim()}
        </span>
      ))}
    </div>
  );
}

function NumberCell({ value }: { value: unknown }) {
  return <span className="text-sm text-slate-700 tabular-nums">{formatNumber(typeof value === 'number' ? value : value == null ? null : Number(value))}</span>;
}

function DateCell({ value }: { value: unknown }) {
  return <span className="text-sm text-slate-600 whitespace-nowrap">{formatDate(value == null ? null : String(value))}</span>;
}

type Kind = 'id' | 'mono' | 'text' | 'number' | 'date' | 'status' | 'source' | 'enterpriseId' | 'badge' | 'mainFlag' | 'unitRef' | 'unitCount' | 'tags';

// [row key, column label key, English fallback, cell kind] — rows are raw frozen base-table rows.
type Spec = [string, string, string, Kind];

const SPECS: Record<SnapshotEntity, Spec[]> = {
  establishments: [
    ['SBR_ID', 'columns.SBR_ID', 'SBR ID', 'id'],
    ['SOURCE_CODE', 'columns.SOURCE_CODE', 'Source code', 'mono'],
    ['NAME_ENU', 'columns.NAME_ENU', 'Name (EN)', 'text'],
    ['NAME_ENU_SOURCE', 'columns.NAME_ENU_SOURCE', 'Name (EN) source', 'source'],
    ['NAME_ARA', 'columns.NAME_ARA', 'Name (AR)', 'text'],
    ['NAME_ARA_SOURCE', 'columns.NAME_ARA_SOURCE', 'Name (AR) source', 'source'],
    ['TRADE_NAME_ENU', 'columns.TRADE_NAME_ENU', 'Trade name (EN)', 'text'],
    ['TRADE_NAME_ENU_SOURCE', 'columns.TRADE_NAME_ENU_SOURCE', 'Trade name (EN) source', 'source'],
    ['TRADE_NAME_ARA', 'columns.TRADE_NAME_ARA', 'Trade name (AR)', 'text'],
    ['TRADE_NAME_ARA_SOURCE', 'columns.TRADE_NAME_ARA_SOURCE', 'Trade name (AR) source', 'source'],
    ['NPC_NAME_ENU', 'columns.NPC_NAME_ENU', 'NPC name (EN)', 'text'],
    ['NPC_NAME_ENU_SOURCE', 'columns.NPC_NAME_ENU_SOURCE', 'NPC name (EN) source', 'source'],
    ['NPC_NAME_ARA', 'columns.NPC_NAME_ARA', 'NPC name (AR)', 'text'],
    ['NPC_NAME_ARA_SOURCE', 'columns.NPC_NAME_ARA_SOURCE', 'NPC name (AR) source', 'source'],
    ['EST_STATUS', 'columns.EST_STATUS', 'EST status', 'status'],
    ['EST_STATUS_SOURCE', 'columns.EST_STATUS_SOURCE', 'EST status source', 'source'],
    ['EST_STATUS_CATEGORY', 'columns.EST_STATUS_CATEGORY', 'EST status category', 'text'],
    ['EST_STATUS_CATEGORY_SOURCE', 'columns.EST_STATUS_CATEGORY_SOURCE', 'EST status category source', 'source'],
    ['LEGAL_TYPE', 'columns.LEGAL_TYPE', 'Legal type', 'text'],
    ['LEGAL_TYPE_SOURCE', 'columns.LEGAL_TYPE_SOURCE', 'Legal type source', 'source'],
    ['SECTOR_ID', 'columns.SECTOR_ID', 'Sector ID', 'badge'],
    ['SECTOR_ID_SOURCE', 'columns.SECTOR_ID_SOURCE', 'Sector ID source', 'source'],
    ['ISIC_CODE', 'columns.ISIC_CODE', 'ISIC code', 'mono'],
    ['ISIC_CODE_SOURCE', 'columns.ISIC_CODE_SOURCE', 'ISIC code source', 'source'],
    ['ISIC_CODE_CONFIDENCE', 'columns.ISIC_CODE_CONFIDENCE', 'ISIC code confidence', 'number'],
    ['MAIN_BRANCH_FLG', 'columns.MAIN_BRANCH_FLG', 'Main branch flag', 'mainFlag'],
    ['MAIN_BRANCH_FLG_SOURCE', 'columns.MAIN_BRANCH_FLG_SOURCE', 'Main branch flag source', 'source'],
    ['MAIN_BRANCH_SBR_ID', 'columns.MAIN_BRANCH_SBR_ID', 'Main branch SBR ID', 'id'],
    ['MAIN_BRANCH_SBR_ID_SOURCE', 'columns.MAIN_BRANCH_SBR_ID_SOURCE', 'Main branch SBR ID source', 'source'],
    ['ASSOCIATED_ENTERPRISE_ID', 'columns.ASSOCIATED_ENTERPRISE_ID', 'Enterprise', 'id'],
    ['ASSOCIATED_ENTERPRISE_ID_SOURCE', 'columns.ASSOCIATED_ENTERPRISE_ID_SOURCE', 'Enterprise source', 'source'],
    ['HOLDING_COMPANY_FLG', 'columns.HOLDING_COMPANY_FLG', 'Holding company flag', 'text'],
    ['HOLDING_COMPANY_FLG_SOURCE', 'columns.HOLDING_COMPANY_FLG_SOURCE', 'Holding company flag source', 'source'],
    ['EMPLOYMENT_COUNT', 'columns.EMPLOYMENT_COUNT', 'Employment count', 'number'],
    ['EMPLOYMENT_COUNT_SOURCE', 'columns.EMPLOYMENT_COUNT_SOURCE', 'Employment count source', 'source'],
    ['EMPLOYMENT_SIZE_CATEGORY', 'columns.EMPLOYMENT_SIZE_CATEGORY', 'Employment size category', 'text'],
    ['MOCI_ORG_ID', 'columns.MOCI_ORG_ID', 'MOCI org ID', 'mono'],
    ['MOCI_CR_NUM', 'columns.MOCI_CR_NUM', 'MOCI CR number', 'mono'],
    ['MOCI_CP_NUM', 'columns.MOCI_CP_NUM', 'MOCI CP number', 'mono'],
    ['QFC_NUMBER', 'columns.QFC_NUMBER', 'QFC number', 'mono'],
    ['QFZ_SOURCE_ID', 'columns.QFZ_SOURCE_ID', 'QFZ source ID', 'mono'],
    ['QSTP_REG_NUM', 'columns.QSTP_REG_NUM', 'QSTP reg number', 'mono'],
    ['QSTP_TAX_REG_NUM', 'columns.QSTP_TAX_REG_NUM', 'QSTP tax reg number', 'mono'],
    ['QSTP_PARENT_REG_NUM', 'columns.QSTP_PARENT_REG_NUM', 'QSTP parent reg number', 'mono'],
    ['FARM_NO', 'columns.FARM_NO', 'Farm number', 'mono'],
    ['EID', 'columns.EID', 'EID', 'mono'],
    ['EID_SOURCE', 'columns.EID_SOURCE', 'EID source', 'source'],
    ['CR_ISSUE_DATE', 'columns.CR_ISSUE_DATE', 'CR issue date', 'date'],
    ['CR_EXPIRY_DATE', 'columns.CR_EXPIRY_DATE', 'CR expiry date', 'date'],
    ['CR_CANCEL_DATE', 'columns.CR_CANCEL_DATE', 'CR cancel date', 'date'],
    ['CP_ISSUE_DATE', 'columns.CP_ISSUE_DATE', 'CP issue date', 'date'],
    ['CP_END_DATE', 'columns.CP_END_DATE', 'CP end date', 'date'],
    ['CP_CANCEL_DATE', 'columns.CP_CANCEL_DATE', 'CP cancel date', 'date'],
    ['REG_DATE', 'columns.REG_DATE', 'Registration date', 'date'],
    ['REG_EXPIRY_DATE', 'columns.REG_EXPIRY_DATE', 'Registration expiry date', 'date'],
    ['REG_CANCEL_DATE', 'columns.REG_CANCEL_DATE', 'Registration cancel date', 'date'],
  ],
  enterprises: [
    ['ENTERPRISE_ID', 'columns.ENTERPRISE_ID', 'Enterprise', 'enterpriseId'],
    ['NAME_ENU', 'columns.NAME', 'Name', 'text'],
    ['MAIN_CR', 'columns.MAIN_CR', 'Main CR', 'mono'],
    ['ESTABLISHMENT_COUNT', 'columns.ESTABLISHMENTS', 'Establishments', 'unitCount'],
    ['LEGAL_TYPE', 'columns.LEGAL_TYPE', 'Legal type', 'text'],
    ['SECTOR_ID', 'columns.SECTOR', 'Sector', 'badge'],
    ['STATUS', 'columns.STATUS', 'Status', 'status'],
    ['MAIN_ESTABLISHMENT_SBR_ID', 'columns.MAIN_UNIT', 'Main unit', 'unitRef'],
    ['VALID_FROM', 'columns.VALID_FROM', 'Valid from', 'date'],
  ],
  enterprise_groups: [
    ['ENTERPRISE_GROUP_ID', 'columns.ENTERPRISE_GROUP_ID', 'Enterprise group', 'id'],
    ['NAME_ENU', 'columns.NAME', 'Name', 'text'],
    ['TYPE', 'columns.TYPE', 'Type', 'text'],
    ['STATUS', 'columns.STATUS', 'Status', 'status'],
    ['UCI_NAME', 'columns.UCI_NAME', 'UCI name', 'text'],
    ['UCI_COUNTRY', 'columns.UCI_COUNTRY', 'UCI country', 'text'],
    ['MULTINATIONAL_GROUP_FLG', 'columns.MULTINATIONAL_GROUP_FLG', 'Multinational', 'text'],
    ['FOREIGN_CONTROLLED_GROUP_FLG', 'columns.FOREIGN_CONTROLLED_GROUP_FLG', 'Foreign controlled', 'text'],
    ['PRINCIPAL_ISIC_2DIGIT', 'columns.PRINCIPAL_ISIC_2DIGIT', 'Principal ISIC', 'mono'],
    ['ENTERPRISE_COUNT', 'columns.ENTERPRISES', 'Enterprises', 'number'],
    ['ESTABLISHMENT_COUNT', 'columns.ESTABLISHMENTS', 'Establishments', 'number'],
    ['EMPLOYEE_COUNT', 'columns.EMPLOYEES', 'Employees', 'number'],
    ['TOTAL_EMPLOYEES', 'columns.TOTAL_EMPLOYEES', 'Total employees', 'number'],
    ['VALID_FROM', 'columns.VALID_FROM', 'Valid from', 'date'],
  ],
  contacts: [
    ['SBR_ID', 'columns.SBR_ID', 'SBR ID', 'id'],
    ['CONTACT_NAME', 'columns.CONTACT_NAME', 'Contact name', 'text'],
    ['ROLE', 'columns.ROLE', 'Role', 'text'],
    ['PHONE', 'columns.PHONE', 'Phone', 'text'],
    ['MOBILE', 'columns.MOBILE', 'Mobile', 'text'],
    ['EMAIL', 'columns.EMAIL', 'Email', 'text'],
    ['PO_BOX', 'columns.PO_BOX', 'P.O. Box', 'text'],
    ['WEBSITE', 'columns.WEBSITE', 'Website', 'text'],
    ['SOURCE_CODE', 'columns.SOURCE_CODE', 'Source', 'mono'],
    ['TAGS', 'columns.TAGS', 'Tags', 'tags'],
    ['VALID_FROM', 'columns.VALID_FROM', 'Valid from', 'date'],
  ],
  addresses: [
    ['SBR_ID', 'columns.SBR_ID', 'SBR ID', 'id'],
    ['MUNICIPALITY_ID', 'columns.MUNICIPALITY_ID', 'Municipality', 'text'],
    ['ZONE', 'columns.ZONE', 'Zone', 'text'],
    ['STREET', 'columns.STREET', 'Street', 'text'],
    ['BUILDING_NO', 'columns.BUILDING_NO', 'Building no.', 'text'],
    ['UNIT_NO', 'columns.UNIT_NO', 'Unit no.', 'text'],
    ['FLOOR_NO', 'columns.FLOOR_NO', 'Floor no.', 'text'],
    ['QARS', 'columns.QARS', 'QARS', 'mono'],
    ['ELECTRICITY_NO', 'columns.ELECTRICITY_NO', 'Electricity no.', 'text'],
    ['LATITUDE', 'columns.LATITUDE', 'Latitude', 'mono'],
    ['LONGITUDE', 'columns.LONGITUDE', 'Longitude', 'mono'],
    ['SOURCE_CODE', 'columns.SOURCE_CODE', 'Source', 'mono'],
    ['PRIORITY', 'columns.PRIORITY', 'Priority', 'number'],
    ['VALID_FROM', 'columns.VALID_FROM', 'Valid from', 'date'],
  ],
};

function renderCell(kind: Kind, value: unknown, t: TFunction) {
  switch (kind) {
    case 'enterpriseId': return <EnterpriseIdCell value={value} />;
    case 'badge': return <BadgeCell value={value} />;
    case 'mainFlag': return <MainFlagCell value={value} />;
    case 'unitRef': return <IdCell value={value} prefix="#" />;
    case 'tags': return <TagsCell value={value} />;
    case 'unitCount': return <UnitCountCell value={value} t={t} />;
    case 'id': return <IdCell value={value} />;
    case 'mono': return <MonoCell value={value} />;
    case 'number': return <NumberCell value={value} />;
    case 'date': return <DateCell value={value} />;
    case 'source': return <SourceCell value={value} />;
    case 'status': return <StatusBadge status={value == null ? null : String(value)} className="rounded-md" />;
    default: return <TextCell value={value} />;
  }
}

// Every column a frozen row has: the known ones first, in their usual order and format, then the rest in table order.
const HIDDEN = new Set(['SNAPSHOT_ID', 'ID', 'SCD2_NOTE', 'CREATED_AT', 'UPDATED_AT', 'PIPELINE_ID', 'SRC_HASH', 'ROW_HASH', 'ANNUAL_TURNOVER', 'TOTAL_TURNOVER']);
const DATE_KEY = /(_DATE|_AT|^VALID_FROM|^VALID_TO)$/;
const MONO_KEY = /(_SOURCE|_CODE|_NUM|_ID)$/;
// Columns of a few repeating values, whose filter rows start as "is any of" with the value list.
const PICK_KEY = /(_SOURCE|_FLG|_FLAG|STATUS|STATUS_CATEGORY|SECTOR_ID|LEGAL_TYPE|ISIC_CODE|_TYPE|_COUNTRY|CATEGORY|ROLE|MUNICIPALITY_ID|ZONE)$/;

// Columns the procedure may not return yet: shown only once the rows carry them (until then the first page decides).
const OPTIONAL_KEYS: Partial<Record<SnapshotEntity, Set<string>>> = {
  enterprises: new Set(['MAIN_CR', 'ESTABLISHMENT_COUNT', 'LEGAL_TYPE']),
  contacts: new Set(['TAGS']),
  enterprise_groups: new Set(['TYPE', 'ENTERPRISE_COUNT', 'ESTABLISHMENT_COUNT', 'EMPLOYEE_COUNT']),
};

// Versioning columns the live Establishments list does not show, so the frozen copy leaves them out too.
const EXTRA_HIDDEN: Partial<Record<SnapshotEntity, Set<string>>> = {
  establishments: new Set(['VALID_FROM', 'VALID_TO']),
  addresses: new Set(['ADDRESS_TEXT']),
};

// Tabs that show exactly the live list's columns and nothing else from the frozen row.
const EXACT_ENTITIES = new Set<SnapshotEntity>(['enterprises']);

const isOptionalKey = (entity: SnapshotEntity, key: string) =>
  entity === 'establishments' ? key !== 'SBR_ID' : !!OPTIONAL_KEYS[entity]?.has(key);

function inferKind(key: string, sample: unknown): Kind {
  if (DATE_KEY.test(key)) return 'date';
  if (typeof sample === 'number') return MONO_KEY.test(key) ? 'mono' : 'number';
  return MONO_KEY.test(key) ? 'mono' : 'text';
}

const humanize = (key: string) => key.toLowerCase().split('_').map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(' ');

function snapshotSpecs(entity: SnapshotEntity, rows: SnapshotRow[]): Spec[] {
  const knownAll = SPECS[entity];
  const knownKeys = new Set(knownAll.map(([key]) => key));
  const known = rows.length ? knownAll.filter(([key]) => !isOptionalKey(entity, key) || key in rows[0]) : knownAll;
  const extra: Spec[] = EXACT_ENTITIES.has(entity) ? [] : Object.keys(rows[0] ?? {})
    .filter((key) => !knownKeys.has(key) && !HIDDEN.has(key) && !EXTRA_HIDDEN[entity]?.has(key))
    .map((key) => [key, `columns.${key}`, humanize(key), inferKind(key, rows.find((r) => r[key] != null)?.[key])]);
  return [...known, ...extra];
}

// Read-only columns for a frozen frame's tabs — no edit action, no pending-request badges.
export function getSnapshotColumns(entity: SnapshotEntity, t: TFunction, rows: SnapshotRow[] = []): ColumnDef<SnapshotRow>[] {
  return snapshotSpecs(entity, rows).map(([key, labelKey, fallback, kind]) => ({
    id: key,
    accessorFn: (row) => row[key],
    header: t(labelKey, { defaultValue: fallback }),
    cell: ({ getValue }) => renderCell(kind, getValue(), t),
  }));
}

// Filter options for the same columns; numeric values come back as JSON numbers, so the sample decides number vs text.
export function getSnapshotFilterColumns(entity: SnapshotEntity, t: TFunction, rows: SnapshotRow[] = []): ColumnFilterOption[] {
  return snapshotSpecs(entity, rows).map(([key, labelKey, fallback, kind]) => ({
    value: key,
    label: t(labelKey, { defaultValue: fallback }),
    type: kind === 'date' ? 'date' : typeof rows.find((r) => r[key] != null)?.[key] === 'number' ? 'number' : 'text',
    pick: PICK_KEY.test(key),
  }));
}
