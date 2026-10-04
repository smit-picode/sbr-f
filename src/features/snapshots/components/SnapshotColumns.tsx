import type { ColumnDef } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import type { SnapshotEntity, SnapshotRow } from '@/types';
import { StatusBadge } from '@/components/common/StatusBadge';
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

function NumberCell({ value }: { value: unknown }) {
  return <span className="text-sm text-slate-700 tabular-nums">{formatNumber(typeof value === 'number' ? value : value == null ? null : Number(value))}</span>;
}

function DateCell({ value }: { value: unknown }) {
  return <span className="text-sm text-slate-600 whitespace-nowrap">{formatDate(value == null ? null : String(value))}</span>;
}

type Kind = 'id' | 'mono' | 'text' | 'number' | 'date' | 'status';

// [row key, column label key, English fallback, cell kind] — rows are raw frozen base-table rows.
type Spec = [string, string, string, Kind];

const SPECS: Record<SnapshotEntity, Spec[]> = {
  establishments: [
    ['SBR_ID', 'columns.SBR_ID', 'SBR ID', 'id'],
    ['SOURCE_CODE', 'columns.SOURCE_CODE', 'Source', 'mono'],
    ['NAME_ENU', 'columns.NAME_ENU', 'Name (EN)', 'text'],
    ['TRADE_NAME_ENU', 'columns.TRADE_NAME_ENU', 'Trade name (EN)', 'text'],
    ['EST_STATUS', 'columns.EST_STATUS', 'Status', 'status'],
    ['LEGAL_TYPE', 'columns.LEGAL_TYPE', 'Legal type', 'text'],
    ['SECTOR_ID', 'columns.SECTOR', 'Sector', 'text'],
    ['ISIC_CODE', 'columns.ISIC_CODE', 'ISIC code', 'mono'],
    ['EMPLOYMENT_COUNT', 'columns.EMPLOYMENT_COUNT', 'Employment count', 'number'],
    ['MAIN_BRANCH_FLG', 'columns.MAIN_BRANCH_FLG', 'Main / branch', 'text'],
    ['ASSOCIATED_ENTERPRISE_ID', 'columns.ASSOCIATED_ENTERPRISE_ID', 'Enterprise', 'id'],
    ['VALID_FROM', 'columns.VALID_FROM', 'Valid from', 'date'],
  ],
  enterprises: [
    ['ENTERPRISE_ID', 'columns.ENTERPRISE_ID', 'Enterprise', 'id'],
    ['NAME_ENU', 'columns.NAME', 'Name', 'text'],
    ['STATUS', 'columns.STATUS', 'Status', 'status'],
    ['SECTOR_ID', 'columns.SECTOR', 'Sector', 'text'],
    ['ISIC_CODE', 'columns.ISIC_CODE', 'ISIC code', 'mono'],
    ['EMPLOYMENT_COUNT', 'columns.EMPLOYMENT_COUNT', 'Employment count', 'number'],
    ['ANNUAL_TURNOVER', 'columns.ANNUAL_TURNOVER', 'Annual turnover', 'number'],
    ['ENTERPRISE_GROUP_ID', 'columns.ENTERPRISE_GROUP_ID', 'Enterprise group', 'id'],
    ['MAIN_ESTABLISHMENT_SBR_ID', 'columns.MAIN_UNIT', 'Main unit', 'id'],
    ['VALID_FROM', 'columns.VALID_FROM', 'Valid from', 'date'],
  ],
  enterprise_groups: [
    ['ENTERPRISE_GROUP_ID', 'columns.ENTERPRISE_GROUP_ID', 'Enterprise group', 'id'],
    ['NAME_ENU', 'columns.NAME', 'Name', 'text'],
    ['STATUS', 'columns.STATUS', 'Status', 'status'],
    ['UCI_NAME', 'columns.UCI_NAME', 'UCI name', 'text'],
    ['UCI_COUNTRY', 'columns.UCI_COUNTRY', 'UCI country', 'text'],
    ['MULTINATIONAL_GROUP_FLG', 'columns.MULTINATIONAL_GROUP_FLG', 'Multinational', 'text'],
    ['FOREIGN_CONTROLLED_GROUP_FLG', 'columns.FOREIGN_CONTROLLED_GROUP_FLG', 'Foreign controlled', 'text'],
    ['PRINCIPAL_ISIC_2DIGIT', 'columns.PRINCIPAL_ISIC_2DIGIT', 'Principal ISIC', 'mono'],
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
    ['PRIORITY', 'columns.PRIORITY', 'Priority', 'number'],
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

function renderCell(kind: Kind, value: unknown) {
  switch (kind) {
    case 'id': return <IdCell value={value} />;
    case 'mono': return <MonoCell value={value} />;
    case 'number': return <NumberCell value={value} />;
    case 'date': return <DateCell value={value} />;
    case 'status': return <StatusBadge status={value == null ? null : String(value)} className="rounded-md" />;
    default: return <TextCell value={value} />;
  }
}

// Read-only columns for a frozen frame's tabs — no edit action, no pending-request badges.
export function getSnapshotColumns(entity: SnapshotEntity, t: TFunction): ColumnDef<SnapshotRow>[] {
  return SPECS[entity].map(([key, labelKey, fallback, kind]) => ({
    id: key,
    accessorFn: (row) => row[key],
    header: t(labelKey, { defaultValue: fallback }),
    cell: ({ getValue }) => renderCell(kind, getValue()),
  }));
}
