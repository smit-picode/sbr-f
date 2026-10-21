'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye } from 'lucide-react';
import { useRouter } from '@/hooks/useAppRouter';
import { useDebounce } from '@/hooks/useDebounce';
import { useHasPermission } from '@/hooks/usePermission';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { NoData } from '@/components/common/NoData';
import { TableLoader } from '@/components/common/Loader';
import { DataTable } from '@/components/table/DataTable';
import { ColumnFilters, columnFilterItems } from '@/components/common/ColumnFilters';
import { cleanParams } from '@/utils/query';
import { formatNumber } from '@/utils/format';
import { useGetSourceCatalogQuery, useGetSourceTableColumnsQuery, useGetSourceTableQuery } from '../api/sourceCatalogApi';
import { getSourceTableColumns, getSourceTableFilterColumns } from '../components/SourceTableColumns';
import { SourceTableSearch } from '../components/SourceTableSearch';
import { SOURCE_TABLE_DEFAULT_PAGE_SIZE, SOURCE_TABLE_SEARCH_DEBOUNCE_MS, isBrowsableSourceTable } from '../constants';
import { defaultSearchColumn, searchableColumns } from '../utils/searchColumn';

import type { ColumnFilterRow } from '@/types';
// One regulator source table's rows, read-only: column filters, sorting and paging, no row action.
export function SourceTablePage({ code, table }: { code: string; table: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const canViewData = useHasPermission('source_catalog.view_data');
  const browsable = isBrowsableSourceTable(table);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(SOURCE_TABLE_DEFAULT_PAGE_SIZE);
  const [filterRows, setFilterRows] = useState<ColumnFilterRow[]>([]);
  const [sort, setSort] = useState<{ sortBy?: string; sortOrder?: 'asc' | 'desc' }>({});
  const [search, setSearch] = useState('');
  const [pickedColumn, setPickedColumn] = useState<string | undefined>();
  const debouncedSearch = useDebounce(search.trim(), SOURCE_TABLE_SEARCH_DEBOUNCE_MS);

  const catalog = useGetSourceCatalogQuery(undefined, { skip: !canViewData });
  const description = catalog.data?.data?.find((r) => r.TABLE_NAME === table)?.TABLE_DESC ?? undefined;
  const columnsQuery = useGetSourceTableColumnsQuery(table, { skip: !canViewData || !browsable });
  const sourceColumns = useMemo(() => columnsQuery.data?.data ?? [], [columnsQuery.data]);
  const columns = useMemo(() => getSourceTableColumns(sourceColumns), [sourceColumns]);
  const filterColumns = useMemo(() => getSourceTableFilterColumns(sourceColumns), [sourceColumns]);
  const searchColumns = useMemo(() => searchableColumns(sourceColumns), [sourceColumns]);
  const searchColumn = pickedColumn ?? defaultSearchColumn(sourceColumns, search);

  // The search is one more contains filter, so it needs nothing the column filters do not already use.
  const filterItems = [
    ...columnFilterItems(filterRows),
    ...(debouncedSearch && searchColumn ? [{ column: searchColumn, operator: 'contains', value: debouncedSearch }] : []),
  ];
  const params = cleanParams({ columnFilters: filterItems.length ? JSON.stringify(filterItems) : undefined, ...sort });
  const rowsQuery = useGetSourceTableQuery({ table, page, limit, ...params }, { skip: !canViewData || !browsable || !sourceColumns.length });
  const rows = rowsQuery.data?.data ?? [];
  const total = rowsQuery.data?.total ?? 0;

  const back = { label: t('sourceCatalog.backToTables', { defaultValue: '{{code}} tables', code }), onClick: () => router.push(`/sources/${encodeURIComponent(code)}`) };

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
        actions={canViewData && rowsQuery.data ? (
          <span className="text-sm text-white/80">
            <span className="font-semibold text-white">{formatNumber(total)}</span> {t('table.records')}
          </span>
        ) : undefined}
      />

      {!canViewData ? (
        <div className="rounded-xl bg-white shadow-card">
          <NoData message={t('sourceCatalog.noDataPermission', { defaultValue: 'You do not have permission to view the data in source tables.' })} />
        </div>
      ) : !browsable ? (
        <div className="rounded-xl bg-white shadow-card">
          <NoData
            message={t('sourceCatalog.stagingTitle', { defaultValue: 'This table is not browsable' })}
            description={t('sourceCatalog.stagingTip', { defaultValue: 'A pipeline working copy of regulator data. Only the regulator source tables open here, because only they carry the column masking.' })}
          />
        </div>
      ) : columnsQuery.isLoading ? (
        <div className="rounded-xl bg-white shadow-card">
          <table className="w-full"><tbody><TableLoader /></tbody></table>
        </div>
      ) : columnsQuery.isError ? (
        <div className="rounded-xl bg-white shadow-card">
          <ErrorState message={t('sourceCatalog.tableLoadError', { defaultValue: 'This source table could not be loaded.' })} onRetry={columnsQuery.refetch} />
        </div>
      ) : (
        <div className="space-y-3">
          {searchColumns.length > 0 && (
            <SourceTableSearch
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              column={searchColumn}
              columns={searchColumns}
              onColumnChange={(c) => { setPickedColumn(c); setPage(1); }}
              loading={rowsQuery.isFetching && !rowsQuery.isLoading && !!debouncedSearch}
            />
          )}
          <ColumnFilters
            columns={filterColumns}
            valuesUrl={`/source-catalog/tables/${encodeURIComponent(table)}/filter-values`}
            value={filterRows}
            onChange={(next) => { setFilterRows(next); setPage(1); }}
          />
          <DataTable
            columns={columns}
            data={rows}
            isLoading={rowsQuery.isLoading || (rowsQuery.isFetching && !rows.length)}
            isError={rowsQuery.isError}
            onRetry={rowsQuery.refetch}
            page={page}
            limit={limit}
            total={total}
            onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
            onSortChange={(field, order) => { setSort(field && order ? { sortBy: field, sortOrder: order } : {}); setPage(1); }}
            stickyFirstColumn
          />
        </div>
      )}
    </PageContainer>
  );
}
