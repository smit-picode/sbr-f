import type { ColumnDef } from '@tanstack/react-table';
import type { SbrEnterpriseGroup } from '@/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { nullableText } from '@/utils/format';
import { Users, MapPin, Network, Orbit } from 'lucide-react';
import { PendingBadge } from '@/components/common/PendingBadge';
import { formatGroupCode } from '../constants';

type TFunc = (key: string, options?: { lng?: string; defaultValue?: string }) => string;

export const getEnterpriseGroupColumns = (t: TFunc): ColumnDef<SbrEnterpriseGroup>[] => [
  {
    accessorKey: 'ENTERPRISE_GROUP_ID',
    header: t('columns.GROUP', { defaultValue: 'GROUP' }),
    cell: ({ getValue, row }) => (
      <span className="flex items-center gap-1.5">
        <span className="font-mono text-xs font-medium text-[#77748B]">{formatGroupCode(getValue<number>())}</span>
        {/* Coerce with !!: the procedure returns 1/0, and JSX renders a literal 0 for `0 && x`
            (unlike `false && x`, which renders nothing). */}
        {!!row.original.HAS_PENDING_REQUEST && <PendingBadge />}
      </span>
    ),
  },
  {
    accessorKey: 'NAME_ENU',
    header: t('columns.GROUP_NAME', { defaultValue: 'GROUP NAME' }),
    cell: ({ row }) => (
      <div className="min-w-[200px]">
        <p className="font-medium text-slate-800 text-sm leading-snug">{nullableText(row.original.NAME_ENU)}</p>
        {row.original.NAME_ARA && (
          <p className="text-xs text-slate-500 leading-snug mt-0.5">{row.original.NAME_ARA}</p>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'TYPE',
    header: t('columns.TYPE', { defaultValue: 'TYPE' }),
    // Derived in JS from UCI_COUNTRY, but UCI_COUNTRY is a real column on the same table, so
    // the backend sorts this on an equivalent CASE expression (EG_DERIVED_SORT_SQL.TYPE).
    cell: ({ getValue }) => {
      const type = getValue<string>();
      if (type === 'Domestic') {
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            <MapPin className="h-3 w-3" />
            Domestic
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
          <Network className="h-3 w-3" />
          {type}
        </span>
      );
    },
  },
  {
    accessorKey: 'UCI_NAME',
    header: t('columns.UCI', { defaultValue: 'CONTROLLING INSTITUTION (UCI)' }),
    cell: ({ row }) => {
      const name = row.original.UCI_NAME;
      const type = row.original.UCI_TYPE;
      const country = row.original.UCI_COUNTRY;
      const subtitle = [type, country].filter(Boolean).join(' · ');
      return (
        <div className="min-w-[160px]">
          <p className="text-sm text-slate-700 leading-snug">{nullableText(name)}</p>
          {subtitle && <p className="text-xs text-slate-400 leading-snug mt-0.5">{subtitle}</p>}
        </div>
      );
    },
  },
  {
    accessorKey: 'PRINCIPAL_ISIC_2DIGIT',
    header: t('columns.PRINCIPAL_ACTIVITY', { defaultValue: 'PRINCIPAL ACTIVITY' }),
    cell: ({ row }) => {
      const code = row.original.PRINCIPAL_ISIC_2DIGIT;
      if (!code) return <span className="text-slate-400">—</span>;
      return <span className="font-mono text-xs text-slate-600">{code}</span>;
    },
  },
  {
    accessorKey: 'ENTERPRISE_COUNT',
    header: t('columns.ENTERPRISES', { defaultValue: 'ENTERPRISES' }),
    // Computed in JS after the query — not sortable server-side.
    enableSorting: false,
    cell: ({ getValue }) => {
      const count = Number(getValue<number>() ?? 0);
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-[#A71D3A]/10 px-2 py-0.5 text-xs font-medium text-[#A71D3A]">
          <Orbit className="h-3.5 w-3.5" />
          {count}
        </span>
      );
    },
  },
  {
    accessorKey: 'ESTABLISHMENT_COUNT',
    header: t('columns.ESTABLISHMENTS', { defaultValue: 'ESTABLISHMENTS' }),
    // Computed in JS after the query — not sortable server-side.
    enableSorting: false,
    cell: ({ getValue }) => {
      const count = Number(getValue<number>() ?? 0);
      return (
        <span className="inline-flex items-center gap-1 text-xs text-slate-600">
          {count}
        </span>
      );
    },
  },
  {
    accessorKey: 'EMPLOYEE_COUNT',
    header: t('columns.EMPLOYEES', { defaultValue: 'EMPLOYEES' }),
    // Response field is EMPLOYEE_COUNT (computed in JS) but the real, sortable column is
    // TOTAL_EMPLOYEES — accessorKey mismatch means this can't be wired to server-side sort
    // directly, so it's disabled here rather than silently sending an invalid sortBy.
    enableSorting: false,
    cell: ({ getValue }) => {
      const count = Number(getValue<number>() ?? 0);
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
          <Users className="h-3 w-3" />
          {count.toLocaleString()}
        </span>
      );
    },
  },
  {
    accessorKey: 'STATUS',
    header: t('columns.STATUS', { defaultValue: 'STATUS' }),
    cell: ({ getValue }) => <StatusBadge status={getValue<string | null>()} className="rounded-md" />,
  },
];
