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
import { DEFAULT_PAGE_SIZE } from '@/constants';
import { SearchInput } from '@/components/common/SearchInput';
import { DataTable } from '@/components/table/DataTable';
import { useDebounce, usePermission } from '@/hooks';
import { formatDateTime, formatNumber, nullableText } from '@/utils/format';
import { cleanParams } from '@/utils/query';
import type { SnapshotSummary } from '@/types';
import { useGetSnapshotsQuery } from '../api/snapshotsApi';
import { SNAPSHOT_ENTITIES } from '../constants';

export function BrowseSnapshotsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { canView } = usePermission('snapshots');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim(), 400);

  const { data, isLoading, isFetching, isError, refetch } = useGetSnapshotsQuery(
    cleanParams({ page, limit, search: debouncedSearch }),
    { skip: !canView },
  );
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
      cell: ({ row, getValue }) => {
        const { FROZEN_BY_EMAIL: email } = row.original;
        const name = getValue<string | null>();
        return (
          <span className="inline-flex items-start gap-1.5 text-sm text-adaam">
            <User className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              {nullableText(email ?? name)}
              {email && name && <span className="block text-xs text-slate-500">{name}</span>}
            </span>
          </span>
        );
      },
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

      {!isLoading && !isError && total === 0 && !debouncedSearch && !search ? (
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
          toolbarLeft={
            <SearchInput
              className="shadow-none !w-[26rem] max-w-full"
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder={t('snapshots.searchPlaceholder')}
            />
          }
        />
      )}
    </PageContainer>
  );
}
