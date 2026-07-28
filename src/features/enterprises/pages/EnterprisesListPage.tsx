'use client';

import { useState, useCallback, useEffect } from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/table/DataTable';
import { FilterChips, type FilterChip } from '@/components/common/FilterChips';
import { ColumnFilters, type ColumnFilterRow } from '@/components/common/ColumnFilters';
import { getEnterpriseColumns } from '../components/EnterpriseColumns';
import { EnterprisesFiltersBar } from '../components/EnterprisesFilters';
import { useGetEnterprisesListQuery } from '../api/enterprisesApi';
import { ENTERPRISE_DEFAULT_FILTERS, ENTERPRISE_FILTER_COLUMNS } from '../constants';
import type { EnterpriseFilters } from '@/types';
import { cleanParams } from '@/utils/query';
import { toast } from '@/utils/toast';
import { useDebounce, usePermission } from '@/hooks';
import { Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';

function is400(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && (error as { status: unknown }).status === 400;
}
function is401(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && (error as { status: unknown }).status === 401;
}
function is403(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && (error as { status: unknown }).status === 403;
}

export function EnterprisesListPage() {
  const [filters, setFilters] = useState<EnterpriseFilters>(ENTERPRISE_DEFAULT_FILTERS);
  const [columnFilters, setColumnFilters] = useState<ColumnFilterRow[]>([]);
  const { t } = useTranslation();
  const router = useRouter();

  // Debounce only the text search — dropdowns and pagination fire immediately
  const debouncedSearch = useDebounce(filters.search, 500);

  const { canSearch, canViewDetail } = usePermission('enterprises');

  const activeColumnFilters = columnFilters.filter((r) => r.column && r.value.trim());

  const queryParams = cleanParams({
    ...filters,
    search: debouncedSearch,
    status: filters.status === '__all__' ? undefined : filters.status,
    sectorId: filters.sectorId === '__all__' ? undefined : filters.sectorId,
    columnFilters: activeColumnFilters.length
      ? JSON.stringify(activeColumnFilters.map((r) => ({ column: r.column, operator: r.operator, value: r.value.trim() })))
      : undefined,
  });

  const { data, isLoading, isError, error, refetch } = useGetEnterprisesListQuery(queryParams);

  const isValidationError = isError && is400(error);

  useEffect(() => {
    // Skip 400/401/403 — handled inline / by the global handler in services/api.ts
    if (isError && !is400(error) && !is401(error) && !is403(error)) {
      toast.error(t('pages.enterprises.loadError', { defaultValue: 'Failed to load enterprises. Please try again.' }));
    }
  }, [isError, error, t]);

  const handleFilterChange = useCallback((partial: Partial<EnterpriseFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleReset = useCallback(() => {
    setFilters(ENTERPRISE_DEFAULT_FILTERS);
    setColumnFilters([]);
  }, []);

  const handleColumnFiltersChange = useCallback((rows: ColumnFilterRow[]) => {
    setColumnFilters(rows);
    setFilters((prev) => ({ ...prev, page: 1 }));
  }, []);

  const activeChips: FilterChip[] = [];
  if (filters.search) {
    activeChips.push({
      key: 'search',
      label: `${t('filters.search', { defaultValue: 'Search' })}: ${filters.search}`,
      onRemove: () => handleFilterChange({ search: '', page: 1 }),
    });
  }
  if (filters.status && filters.status !== '__all__') {
    activeChips.push({
      key: 'status',
      label: `${t('filters.status')}: ${filters.status}`,
      onRemove: () => handleFilterChange({ status: '', page: 1 }),
    });
  }
  if (filters.sectorId && filters.sectorId !== '__all__') {
    activeChips.push({
      key: 'sectorId',
      label: `${t('filters.sector')}: ${filters.sectorId}`,
      onRemove: () => handleFilterChange({ sectorId: '', page: 1 }),
    });
  }

  const columns = getEnterpriseColumns(t);
  const records = isValidationError ? [] : (data?.data ?? []);
  const total = isValidationError ? 0 : (data?.total ?? 0);

  return (
    <PageContainer>
      <PageHeader
        title={t('pages.enterprises.title')}
        description={t('pages.enterprises.description')}
        actions={
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Layers className="h-4 w-4" />
            <span className="font-medium text-slate-700">{total.toLocaleString()}</span> {t('table.records')}
          </div>
        }
      />

      {canSearch && (
        <EnterprisesFiltersBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          isDefault={JSON.stringify(filters) === JSON.stringify(ENTERPRISE_DEFAULT_FILTERS)}
        />
      )}

      {canSearch && (
        <ColumnFilters columns={ENTERPRISE_FILTER_COLUMNS} value={columnFilters} onChange={handleColumnFiltersChange} />
      )}

      {canSearch && <FilterChips chips={activeChips} onClearAll={handleReset} />}

      <DataTable
        columns={columns}
        data={records}
        isLoading={isLoading}
        isError={isError && !isValidationError}
        onRetry={refetch}
        page={filters.page ?? 1}
        limit={filters.limit ?? 10}
        total={total}
        onPageChange={(p) => handleFilterChange({ page: p })}
        onLimitChange={(l) => handleFilterChange({ limit: l, page: 1 })}
        onRowClick={canViewDetail ? (row) => router.push(`/enterprises/${row.ENTERPRISE_ID}`) : undefined}
        stickyFirstColumn
      />
    </PageContainer>
  );
}
