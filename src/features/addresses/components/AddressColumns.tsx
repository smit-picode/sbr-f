import type { ColumnDef } from '@tanstack/react-table';
import type { SbrAddress } from '@/types';
import { nullableText, formatDate } from '@/utils/format';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

const h = (s: string) => s.replaceAll('_', ' ');

export const getAddressColumns = (onEdit: (row: SbrAddress) => void): ColumnDef<SbrAddress>[] => [
  {
    accessorKey: 'SBR_ID',
    header: h('SBR_ID'),
    cell: ({ getValue }) => (
      <span className="font-mono text-xs font-medium text-blue-700">{String(getValue())}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'MUNICIPALITY_ID',
    header: h('MUNICIPALITY_ID'),
    cell: ({ getValue }) => <span className="text-sm text-slate-700">{nullableText(getValue<string | null>())}</span>,
    enableSorting: true,
  },
  {
    accessorKey: 'ZONE',
    header: 'ZONE',
    cell: ({ getValue }) => <span className="text-sm text-slate-700">{nullableText(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'STREET',
    header: 'STREET',
    cell: ({ getValue }) => <span className="text-sm text-slate-700">{nullableText(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'BUILDING_NO',
    header: h('BUILDING_NO'),
    cell: ({ getValue }) => <span className="text-sm text-slate-700">{nullableText(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'UNIT_NO',
    header: h('UNIT_NO'),
    cell: ({ getValue }) => <span className="text-sm text-slate-700">{nullableText(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'FLOOR_NO',
    header: h('FLOOR_NO'),
    cell: ({ getValue }) => <span className="text-sm text-slate-700">{nullableText(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'QARS',
    header: 'QARS',
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
    header: h('ELECTRICITY_NO'),
    cell: ({ getValue }) => <span className="text-sm text-slate-600">{nullableText(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'LATITUDE',
    header: 'LATITUDE',
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-slate-600">{nullableText(getValue<string | null>())}</span>
    ),
  },
  {
    accessorKey: 'LONGITUDE',
    header: 'LONGITUDE',
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-slate-600">{nullableText(getValue<string | null>())}</span>
    ),
  },
  {
    accessorKey: 'SOURCE_CODE',
    header: h('SOURCE_CODE'),
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
    header: 'PRIORITY',
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
    header: h('VALID_FROM'),
    cell: ({ getValue }) => <span className="text-sm text-slate-600">{formatDate(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'VALID_TO',
    header: h('VALID_TO'),
    cell: ({ getValue }) => <span className="text-sm text-slate-600">{formatDate(getValue<string | null>())}</span>,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <Button size="sm" variant="outline" onClick={() => onEdit(row.original)}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    ),
  },
];
