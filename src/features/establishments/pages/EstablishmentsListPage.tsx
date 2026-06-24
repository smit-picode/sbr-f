'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/table/DataTable';
import { getEstablishmentsColumns } from '../components/EstablishmentsColumns';
import { EstablishmentsFiltersBar } from '../components/EstablishmentsFilters';
import { FilterChips, type FilterChip } from '@/components/common/FilterChips';
import { EditEstablishmentModal } from '../components/EditEstablishmentModal';
import { useGetEstablishmentsListQuery } from '../api/establishmentsApi';
import { ESTABLISHMENTS_DEFAULT_FILTERS } from '../constants';
import type { EstablishmentFilters, SbrEstablishment } from '@/types';
import { cleanParams } from '@/utils/query';
import { toast } from '@/utils/toast';
import { useDebounce, usePermission } from '@/hooks';
import { Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function is400(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && (error as { status: unknown }).status === 400;
}

function is403(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && (error as { status: unknown }).status === 403;
}
function is401(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && (error as { status: unknown }).status === 401;
}

export function EstablishmentsListPage() {
  const [filters, setFilters] = useState<EstablishmentFilters>(ESTABLISHMENTS_DEFAULT_FILTERS);
  const [editTarget, setEditTarget] = useState<SbrEstablishment | null>(null);
  const { t } = useTranslation();
  const router = useRouter();

  // Deep-link support: a `?search=` param (e.g. from the Enterprise detail "open
  // establishment" action) seeds the search filter once on mount.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const initialSearch = new URLSearchParams(window.location.search).get('search');
    if (initialSearch) setFilters((prev) => ({ ...prev, search: initialSearch, page: 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce only the text search — dropdowns and pagination fire immediately
  const debouncedSearch = useDebounce(filters.search, 500);

  const queryParams = cleanParams({
    ...filters,
    search: debouncedSearch,
    estStatus: filters.estStatus === '__all__' ? undefined : filters.estStatus,
    sectorId: filters.sectorId === '__all__' ? undefined : filters.sectorId,
    sourceCode: filters.sourceCode === '__all__' ? undefined : filters.sourceCode,
  });

  const { data, isLoading, isError, error, refetch } = useGetEstablishmentsListQuery(queryParams);

  const isValidationError = isError && is400(error);
  const isPermissionError = isError && is403(error);
  const isSessionError    = isError && is401(error);

  useEffect(() => {
    // Skip 400/401/403 — each has its own handler (validation inline, session/permission via global handler)
    if (isError && !isValidationError && !isPermissionError && !isSessionError) {
      toast.error('Failed to load establishments. Please try again.');
    }
  }, [isError, isValidationError, isPermissionError]);

  const handleFilterChange = useCallback((partial: Partial<EstablishmentFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleReset = useCallback(() => {
    setFilters(ESTABLISHMENTS_DEFAULT_FILTERS);
  }, []);

  // Active-filter chips — value is "active" when it isn't empty or the "__all__" sentinel
  const activeChips: FilterChip[] = [];
  if (filters.search) {
    activeChips.push({
      key: 'search',
      label: `${t('filters.search', { defaultValue: 'Search' })}: ${filters.search}`,
      onRemove: () => handleFilterChange({ search: '', page: 1 }),
    });
  }
  if (filters.estStatus && filters.estStatus !== '__all__') {
    activeChips.push({
      key: 'estStatus',
      label: `${t('filters.status')}: ${filters.estStatus}`,
      onRemove: () => handleFilterChange({ estStatus: '', page: 1 }),
    });
  }
  if (filters.sectorId && filters.sectorId !== '__all__') {
    activeChips.push({
      key: 'sectorId',
      label: `${t('filters.sector')}: ${filters.sectorId}`,
      onRemove: () => handleFilterChange({ sectorId: '', page: 1 }),
    });
  }
  if (filters.sourceCode && filters.sourceCode !== '__all__') {
    activeChips.push({
      key: 'sourceCode',
      label: `${t('filters.source')}: ${filters.sourceCode}`,
      onRemove: () => handleFilterChange({ sourceCode: '', page: 1 }),
    });
  }

  const { canEdit: canEditEstablishment, canSearch, canViewDetail } = usePermission('establishments');
  // A row opens the detail screen for users who can view the detail or edit (mirrors backend guard)
  const canOpenDetail = canViewDetail || canEditEstablishment;
  const columns = getEstablishmentsColumns((row) => setEditTarget(row), t, canEditEstablishment);
  // On 403: clear data so stale cached records don't appear alongside the error state
  const records = (isValidationError || isPermissionError || isSessionError) ? [] : (data?.data ?? []);
  const total   = (isValidationError || isPermissionError || isSessionError) ? 0 : (data?.total ?? 0);

  return (
    <PageContainer>
      <PageHeader
        title={t('pages.establishments.title')}
        description={t('pages.establishments.description')}
        actions={
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Building2 className="h-4 w-4" />
            <span className="font-medium text-slate-700">{total.toLocaleString()}</span> {t('table.records')}
          </div>
        }
      />

      {canSearch && (
        <EstablishmentsFiltersBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          isDefault={JSON.stringify(filters) === JSON.stringify(ESTABLISHMENTS_DEFAULT_FILTERS)}
        />
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
        stickyFirstColumn
        onRowClick={canOpenDetail ? (row) => router.push(`/establishments/${row.SBR_ID}`) : undefined}
      />

      <EditEstablishmentModal
        frame={editTarget}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
      />
    </PageContainer>
  );
}
