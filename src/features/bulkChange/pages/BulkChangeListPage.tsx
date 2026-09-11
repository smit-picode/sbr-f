'use client';

import { useCallback, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { History, Plus, User } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/table/DataTable';
import { Button } from '@/components/ui/button';
import { usePermission } from '@/hooks';
import { formatDate } from '@/utils/format';
import { cleanParams } from '@/utils/query';
import { useGetBulkChangeListQuery } from '../api/bulkChangeApi';
import { BulkChangeStatusBadge } from '../components/BulkChangeStatusBadge';
import { BULK_CHANGE_DEFAULT_FILTERS, TABLE_BY_ENTITY_TYPE } from '../constants';
import type { BulkChangeTaskSummary } from '../types';

export function BulkChangeListPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [filters, setFilters] = useState({ ...BULK_CHANGE_DEFAULT_FILTERS });

  // Submitting needs BOTH layers the API enforces: module access (bulk_change.create) AND an
  // edit permission on at least one bulk-capable table. Hiding the button unless both hold
  // keeps the UI from offering an action that would come back as a 403.
  const establishments = usePermission('establishments');
  const contacts = usePermission('contacts');
  const addresses = usePermission('addresses');
  const bulkChange = usePermission('bulk_change');
  const canSubmit = bulkChange.canCreate
    && (establishments.canEdit || contacts.canEdit || addresses.canEdit);

  const { data, isLoading, isError, refetch } = useGetBulkChangeListQuery(cleanParams(filters));
  const rows = data?.data ?? [];

  const handleFilterChange = useCallback((next: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...next }));
  }, []);

  const columns: ColumnDef<BulkChangeTaskSummary>[] = [
    {
      accessorKey: 'ID',
      header: t('bulkChange.cols.task', { defaultValue: 'Bulk Task' }),
      cell: ({ getValue }) => <span className="font-mono text-xs font-medium text-blue-700">{String(getValue())}</span>,
    },
    {
      accessorKey: 'SUBMITTED_BY',
      header: t('bulkChange.cols.submittedBy', { defaultValue: 'Submitted By' }),
      cell: ({ getValue }) => (
        <span className="flex items-center gap-1.5 text-sm">
          <User className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[#A71D3A]">{String(getValue())}</span>
        </span>
      ),
    },
    {
      accessorKey: 'SUBMITTED_AT',
      header: t('bulkChange.cols.submitted', { defaultValue: 'Submitted' }),
      cell: ({ getValue }) => <span className="text-sm text-slate-500">{formatDate(getValue<string | null>())}</span>,
    },
    {
      accessorKey: 'ENTITY_TYPE',
      header: t('bulkChange.cols.table', { defaultValue: 'Table' }),
      cell: ({ row }) => {
        const tableKey = TABLE_BY_ENTITY_TYPE[row.original.ENTITY_TYPE];
        return <span className="text-sm text-slate-700">{t(`nav.${tableKey.toLowerCase()}`, { defaultValue: tableKey })}</span>;
      },
    },
    {
      accessorKey: 'RECORDS',
      header: t('bulkChange.cols.records', { defaultValue: 'Records' }),
      cell: ({ getValue }) => <span className="text-sm text-slate-700">{String(getValue())}</span>,
    },
    {
      accessorKey: 'CHANGES',
      header: t('bulkChange.cols.changes', { defaultValue: 'Changes' }),
      cell: ({ getValue }) => (
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{String(getValue())}</span>
      ),
    },
    {
      accessorKey: 'STATUS',
      header: t('bulkChange.cols.status', { defaultValue: 'Status' }),
      cell: ({ row }) => <BulkChangeStatusBadge status={row.original.STATUS} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button variant="outline" size="sm" onClick={() => router.push(`/tasks/bulk-change/${row.original.BATCH_ID}`)}>
          {t('bulkChange.review', { defaultValue: 'Review' })}
        </Button>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={t('pages.bulkChange.title', { defaultValue: 'Bulk Change' })}
        description={t('pages.bulkChange.description', { defaultValue: 'Update many establishments at once from an Excel file — submitted as one approval task.' })}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-1.5" onClick={() => router.push('/tasks/bulk-change/history')}>
              <History className="h-4 w-4" />
              {t('bulkChange.history', { defaultValue: 'History' })}
            </Button>
            {canSubmit && (
              <Button
                style={{ background: 'linear-gradient(135deg, #A71D3A, #6B1428)', border: 'none' }}
                className="text-white gap-1.5"
                onClick={() => router.push('/tasks/bulk-change/new')}
              >
                <Plus className="h-4 w-4" />
                {t('bulkChange.newBulkUpdate', { defaultValue: 'New bulk update' })}
              </Button>
            )}
          </div>
        }
      />

      <p className="text-xs text-slate-400">
        {t('bulkChange.awaitingApproval', { defaultValue: 'Bulk change tasks awaiting approval.' })}
      </p>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        page={filters.page}
        limit={filters.limit}
        total={data?.total ?? 0}
        onPageChange={(page) => handleFilterChange({ page })}
        onLimitChange={(limit) => handleFilterChange({ limit, page: 1 })}
      />
    </PageContainer>
  );
}
