'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import type { ColumnDef } from '@tanstack/react-table';
import { Inbox, User, RotateCcw, Clock } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/table/DataTable';
import { NoData } from '@/components/common/NoData';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetChangeRequestsQuery, type ChangeRequestListItem, type ChangeRequestFilters } from '../api/changeRequestsApi';
import { prettyTableName } from '@/features/auditLog/components/AuditLogColumns';
import { cleanParams } from '@/utils/query';
import { formatDate } from '@/utils/format';
import { usePermission } from '@/hooks';

// Values stay as the real table names (sent to the backend); labels are display-only
// (friendly names) — same logic as the Audit Log tab.
const TABLE_VALUES = ['SBR_ESTABLISHMENTS', 'SBR_ENTERPRISES', 'SBR_CONTACTS', 'SBR_ADDRESSES'];
const TABLE_OPTIONS = [
  { value: '__all__', label: 'All Tables' },
  ...TABLE_VALUES.map((v) => ({ value: v, label: prettyTableName(v) })),
];

const TABLE_BADGE: Record<string, string> = {
  SBR_ESTABLISHMENTS: 'bg-[#A71D3A]/10 text-[#A71D3A]',
  SBR_ENTERPRISES: 'bg-amber-50 text-amber-700',
  SBR_CONTACTS: 'bg-emerald-50 text-emerald-700',
  SBR_ADDRESSES: 'bg-sky-50 text-sky-700',
};

const DEFAULT_FILTERS: ChangeRequestFilters = { page: 1, limit: 10 };

export function AttributeChangeRequestsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { canApprove } = usePermission('approvals');
  const [filters, setFilters] = useState<ChangeRequestFilters>(DEFAULT_FILTERS);

  const queryParams = cleanParams({
    ...filters,
    tableName: filters.tableName === '__all__' ? undefined : filters.tableName,
  });
  const { data, isLoading, isError, refetch } = useGetChangeRequestsQuery(queryParams, { skip: !canApprove });

  const handleFilterChange = useCallback((partial: Partial<ChangeRequestFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const records = data?.data ?? [];
  const total = data?.total ?? 0;

  // Reset is only meaningful once a real filter is applied (the table dropdown);
  // pagination changes don't count as a filter.
  const hasActiveFilters = !!filters.tableName && filters.tableName !== '__all__';

  const columns: ColumnDef<ChangeRequestListItem>[] = [
    {
      accessorKey: 'REQUEST_CODE',
      header: t('changeRequests.cols.request', { defaultValue: 'Request' }),
      cell: ({ getValue }) => <span className="font-mono text-xs font-medium text-slate-600">{String(getValue())}</span>,
    },
    {
      accessorKey: 'TABLE_NAME',
      header: t('changeRequests.cols.table', { defaultValue: 'Table' }),
      cell: ({ getValue }) => {
        const v = String(getValue());
        return <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${TABLE_BADGE[v] ?? 'bg-slate-100 text-slate-600'}`}>{prettyTableName(v)}</span>;
      },
    },
    {
      accessorKey: 'ROW_ID',
      header: t('changeRequests.cols.rowId', { defaultValue: 'Row ID' }),
      cell: ({ getValue }) => <span className="font-mono text-xs font-medium text-red-600">#{String(getValue() ?? '—')}</span>,
    },
    {
      accessorKey: 'ENTITY',
      header: t('changeRequests.cols.entity', { defaultValue: 'Entity' }),
      cell: ({ getValue }) => <span className="text-sm text-slate-700">{(getValue() as string) ?? '—'}</span>,
    },
    {
      accessorKey: 'CHANGE_COUNT',
      header: t('changeRequests.cols.changes', { defaultValue: 'Changes' }),
      cell: ({ getValue }) => {
        const n = Number(getValue() ?? 0);
        return (
          <span className="rounded-md bg-[#FCF4F6] px-2 py-0.5 text-xs font-medium text-[#A71D3A]">
            {n} {n === 1 ? t('changeRequests.fieldOne', { defaultValue: 'field changed' }) : t('changeRequests.fieldMany', { defaultValue: 'fields changed' })}
          </span>
        );
      },
    },
    {
      accessorKey: 'REQUESTED_BY',
      header: t('changeRequests.cols.requestedBy', { defaultValue: 'Requested By' }),
      cell: ({ getValue }) => (
        <span className="flex items-center gap-1.5 text-sm text-slate-600">
          <User className="h-3.5 w-3.5 text-slate-400" /> {(getValue() as string) ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'CREATED_AT',
      header: t('changeRequests.cols.requested', { defaultValue: 'Requested' }),
      cell: ({ getValue }) => <span className="text-sm text-slate-500">{formatDate(getValue() as string)}</span>,
    },
    {
      accessorKey: 'STATUS',
      header: t('changeRequests.cols.status', { defaultValue: 'Status' }),
      cell: ({ getValue }) => {
        const s = String(getValue());
        const cls = s === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : s === 'REJECTED' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700';
        return (
          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${cls}`}>
            <Clock className="h-3 w-3" /> {s.charAt(0) + s.slice(1).toLowerCase()}
          </span>
        );
      },
    },
  ];

  if (!canApprove) {
    return (
      <PageContainer>
        <PageHeader title={t('pages.attributeChangeRequests.title')} description={t('pages.attributeChangeRequests.description')} />
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <NoData message={t('common.noAccess', { defaultValue: 'You do not have access to this section.' })} />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('pages.attributeChangeRequests.title')}
        description={t('pages.attributeChangeRequests.description')}
        actions={
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Inbox className="h-4 w-4" />
            <span className="font-medium text-slate-700">{total.toLocaleString()}</span> {t('changeRequests.pending', { defaultValue: 'pending' })}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <Select value={filters.tableName ?? '__all__'} onValueChange={(v) => handleFilterChange({ tableName: v, page: 1 })}>
          <SelectTrigger className="w-56 shadow-none"><SelectValue placeholder={t('changeRequests.allTables', { defaultValue: 'All Tables' })} /></SelectTrigger>
          <SelectContent>
            {TABLE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => setFilters(DEFAULT_FILTERS)} disabled={!hasActiveFilters} className="gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" /> {t('filters.reset', { defaultValue: 'Reset' })}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={records}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        page={filters.page ?? 1}
        limit={filters.limit ?? 20}
        total={total}
        onPageChange={(p) => handleFilterChange({ page: p })}
        onLimitChange={(l) => handleFilterChange({ limit: l, page: 1 })}
        onRowClick={(row) => router.push(`/tasks/attribute-change-requests/${row.ID}`)}
      />
    </PageContainer>
  );
}
