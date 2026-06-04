import type { ColumnDef } from '@tanstack/react-table';
import type { SbrContact } from '@/types';
import { nullableText, formatDate } from '@/utils/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Globe, Pencil } from 'lucide-react';

const h = (s: string) => s.replaceAll('_', ' ');

export const getContactColumns = (onEdit: (row: SbrContact) => void): ColumnDef<SbrContact>[] => [
  {
    accessorKey: 'SBR_ID',
    header: h('SBR_ID'),
    cell: ({ getValue }) => (
      <span className="font-mono text-xs font-medium text-blue-700">{String(getValue())}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'CONTACT_NAME',
    header: h('CONTACT_NAME'),
    cell: ({ getValue }) => (
      <span className="font-medium text-slate-800">{nullableText(getValue<string | null>())}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'ROLE',
    header: 'ROLE',
    cell: ({ getValue }) => {
      const val = getValue<string | null>();
      return val ? <Badge variant="secondary">{val}</Badge> : <span className="text-slate-400">—</span>;
    },
  },
  {
    accessorKey: 'PHONE',
    header: 'PHONE',
    cell: ({ getValue }) => {
      const val = getValue<string | null>();
      return val ? (
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <Phone className="h-3.5 w-3.5 text-slate-400" />
          {val}
        </div>
      ) : (
        <span className="text-slate-400">—</span>
      );
    },
  },
  {
    accessorKey: 'MOBILE',
    header: 'MOBILE',
    cell: ({ getValue }) => <span className="text-sm text-slate-600">{nullableText(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'FAX',
    header: 'FAX',
    cell: ({ getValue }) => <span className="text-sm text-slate-600">{nullableText(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'EMAIL',
    header: 'EMAIL',
    cell: ({ getValue }) => {
      const val = getValue<string | null>();
      return val ? (
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <Mail className="h-3.5 w-3.5 text-slate-400" />
          <span className="truncate max-w-[180px]">{val}</span>
        </div>
      ) : (
        <span className="text-slate-400">—</span>
      );
    },
  },
  {
    accessorKey: 'PO_BOX',
    header: h('PO_BOX'),
    cell: ({ getValue }) => <span className="text-sm text-slate-600">{nullableText(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'WEBSITE',
    header: 'WEBSITE',
    cell: ({ getValue }) => {
      const val = getValue<string | null>();
      return val ? (
        <div className="flex items-center gap-1.5 text-sm text-blue-600">
          <Globe className="h-3.5 w-3.5" />
          <a href={val.startsWith('http') ? val : `https://${val}`} target="_blank" rel="noopener noreferrer" className="hover:underline truncate max-w-[140px]">
            {val}
          </a>
        </div>
      ) : (
        <span className="text-slate-400">—</span>
      );
    },
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
