import type { ColumnDef } from '@tanstack/react-table';
import type { SbrAddress } from '@/types';
import { nullableText, formatDate } from '@/utils/format';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

type TFunc = (key: string, options?: { lng?: string }) => string;

export const getAddressColumns = (onEdit: (row: SbrAddress) => void, t: TFunc, canEdit = true): ColumnDef<SbrAddress>[] => [
  {
    accessorKey: 'SBR_ID',
    header: t('columns.SBR_ID', { lng: 'en' }),
    cell: ({ getValue }) => (
      <span className="font-mono text-xs font-medium text-red-600">{String(getValue())}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'MUNICIPALITY_ID',
    header: t('columns.MUNICIPALITY_ID', { lng: 'en' }),
    cell: ({ getValue }) => <span className="text-sm text-slate-700">{nullableText(getValue<string | null>())}</span>,
    enableSorting: true,
  },
  {
    accessorKey: 'ZONE',
    header: t('columns.ZONE', { lng: 'en' }),
    cell: ({ getValue }) => <span className="text-sm text-slate-700">{nullableText(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'STREET',
    header: t('columns.STREET', { lng: 'en' }),
    cell: ({ getValue }) => <span className="text-sm text-slate-700">{nullableText(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'BUILDING_NO',
    header: t('columns.BUILDING_NO', { lng: 'en' }),
    cell: ({ getValue }) => <span className="text-sm text-slate-700">{nullableText(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'UNIT_NO',
    header: t('columns.UNIT_NO', { lng: 'en' }),
    cell: ({ getValue }) => <span className="text-sm text-slate-700">{nullableText(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'FLOOR_NO',
    header: t('columns.FLOOR_NO', { lng: 'en' }),
    cell: ({ getValue }) => <span className="text-sm text-slate-700">{nullableText(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'QARS',
    header: t('columns.QARS', { lng: 'en' }),
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
    header: t('columns.ELECTRICITY_NO', { lng: 'en' }),
    cell: ({ getValue }) => <span className="text-sm text-slate-600">{nullableText(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'LATITUDE',
    header: t('columns.LATITUDE', { lng: 'en' }),
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-slate-600">{nullableText(getValue<string | null>())}</span>
    ),
  },
  {
    accessorKey: 'LONGITUDE',
    header: t('columns.LONGITUDE', { lng: 'en' }),
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-slate-600">{nullableText(getValue<string | null>())}</span>
    ),
  },
  {
    accessorKey: 'SOURCE_CODE',
    header: t('columns.SOURCE_CODE', { lng: 'en' }),
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
    header: t('columns.PRIORITY', { lng: 'en' }),
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
    header: t('columns.VALID_FROM', { lng: 'en' }),
    cell: ({ getValue }) => <span className="text-sm text-slate-600">{formatDate(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'VALID_TO',
    header: t('columns.VALID_TO', { lng: 'en' }),
    cell: ({ getValue }) => <span className="text-sm text-slate-600">{formatDate(getValue<string | null>())}</span>,
  },
  ...(canEdit ? [{
    id: 'actions',
    header: t('columns.ACTIONS', { lng: 'en' }),
    cell: ({ row }: { row: { original: SbrAddress } }) => (
      <Button size="sm" variant="outline" onClick={() => onEdit(row.original)}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    ),
  } as ColumnDef<SbrAddress>] : []),
];
