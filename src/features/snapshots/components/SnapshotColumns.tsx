import type { ColumnDef } from '@tanstack/react-table';
import type { SbrEstablishment, SbrEnterprise, SbrContact, SbrAddress } from '@/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { nullableText, formatDate } from '@/utils/format';

type TFunc = (key: string, options?: { lng?: string }) => string;

function MonoCell({ value }: { value: string | null | undefined }) {
  return value ? (
    <span className="font-mono text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{value}</span>
  ) : (
    <span className="text-slate-400">—</span>
  );
}

function TextCell({ value }: { value: string | null | undefined }) {
  return <span className="text-sm text-slate-700">{nullableText(value ?? null)}</span>;
}

function DateCell({ value }: { value: string | null | undefined }) {
  return <span className="text-sm text-slate-600">{formatDate(value ?? null)}</span>;
}

// Read-only columns for a frozen frame's tabs — no edit action, no pending-request badges
// (a snapshot can't have in-flight change requests), same cell styling as the live tables.

export const getSnapshotEstablishmentColumns = (t: TFunc): ColumnDef<SbrEstablishment>[] => [
  { accessorKey: 'SBR_ID', header: t('columns.SBR_ID'), cell: ({ getValue }) => <span className="font-mono text-xs font-medium text-red-600">{String(getValue())}</span> },
  { accessorKey: 'SOURCE_CODE', header: t('columns.SOURCE_CODE'), cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} /> },
  { accessorKey: 'NAME_ENU', header: t('columns.NAME_ENU'), cell: ({ getValue }) => <TextCell value={getValue<string | null>()} /> },
  { accessorKey: 'TRADE_NAME_ENU', header: t('columns.TRADE_NAME_ENU'), cell: ({ getValue }) => <TextCell value={getValue<string | null>()} /> },
  { accessorKey: 'EST_STATUS', header: t('columns.EST_STATUS'), cell: ({ getValue }) => <StatusBadge status={getValue<string | null>()} className="rounded-md" /> },
  { accessorKey: 'LEGAL_TYPE', header: t('columns.LEGAL_TYPE'), cell: ({ getValue }) => <TextCell value={getValue<string | null>()} /> },
  { accessorKey: 'SECTOR_ID', header: t('columns.SECTOR'), cell: ({ getValue }) => <TextCell value={getValue<string | null>()} /> },
  { accessorKey: 'EMPLOYMENT_COUNT', header: t('columns.EMPLOYMENT_COUNT'), cell: ({ getValue }) => <span className="text-sm text-slate-700">{getValue<number | null>() ?? '—'}</span> },
  { accessorKey: 'MAIN_BRANCH_FLG', header: t('columns.MAIN_BRANCH_FLG'), cell: ({ getValue }) => <TextCell value={getValue<string | null>()} /> },
  { accessorKey: 'VALID_FROM', header: t('columns.VALID_FROM'), cell: ({ getValue }) => <DateCell value={getValue<string | null>()} /> },
];

export const getSnapshotEnterpriseColumns = (t: TFunc): ColumnDef<SbrEnterprise>[] => [
  { accessorKey: 'ENTERPRISE_ID', header: t('columns.ENTERPRISE_ID'), cell: ({ getValue }) => <span className="font-mono text-xs font-medium text-[#77748B]">ENT-{String(getValue())}</span> },
  { accessorKey: 'NAME_ENU', header: t('columns.NAME'), cell: ({ getValue }) => <TextCell value={getValue<string | null>()} /> },
  { accessorKey: 'MAIN_CR', header: t('columns.MAIN_CR'), cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} /> },
  {
    accessorKey: 'ESTABLISHMENT_COUNT', header: t('columns.ESTABLISHMENTS'),
    cell: ({ getValue }) => {
      const count = Number(getValue<number>() ?? 0);
      return <span className="text-xs font-medium text-[#A71D3A]">{count} {count === 1 ? t('table.unit', { lng: 'en' }) : t('table.units', { lng: 'en' })}</span>;
    },
  },
  { accessorKey: 'LEGAL_TYPE', header: t('columns.LEGAL_TYPE'), cell: ({ getValue }) => <TextCell value={getValue<string | null>()} /> },
  { accessorKey: 'SECTOR_ID', header: t('columns.SECTOR'), cell: ({ getValue }) => <TextCell value={getValue<string | null>()} /> },
  { accessorKey: 'STATUS', header: t('columns.STATUS'), cell: ({ getValue }) => <StatusBadge status={getValue<string | null>()} className="rounded-md" /> },
  { accessorKey: 'MAIN_ESTABLISHMENT_SBR_ID', header: t('columns.MAIN_UNIT'), cell: ({ getValue }) => { const val = getValue<number | null>(); return val != null ? <span className="font-mono text-xs font-medium text-red-600">#{val}</span> : <span className="text-slate-400">—</span>; } },
  { accessorKey: 'VALID_FROM', header: t('columns.VALID_FROM'), cell: ({ getValue }) => <DateCell value={getValue<string | null>()} /> },
];

export const getSnapshotContactColumns = (t: TFunc): ColumnDef<SbrContact>[] => [
  { accessorKey: 'SBR_ID', header: t('columns.SBR_ID'), cell: ({ getValue }) => <span className="font-mono text-xs font-medium text-red-600">{String(getValue())}</span> },
  { accessorKey: 'CONTACT_NAME', header: t('columns.CONTACT_NAME'), cell: ({ getValue }) => <TextCell value={getValue<string | null>()} /> },
  { accessorKey: 'ROLE', header: t('columns.ROLE'), cell: ({ getValue }) => { const val = getValue<string | null>(); return val ? <span className="text-xs font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">{val}</span> : <span className="text-slate-400">—</span>; } },
  { accessorKey: 'PHONE', header: t('columns.PHONE'), cell: ({ getValue }) => <TextCell value={getValue<string | null>()} /> },
  { accessorKey: 'MOBILE', header: t('columns.MOBILE'), cell: ({ getValue }) => <TextCell value={getValue<string | null>()} /> },
  { accessorKey: 'EMAIL', header: t('columns.EMAIL'), cell: ({ getValue }) => <TextCell value={getValue<string | null>()} /> },
  { accessorKey: 'PO_BOX', header: t('columns.PO_BOX'), cell: ({ getValue }) => <TextCell value={getValue<string | null>()} /> },
  { accessorKey: 'WEBSITE', header: t('columns.WEBSITE'), cell: ({ getValue }) => <TextCell value={getValue<string | null>()} /> },
  { accessorKey: 'SOURCE_CODE', header: t('columns.SOURCE_CODE'), cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} /> },
  { accessorKey: 'PRIORITY', header: t('columns.PRIORITY'), cell: ({ getValue }) => <span className="text-sm text-slate-700">{getValue<number | null>() ?? '—'}</span> },
  { accessorKey: 'VALID_FROM', header: t('columns.VALID_FROM'), cell: ({ getValue }) => <DateCell value={getValue<string | null>()} /> },
  { accessorKey: 'VALID_TO', header: t('columns.VALID_TO'), cell: ({ getValue }) => <DateCell value={getValue<string | null>()} /> },
];

export const getSnapshotAddressColumns = (t: TFunc): ColumnDef<SbrAddress>[] => [
  { accessorKey: 'SBR_ID', header: t('columns.SBR_ID'), cell: ({ getValue }) => <span className="font-mono text-xs font-medium text-red-600">{String(getValue())}</span> },
  { accessorKey: 'MUNICIPALITY_ID', header: t('columns.MUNICIPALITY_ID'), cell: ({ getValue }) => <TextCell value={getValue<string | null>()} /> },
  { accessorKey: 'ZONE', header: t('columns.ZONE'), cell: ({ getValue }) => <TextCell value={getValue<string | null>()} /> },
  { accessorKey: 'STREET', header: t('columns.STREET'), cell: ({ getValue }) => <TextCell value={getValue<string | null>()} /> },
  { accessorKey: 'BUILDING_NO', header: t('columns.BUILDING_NO'), cell: ({ getValue }) => <TextCell value={getValue<string | null>()} /> },
  { accessorKey: 'UNIT_NO', header: t('columns.UNIT_NO'), cell: ({ getValue }) => <TextCell value={getValue<string | null>()} /> },
  { accessorKey: 'FLOOR_NO', header: t('columns.FLOOR_NO'), cell: ({ getValue }) => <TextCell value={getValue<string | null>()} /> },
  { accessorKey: 'QARS', header: t('columns.QARS'), cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} /> },
  { accessorKey: 'ELECTRICITY_NO', header: t('columns.ELECTRICITY_NO'), cell: ({ getValue }) => <TextCell value={getValue<string | null>()} /> },
  { accessorKey: 'LATITUDE', header: t('columns.LATITUDE'), cell: ({ getValue }) => <span className="font-mono text-xs text-slate-600">{nullableText(getValue<string | null>())}</span> },
  { accessorKey: 'LONGITUDE', header: t('columns.LONGITUDE'), cell: ({ getValue }) => <span className="font-mono text-xs text-slate-600">{nullableText(getValue<string | null>())}</span> },
  { accessorKey: 'SOURCE_CODE', header: t('columns.SOURCE_CODE'), cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} /> },
  { accessorKey: 'PRIORITY', header: t('columns.PRIORITY'), cell: ({ getValue }) => <span className="text-sm text-slate-700">{getValue<number | null>() ?? '—'}</span> },
  { accessorKey: 'VALID_FROM', header: t('columns.VALID_FROM'), cell: ({ getValue }) => <DateCell value={getValue<string | null>()} /> },
  { accessorKey: 'VALID_TO', header: t('columns.VALID_TO'), cell: ({ getValue }) => <DateCell value={getValue<string | null>()} /> },
];
