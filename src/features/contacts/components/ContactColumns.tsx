import type { ColumnDef } from '@tanstack/react-table';
import type { SbrContact } from '@/types';
import { nullableText, formatDate } from '@/utils/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Globe, Pencil } from 'lucide-react';
import { PendingBadge } from '@/components/common/PendingBadge';
import env from '@/config/env';

type TFunc = (key: string, options?: { lng?: string }) => string;

export const getContactColumns = (onEdit: (row: SbrContact) => void, t: TFunc, canEdit = true): ColumnDef<SbrContact>[] => [
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
    accessorKey: 'CONTACT_NAME',
    header: t('columns.CONTACT_NAME'),
    cell: ({ getValue }) => (
      <span className="font-medium text-slate-800">{nullableText(getValue<string | null>())}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'ROLE',
    header: t('columns.ROLE'),
    cell: ({ getValue }) => {
      const val = getValue<string | null>();
      return val ? <Badge variant="secondary">{val}</Badge> : <span className="text-slate-400">—</span>;
    },
  },
  {
    accessorKey: 'PHONE',
    header: t('columns.PHONE'),
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
    header: t('columns.MOBILE'),
    cell: ({ getValue }) => <span className="text-sm text-slate-600">{nullableText(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'FAX',
    header: t('columns.FAX'),
    cell: ({ getValue }) => <span className="text-sm text-slate-600">{nullableText(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'EMAIL',
    header: t('columns.EMAIL'),
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
    header: t('columns.PO_BOX'),
    cell: ({ getValue }) => <span className="text-sm text-slate-600">{nullableText(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'WEBSITE',
    header: t('columns.WEBSITE'),
    cell: ({ getValue }) => {
      const val = getValue<string | null>();
      return val ? (
        <div className="flex items-center gap-1.5 text-sm" style={{ color: '#A71D3A' }}>
          <Globe className="h-3.5 w-3.5" />
          <a href={val.startsWith('http') ? val : `https://${val}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="hover:underline truncate max-w-[140px]">
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
    cell: ({ row }: { row: { original: SbrContact } }) => (
      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onEdit(row.original); }}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    ),
  } as ColumnDef<SbrContact>] : []),
];
