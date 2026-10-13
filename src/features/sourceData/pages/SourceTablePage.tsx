'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from '@/hooks/useAppRouter';
import { useTranslation } from 'react-i18next';
import type { ColumnDef } from '@tanstack/react-table';
import { Database, Eye } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { NoData } from '@/components/common/NoData';
import { SourceTableSkeleton } from '@/components/common/SourceTableSkeleton';
import { DataTable } from '@/components/table/DataTable';
import { formatNumber } from '@/utils/format';
import { cleanParams } from '@/utils/query';
import type { SourceTableColumn, SourceTableRow, SourceTableFilters } from '@/types';
import { useGetSourceCatalogQuery, useGetSourceTableColumnsQuery, useGetSourceTableRowsQuery } from '../api/sourceCatalogApi';
import { useSourceDataAccess } from '../hooks/useSourceDataAccess';
import { formatSourceValue } from '../utils/formatSourceValue';
import { SOURCE_TABLE_BROWSABLE_PREFIX, SOURCE_TABLE_CELL_MAX_CHARS, SOURCE_TABLE_DEFAULT_LIMIT } from '../constants';

const DEFAULT_FILTERS: SourceTableFilters = { page: 1, limit: SOURCE_TABLE_DEFAULT_LIMIT };

const getSourceTableColumns = (columns: SourceTableColumn[]): ColumnDef<SourceTableRow>[] =>
  columns.map((c) => ({
    id: c.COLUMN_NAME,
    accessorFn: (row) => row[c.COLUMN_NAME],
    header: c.COLUMN_NAME,
    cell: ({ getValue }) => {
      const text = formatSourceValue(getValue<string | number | null>(), c.KIND);
      const clipped = text.length > SOURCE_TABLE_CELL_MAX_CHARS ? `${text.slice(0, SOURCE_TABLE_CELL_MAX_CHARS)}…` : text;
      const dir = c.KIND === 'text' ? 'auto' : 'ltr';
      return <span dir={dir} className="text-sm text-slate-700" title={text.length > SOURCE_TABLE_CELL_MAX_CHARS ? text : undefined}>{clipped}</span>;
    },
  }));

export function SourceTablePage({ code, table }: { code: string; table: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const canBrowse = useSourceDataAccess();
  const isBrowsable = table.toUpperCase().startsWith(SOURCE_TABLE_BROWSABLE_PREFIX);
  const [filters, setFilters] = useState<SourceTableFilters>(DEFAULT_FILTERS);

  const { data: catalog } = useGetSourceCatalogQuery();
  const description = useMemo(
    () => catalog?.data?.find((r) => r.TABLE_NAME.toUpperCase() === table.toUpperCase())?.TABLE_DESC ?? undefined,
    [catalog, table],
  );

  const skip = !canBrowse || !isBrowsable;
  const columnsQuery = useGetSourceTableColumnsQuery(table, { skip });
  const rowsQuery = useGetSourceTableRowsQuery({ table, ...cleanParams(filters) }, { skip: skip || !columnsQuery.data });

  const columns = useMemo(() => getSourceTableColumns(columnsQuery.data?.data ?? []), [columnsQuery.data]);
  const handleFilterChange = useCallback((partial: Partial<SourceTableFilters>) => setFilters((prev) => ({ ...prev, ...partial })), []);

  const columnsStatus = (columnsQuery.error as { status?: number } | undefined)?.status;
  const isNotFound = columnsStatus === 400 || columnsStatus === 404;
  const total = rowsQuery.data?.total ?? 0;
  const back = { label: t('sourceCatalog.backToRegulator', { defaultValue: 'Back to {{code}}', code }), onClick: () => router.push(`/sources/${encodeURIComponent(code)}`) };
  const loadError = t('sourceCatalog.loadTableError', { defaultValue: 'Failed to load this table. Please try again.' });

  const body = !canBrowse ? (
    <NoData message={t('sourceCatalog.noDataPermission', { defaultValue: 'You do not have permission to view source table data.' })} />
  ) : !isBrowsable ? (
    <NoData message={t('sourceCatalog.tableNotBrowsable', { defaultValue: 'This table cannot be browsed.' })} />
  ) : columnsQuery.isLoading ? (
    <SourceTableSkeleton />
  ) : columnsQuery.isError && isNotFound ? (
    <NoData message={t('sourceCatalog.tableNotFound', { defaultValue: 'This table is not in the source catalog.' })} />
  ) : columnsQuery.isError ? (
    <ErrorState message={loadError} onRetry={columnsQuery.refetch} />
  ) : (
    <DataTable
      key={table}
      columns={columns}
      data={rowsQuery.data?.data ?? []}
      isLoading={rowsQuery.isLoading}
      isRefreshing={rowsQuery.isFetching && !rowsQuery.currentData}
      isError={rowsQuery.isError}
      onRetry={rowsQuery.refetch}
      page={filters.page ?? 1}
      limit={filters.limit ?? SOURCE_TABLE_DEFAULT_LIMIT}
      total={total}
      onPageChange={(p) => handleFilterChange({ page: p })}
      onLimitChange={(l) => handleFilterChange({ limit: l, page: 1 })}
      onSortChange={(field, order) => handleFilterChange({ sortBy: field ?? undefined, sortOrder: order ?? undefined, page: 1 })}
    />
  );

  return (
    <PageContainer>
      <PageHeader
        title={table}
        description={description}
        back={back}
        chips={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-bold text-white">
            <Eye className="h-3 w-3" />
            {t('sourceCatalog.readOnly', { defaultValue: 'Read-only source' })}
          </span>
        }
        actions={
          rowsQuery.data ? (
            <div className="flex items-center gap-1.5 text-sm text-white/90">
              <Database className="h-4 w-4" />
              <span className="font-semibold text-white">{formatNumber(total)}</span> {t('table.records')}
            </div>
          ) : undefined
        }
      />
      {body}
    </PageContainer>
  );
}
