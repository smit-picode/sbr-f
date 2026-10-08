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

function ArabicCell({ value }: { value: unknown }) {
  return <span className="text-sm text-slate-700" lang="ar">{nullableText(value == null ? null : String(value))}</span>;
}

function SourceCell({ value }: { value: unknown }) {
  return <span className="text-xs text-slate-400">{nullableText(value == null ? null : String(value))}</span>;
}

function NumberCell({ value }: { value: unknown }) {
  return <span className="text-sm text-slate-700 tabular-nums">{formatNumber(typeof value === 'number' ? value : value == null ? null : Number(value))}</span>;
}

function DateCell({ value }: { value: unknown }) {
  return <span className="text-sm text-slate-600 whitespace-nowrap">{formatDate(value == null ? null : String(value))}</span>;
}

type Kind = 'id' | 'mono' | 'text' | 'arabic' | 'source' | 'number' | 'date' | 'status';

// [row key, column label key, English fallback, cell kind] — rows are raw frozen base-table rows.
type Spec = [string, string, string, Kind];

const SPECS: Record<SnapshotEntity, Spec[]> = {
  establishments: [
    ['SBR_ID', 'columns.SBR_ID', 'SBR ID', 'id'],
    ['SOURCE_CODE', 'columns.SOURCE_CODE', 'Source code', 'mono'],
    ['NAME_ENU', 'columns.NAME_ENU', 'Name (EN)', 'text'],
    ['NAME_ENU_SOURCE', 'columns.NAME_ENU_SOURCE', 'Name (EN) source', 'source'],
    ['NAME_ARA', 'columns.NAME_ARA', 'Name (AR)', 'arabic'],
    ['NAME_ARA_SOURCE', 'columns.NAME_ARA_SOURCE', 'Name (AR) source', 'source'],
    ['TRADE_NAME_ENU', 'columns.TRADE_NAME_ENU', 'Trade name (EN)', 'text'],
    ['TRADE_NAME_ENU_SOURCE', 'columns.TRADE_NAME_ENU_SOURCE', 'Trade name (EN) source', 'source'],
    ['TRADE_NAME_ARA', 'columns.TRADE_NAME_ARA', 'Trade name (AR)', 'arabic'],
    ['TRADE_NAME_ARA_SOURCE', 'columns.TRADE_NAME_ARA_SOURCE', 'Trade name (AR) source', 'source'],
    ['NPC_NAME_ENU', 'columns.NPC_NAME_ENU', 'NPC name (EN)', 'text'],
    ['NPC_NAME_ENU_SOURCE', 'columns.NPC_NAME_ENU_SOURCE', 'NPC name (EN) source', 'source'],
    ['NPC_NAME_ARA', 'columns.NPC_NAME_ARA', 'NPC name (AR)', 'arabic'],
    ['NPC_NAME_ARA_SOURCE', 'columns.NPC_NAME_ARA_SOURCE', 'NPC name (AR) source', 'source'],
    ['EST_STATUS', 'columns.EST_STATUS', 'EST status', 'status'],
    ['EST_STATUS_SOURCE', 'columns.EST_STATUS_SOURCE', 'EST status source', 'source'],
    ['EST_STATUS_CATEGORY', 'columns.EST_STATUS_CATEGORY', 'EST status category', 'text'],
    ['EST_STATUS_CATEGORY_SOURCE', 'columns.EST_STATUS_CATEGORY_SOURCE', 'EST status category source', 'source'],
    ['LEGAL_TYPE', 'columns.LEGAL_TYPE', 'Legal type', 'text'],
    ['LEGAL_TYPE_SOURCE', 'columns.LEGAL_TYPE_SOURCE', 'Legal type source', 'source'],
    ['SECTOR_ID', 'columns.SECTOR', 'Sector', 'text'],
    ['SECTOR_ID_SOURCE', 'columns.SECTOR_ID_SOURCE', 'Sector ID source', 'source'],
    ['ISIC_CODE', 'columns.ISIC_CODE', 'ISIC code', 'mono'],
    ['ISIC_CODE_SOURCE', 'columns.ISIC_CODE_SOURCE', 'ISIC code source', 'source'],
    ['MAIN_BRANCH_FLG', 'columns.MAIN_BRANCH_FLG', 'Main branch flag', 'text'],
    ['MAIN_BRANCH_FLG_SOURCE', 'columns.MAIN_BRANCH_FLG_SOURCE', 'Main branch flag source', 'source'],
    ['MAIN_BRANCH_SBR_ID', 'columns.MAIN_BRANCH_SBR_ID', 'Main branch SBR ID', 'id'],
    ['MAIN_BRANCH_SBR_ID_SOURCE', 'columns.MAIN_BRANCH_SBR_ID_SOURCE', 'Main branch SBR ID source', 'source'],
    ['HOLDING_COMPANY_FLG', 'columns.HOLDING_COMPANY_FLG', 'Holding company flag', 'text'],
    ['HOLDING_COMPANY_FLG_SOURCE', 'columns.HOLDING_COMPANY_FLG_SOURCE', 'Holding company flag source', 'source'],
    ['EMPLOYMENT_COUNT', 'columns.EMPLOYMENT_COUNT', 'Employment count', 'number'],
    ['EMPLOYMENT_COUNT_SOURCE', 'columns.EMPLOYMENT_COUNT_SOURCE', 'Employment count source', 'source'],
    ['MOCI_ORG_ID', 'columns.MOCI_ORG_ID', 'MOCI org ID', 'mono'],
    ['MOCI_CR_NUM', 'columns.MOCI_CR_NUM', 'MOCI CR no.', 'mono'],
    ['MOCI_CP_NUM', 'columns.MOCI_CP_NUM', 'MOCI CP no.', 'mono'],
    ['QFC_NUMBER', 'columns.QFC_NUMBER', 'QFC number', 'mono'],
    ['QFZ_SOURCE_ID', 'columns.QFZ_SOURCE_ID', 'QFZ source ID', 'mono'],
    ['QSTP_REG_NUM', 'columns.QSTP_REG_NUM', 'QSTP reg no.', 'mono'],
    ['QSTP_TAX_REG_NUM', 'columns.QSTP_TAX_REG_NUM', 'QSTP tax reg no.', 'mono'],
    ['QSTP_PARENT_REG_NUM', 'columns.QSTP_PARENT_REG_NUM', 'QSTP parent reg no.', 'mono'],
    ['FARM_NO', 'columns.FARM_NO', 'Farm no.', 'mono'],
    ['EID', 'columns.EID', 'EID', 'mono'],
    ['CR_ISSUE_DATE', 'columns.CR_ISSUE_DATE', 'CR issue date', 'date'],
    ['CR_EXPIRY_DATE', 'columns.CR_EXPIRY_DATE', 'CR expiry date', 'date'],
    ['CR_CANCEL_DATE', 'columns.CR_CANCEL_DATE', 'CR cancel date', 'date'],
    ['CP_ISSUE_DATE', 'columns.CP_ISSUE_DATE', 'CP issue date', 'date'],
    ['CP_END_DATE', 'columns.CP_END_DATE', 'CP end date', 'date'],
    ['CP_CANCEL_DATE', 'columns.CP_CANCEL_DATE', 'CP cancel date', 'date'],
    ['REG_DATE', 'columns.REG_DATE', 'Reg date', 'date'],
    ['REG_EXPIRY_DATE', 'columns.REG_EXPIRY_DATE', 'Reg expiry date', 'date'],
    ['REG_CANCEL_DATE', 'columns.REG_CANCEL_DATE', 'Reg cancel date', 'date'],
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
    case 'arabic': return <ArabicCell value={value} />;
    case 'source': return <SourceCell value={value} />;
    case 'number': return <NumberCell value={value} />;
    case 'date': return <DateCell value={value} />;
    case 'status': return <StatusBadge status={value == null ? null : String(value)} className="rounded-md" />;
    default: return <TextCell value={value} />;
  }
}

export interface SnapshotExportColumn { key: string; label: string; kind: Kind }

// The same columns as the table, as plain labels and kinds, for the Excel export.
export function getSnapshotExportColumns(entity: SnapshotEntity, t: TFunction): SnapshotExportColumn[] {
  return SPECS[entity].map(([key, labelKey, fallback, kind]) => ({ key, label: t(labelKey, { defaultValue: fallback }), kind }));
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
