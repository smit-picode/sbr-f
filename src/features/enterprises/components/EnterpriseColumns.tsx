import type { ColumnDef } from '@tanstack/react-table';
import type { SbrEnterprise } from '@/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { nullableText, formatDate } from '@/utils/format';
import { Layers } from 'lucide-react';
import { PendingBadge } from '@/components/common/PendingBadge';

type TFunc = (key: string, options?: { lng?: string }) => string;

export const getEnterpriseColumns = (t: TFunc): ColumnDef<SbrEnterprise>[] => [
  {
    accessorKey: 'ENTERPRISE_ID',
    header: t('columns.ENTERPRISE_ID', { lng: 'en' }),
    cell: ({ getValue, row }) => (
      <span className="flex items-center gap-1.5">
        <span className="font-mono text-xs font-medium text-[#77748B]">ENT-{String(getValue())}</span>
        {row.original.HAS_PENDING_REQUEST && <PendingBadge />}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'NAME_ENU',
    header: t('columns.NAME', { lng: 'en' }),
    cell: ({ getValue }) => (
      <div className="min-w-[220px]">
        <p className="font-medium text-slate-800 text-sm leading-snug">{nullableText(getValue<string | null>())}</p>
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'MAIN_CR',
    header: t('columns.MAIN_CR', { lng: 'en' }),
    cell: ({ getValue }) => {
      const val = getValue<string | null>();
      return val ? (
        <span className="font-mono text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{val}</span>
      ) : (
        <span className="text-slate-400">—</span>
      );
    },
  },
  {
    accessorKey: 'ESTABLISHMENT_COUNT',
    header: t('columns.ESTABLISHMENTS', { lng: 'en' }),
    cell: ({ getValue }) => {
      const count = Number(getValue<number>() ?? 0);
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-[#A71D3A]/10 px-2 py-0.5 text-xs font-medium text-[#A71D3A]">
          <Layers className="h-3.5 w-3.5" />
          {count} {count === 1 ? t('table.unit', { lng: 'en' }) : t('table.units', { lng: 'en' })}
        </span>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'LEGAL_TYPE',
    header: t('columns.LEGAL_TYPE', { lng: 'en' }),
    cell: ({ getValue }) => (
      <span className="text-sm text-slate-700" lang="ar">{nullableText(getValue<string | null>())}</span>
    ),
  },
  {
    accessorKey: 'SECTOR_ID',
    header: t('columns.SECTOR', { lng: 'en' }),
    cell: ({ getValue }) => {
      const val = getValue<string | null>();
      return val ? <Badge variant="secondary" className="rounded-md">{val}</Badge> : <span className="text-slate-400">—</span>;
    },
  },
  {
    accessorKey: 'STATUS',
    header: t('columns.STATUS', { lng: 'en' }),
    cell: ({ getValue }) => <StatusBadge status={getValue<string | null>()} className="rounded-md" />,
    enableSorting: true,
  },
  {
    accessorKey: 'MAIN_ESTABLISHMENT_SBR_ID',
    header: t('columns.MAIN_UNIT', { lng: 'en' }),
    cell: ({ getValue }) => {
      const val = getValue<number | null>();
      return val != null ? (
        <span className="font-mono text-xs font-medium text-red-600">#{val}</span>
      ) : (
        <span className="text-slate-400">—</span>
      );
    },
  },
  {
    accessorKey: 'VALID_FROM',
    header: t('columns.VALID_FROM', { lng: 'en' }),
    cell: ({ getValue }) => <span className="text-sm text-slate-600">{formatDate(getValue<string | null>())}</span>,
  },
];
