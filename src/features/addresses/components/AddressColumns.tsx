import type { ColumnDef } from '@tanstack/react-table';
import type { SbrAddress } from '@/types';
import { nullableText, formatDate } from '@/utils/format';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { PendingBadge } from '@/components/common/PendingBadge';
import env from '@/config/env';

type TFunc = (key: string, options?: { lng?: string }) => string;

export const getAddressColumns = (onEdit: (row: SbrAddress) => void, t: TFunc, canEdit = true): ColumnDef<SbrAddress>[] => [
  {
    accessorKey: 'SBR_ID',
    header: t('columns.SBR_ID'),
    cell: ({ getValue, row }) => (
      <span className="flex items-center gap-1.5">
        <span className="font-mono text-xs font-medium text-red-600">{String(getValue())}</span>
        {row.original.HAS_PENDING_REQUEST && <PendingBadge />}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'MUNICIPALITY_ID',
    header: t('columns.MUNICIPALITY_ID'),
    cell: ({ getValue }) => <span className="text-sm text-slate-700">{nullableText(getValue<string | null>())}</span>,
    enableSorting: true,
  },
  {
    accessorKey: 'ZONE',
    header: t('columns.ZONE'),
    cell: ({ getValue }) => <span className="text-sm text-slate-700">{nullableText(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'STREET',
    header: t('columns.STREET'),
    cell: ({ getValue }) => <span className="text-sm text-slate-700">{nullableText(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'BUILDING_NO',
    header: t('columns.BUILDING_NO'),
    cell: ({ getValue }) => <span className="text-sm text-slate-700">{nullableText(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'UNIT_NO',
    header: t('columns.UNIT_NO'),
    cell: ({ getValue }) => <span className="text-sm text-slate-700">{nullableText(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'FLOOR_NO',
    header: t('columns.FLOOR_NO'),
    cell: ({ getValue }) => <span className="text-sm text-slate-700">{nullableText(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'QARS',
    header: t('columns.QARS'),
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
    accessorKey: 'ELECTRICITY_NO',
    header: t('columns.ELECTRICITY_NO'),
    cell: ({ getValue }) => <span className="text-sm text-slate-600">{nullableText(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'LATITUDE',
    header: t('columns.LATITUDE'),
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-slate-600">{nullableText(getValue<string | null>())}</span>
    ),
  },
  {
    accessorKey: 'LONGITUDE',
    header: t('columns.LONGITUDE'),
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-slate-600">{nullableText(getValue<string | null>())}</span>
    ),
  },
  {
    accessorKey: 'SOURCE_CODE',
    header: t('columns.SOURCE_CODE'),
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
    accessorKey: 'PRIORITY',
    header: t('columns.PRIORITY'),
    cell: ({ getValue }) => {
      const val = getValue<number | null>();
      return val != null ? (
        <span className="text-sm font-medium text-slate-700">{val}</span>
      ) : (
        <span className="text-slate-400">—</span>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'VALID_FROM',
    header: t('columns.VALID_FROM'),
    cell: ({ getValue }) => <span className="text-sm text-slate-600">{formatDate(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'VALID_TO',
    header: t('columns.VALID_TO'),
    cell: ({ getValue }) => <span className="text-sm text-slate-600">{formatDate(getValue<string | null>())}</span>,
  },
  ...(canEdit && env.showActionsColumn ? [{
    id: 'actions',
    header: t('columns.ACTIONS'),
    cell: ({ row }: { row: { original: SbrAddress } }) => (
      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onEdit(row.original); }}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    ),
  } as ColumnDef<SbrAddress>] : []),
];
