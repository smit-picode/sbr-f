'use client';

import { useMemo, useState } from 'react';
import { useRouter } from '@/hooks/useAppRouter';
import { useTranslation } from 'react-i18next';
import { Building2, Database, Snowflake, User } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { NoData } from '@/components/common/NoData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/table/DataTable';
import { usePermission } from '@/hooks';
import { formatDateTime, formatNumber, nullableText } from '@/utils/format';
import type { SnapshotSummary } from '@/types';
import { useGetSnapshotsQuery } from '../api/snapshotsApi';
import { SNAPSHOT_DEFAULT_PAGE_SIZE, SNAPSHOT_ENTITIES } from '../constants';

export function BrowseSnapshotsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { canView } = usePermission('snapshots');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(SNAPSHOT_DEFAULT_PAGE_SIZE);

  const { data, isLoading, isFetching, isError, refetch } = useGetSnapshotsQuery({ page, limit }, { skip: !canView });
  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const open = (row: SnapshotSummary) => router.push(`/snapshots/browse/${row.SNAPSHOT_ID}`);

  const columns = useMemo<ColumnDef<SnapshotSummary>[]>(() => [
    {
      accessorKey: 'SNAPSHOT_NAME',
      header: t('snapshots.snapshotName', { defaultValue: 'Snapshot name' }),
      cell: ({ row }) => (
        <div className="min-w-[200px]">
          <p className="text-sm font-semibold text-slate-800">{row.original.SNAPSHOT_NAME}</p>
          {row.original.DESCRIPTION && (
            <p className="text-xs text-slate-500 truncate max-w-[280px]">{row.original.DESCRIPTION}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'STATUS',
      header: t('columns.STATUS'),
      cell: ({ getValue }) => {
        const status = getValue<string>();
        return status === 'COMPLETE'
          ? <Badge variant="info" className="gap-1 rounded-full"><Snowflake className="h-3 w-3" />{t('snapshots.statusFrozen')}</Badge>
          : <Badge variant="warning" className="rounded-full">{status}</Badge>;
      },
    },
    {
      accessorKey: 'CREATED_AT',
      header: t('snapshots.frozenOn'),
      cell: ({ getValue }) => <span className="text-sm text-slate-600 whitespace-nowrap">{formatDateTime(getValue<string>())}</span>,
    },
    ...SNAPSHOT_ENTITIES.map<ColumnDef<SnapshotSummary>>(({ entity, countKey, i18nKey, label, tone }) => ({
      accessorKey: countKey,
      header: t(i18nKey, { defaultValue: label }),
      cell: ({ getValue }) => entity === 'establishments' ? (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${tone}`}>
          <Building2 className="h-3 w-3" />
          {formatNumber(getValue<number | null>())}
        </span>
      ) : (
        <span className="text-sm text-slate-700 tabular-nums">{formatNumber(getValue<number | null>())}</span>
      ),
    })),
    {
      accessorKey: 'FROZEN_BY_NAME',
      header: t('snapshots.frozenBy'),
      // Shows the frozen-by email once the list procedure returns it; the display name until then.
      cell: ({ row, getValue }) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-adaam">
          <User className="h-3.5 w-3.5 shrink-0" />
          {nullableText(row.original.FROZEN_BY_EMAIL ?? getValue<string | null>())}
        </span>
      ),
    },
    {
      id: 'actions',
      header: t('columns.ACTIONS'),
      cell: ({ row }) => (
        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); open(row.original); }}>
          <Database className="h-3.5 w-3.5 mr-1.5" />
          {t('snapshots.browseAction')}
        </Button>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t]);

  if (!canView) {
    return (
      <PageContainer>
        <PageHeader title={t('snapshots.browseTitle')} description={t('snapshots.browseDescription')} />
        <div className="rounded-lg bg-white shadow-card overflow-hidden">
          <NoData message={t('snapshots.noViewPermission', { defaultValue: 'You do not have permission to view snapshots.' })} />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('snapshots.browseTitle')}
        description={t('snapshots.browseDescription')}
        actions={
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Database className="h-4 w-4" />
            <span className="font-medium text-slate-700">{formatNumber(total)}</span>{' '}
            {total === 1 ? t('snapshots.frameLabelOne') : t('snapshots.frameLabelMany')}
          </div>
        }
      />

      {!isLoading && !isError && total === 0 ? (
        <div className="rounded-lg bg-white shadow-card overflow-hidden">
          <NoData message={t('snapshots.noData')} description={t('snapshots.noDataDesc')} />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          isLoading={isLoading || (isFetching && !rows.length)}
          isError={isError}
          onRetry={refetch}
          page={page}
          limit={limit}
          total={total}
          onPageChange={setPage}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
          onRowClick={open}
        />
      )}
    </PageContainer>
  );
}
