'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Plus, User } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/table/DataTable';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n';
import { MOCK_BULK_HISTORY } from '../mocks/bulkChangeMocks';
import type { BulkChangeTaskSummary } from '../types';

export function BulkChangeHistoryPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isArabic } = useLanguage();

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
      cell: ({ getValue }) => <span className="text-sm text-slate-500">{String(getValue())}</span>,
    },
    {
      accessorKey: 'TABLE_NAME',
      header: t('bulkChange.cols.table', { defaultValue: 'Table' }),
      cell: ({ getValue }) => <span className="text-sm text-slate-700">{String(getValue())}</span>,
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
      cell: ({ row }) => {
        const s = row.original.STATUS;
        const cls = s === 'Approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700';
        const label =
          s === 'Approved'
            ? t('bulkChange.statusApproved', { defaultValue: 'Approved' })
            : t('bulkChange.statusRejected', { defaultValue: 'Rejected' });
        return (
          <div>
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>
            {row.original.DECIDED_BY && (
              <p className="mt-0.5 text-xs text-slate-400">
                {t('bulkChange.decidedBy', { defaultValue: 'Decided by' })} {row.original.DECIDED_BY}
              </p>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button variant="outline" size="sm" onClick={() => router.push(`/tasks/bulk-change/${row.original.ID}`)}>
          {t('bulkChange.view', { defaultValue: 'View' })}
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
            <Button variant="outline" className="gap-1.5" onClick={() => router.push('/tasks/bulk-change')}>
              {isArabic ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
              {t('bulkChange.backToBulkChanges', { defaultValue: 'Back to bulk changes' })}
            </Button>
            <Button
              style={{ background: 'linear-gradient(135deg, #A71D3A, #6B1428)', border: 'none' }}
              className="text-white gap-1.5"
              onClick={() => router.push('/tasks/bulk-change/new')}
            >
              <Plus className="h-4 w-4" />
              {t('bulkChange.newBulkUpdate', { defaultValue: 'New bulk update' })}
            </Button>
          </div>
        }
      />

      <p className="text-xs text-slate-400">
        {t('bulkChange.decidedHistory', { defaultValue: 'Approved and rejected bulk changes.' })}
      </p>

      <DataTable
        columns={columns}
        data={MOCK_BULK_HISTORY}
        page={1}
        limit={10}
        total={MOCK_BULK_HISTORY.length}
        onPageChange={() => {}}
        onLimitChange={() => {}}
      />
    </PageContainer>
  );
}
