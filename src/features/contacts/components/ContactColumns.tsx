import type { ColumnDef } from '@tanstack/react-table';
import type { SbrContact } from '@/types';
import { nullableText, formatDate } from '@/utils/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Globe, Pencil, Tag } from 'lucide-react';
import { PendingBadge } from '@/components/common/PendingBadge';
import env from '@/config/env';

type TFunc = (key: string, options?: { lng?: string }) => string;

// tagName turns a tag code into its display name; without it the code is shown.
export const getContactColumns = (onEdit: (row: SbrContact) => void, t: TFunc, canEdit = true, tagName: (code: string) => string = (code) => code): ColumnDef<SbrContact>[] => [
  {
    accessorKey: 'SBR_ID',
    header: t('columns.SBR_ID'),
    cell: ({ getValue, row }) => (
      <span className="flex items-center gap-1.5">
        <span className="font-mono text-xs font-medium text-adaam">{String(getValue())}</span>
        {row.original.HAS_PENDING_REQUEST && <PendingBadge />}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'ID',
    header: t('columns.ID'),
    cell: ({ getValue }) => <span className="font-mono text-xs text-slate-500">{String(getValue())}</span>,
    enableSorting: true,
  },
  {
    // NPC-330: the contact's permanent identity (ID changes with every version).
    accessorKey: 'CONTACT_ID',
    header: t('columns.CONTACT_ID'),
    cell: ({ getValue }) => {
      const val = getValue<number | null>();
      return val != null ? <span className="font-mono text-xs text-slate-500">{String(val)}</span> : <span className="text-slate-400">{nullableText(null)}</span>;
    },
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
        <div className="flex items-center gap-1.5 text-sm" style={{ color: '#A29374' }}>
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
    accessorKey: 'TAGS',
    header: t('columns.TAGS'),
    cell: ({ getValue }) => {
      const val = getValue<string | null>();
      if (!val) return <span className="text-slate-400">{nullableText(null)}</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {val.split(',').map((code) => (
            <span key={code} className="inline-flex items-center gap-1 rounded-full bg-[#F4F0E8] px-2 py-0.5 text-[10.5px] font-semibold text-[#87795D]">
              <Tag className="h-2.5 w-2.5" />{tagName(code.trim())}
            </span>
          ))}
        </div>
      );
    },
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
