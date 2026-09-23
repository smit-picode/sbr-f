'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/table/DataTable';
import { getEstablishmentsColumns } from '../components/EstablishmentsColumns';
import { EstablishmentsFiltersBar } from '../components/EstablishmentsFilters';
import { FilterChips, type FilterChip } from '@/components/common/FilterChips';
import { ColumnFilters, type ColumnFilterRow, isActiveColumnFilterRow } from '@/components/common/ColumnFilters';
import { EditEstablishmentModal } from '../components/EditEstablishmentModal';
import { useGetEstablishmentsListQuery } from '../api/establishmentsApi';
import { ESTABLISHMENTS_DEFAULT_FILTERS, ESTABLISHMENT_FILTER_COLUMNS, ESTABLISHMENTS_SORTABLE_COLUMNS, EST_STATUS_VALUES } from '../constants';
import type { EstablishmentFilters, SbrEstablishment } from '@/types';
import { cleanParams } from '@/utils/query';
import { toast } from '@/utils/toast';
import { useDebounce, usePermission, usePersistedState } from '@/hooks';
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

// Deep-link support for search and the home KPI's Active status filter takes priority over a
// restored session, since it reflects the user's explicit intent from wherever they linked in.
function readInitialFilters(): EstablishmentFilters | undefined {
  if (typeof window === 'undefined') return undefined;
  const params = new URLSearchParams(window.location.search);
  const initialSearch = params.get('search');
  const initialEstStatus = params.get('estStatus');
  if (!initialSearch && initialEstStatus !== EST_STATUS_VALUES.ACTIVE) return undefined;
  return {
    ...ESTABLISHMENTS_DEFAULT_FILTERS,
    ...(initialSearch ? { search: initialSearch } : {}),
    ...(initialEstStatus === EST_STATUS_VALUES.ACTIVE ? { estStatus: EST_STATUS_VALUES.ACTIVE } : {}),
    page: 1,
  };
}

export function EstablishmentsListPage() {
  const [filters, setFilters] = usePersistedState<EstablishmentFilters>(
    'sbr:establishments:filters',
    ESTABLISHMENTS_DEFAULT_FILTERS,
    readInitialFilters
  );
  const [columnFilters, setColumnFilters] = usePersistedState<ColumnFilterRow[]>('sbr:establishments:columnFilters', []);
  const [editTarget, setEditTarget] = useState<SbrEstablishment | null>(null);
  const { t } = useTranslation();
  const router = useRouter();

  // Debounce only the text search — dropdowns and pagination fire immediately
  const debouncedSearch = useDebounce(filters.search, 500);

  const activeColumnFilters = columnFilters.filter(isActiveColumnFilterRow);

  const queryParams = cleanParams({
    ...filters,
    search: debouncedSearch,
    estStatus: filters.estStatus === '__all__' ? undefined : filters.estStatus,
    sectorId: filters.sectorId === '__all__' ? undefined : filters.sectorId,
    sourceCode: filters.sourceCode === '__all__' ? undefined : filters.sourceCode,
    columnFilters: activeColumnFilters.length
      ? JSON.stringify(activeColumnFilters.map((r) => ({ column: r.column, operator: r.operator, value: r.value.trim() })))
      : undefined,
  });

  const { data, isLoading, isFetching, isError, error, refetch } = useGetEstablishmentsListQuery(queryParams);
  // isLoading is false once this exact args combo has cached data (e.g. paging/sorting back over
  // an already-searched term) — isFetching still fires then, so the search box gets its own
  // spinner for that revalidation instead of leaving the table looking idle mid-request.
  const searchLoading = isFetching && !isLoading;

  const isValidationError = isError && is400(error);
  const isPermissionError = isError && is403(error);
  const isSessionError    = isError && is401(error);

  useEffect(() => {
    // Skip 400/401/403 — each has its own handler (validation inline, session/permission via global handler)
    if (isError && !isValidationError && !isPermissionError && !isSessionError) {
      toast.error(t('pages.establishments.loadError', { defaultValue: 'Failed to load establishments. Please try again.' }));
    }
  }, [isError, isValidationError, isPermissionError, t]);

  const handleFilterChange = useCallback((partial: Partial<EstablishmentFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, [setFilters]);

  const handleReset = useCallback(() => {
    setFilters(ESTABLISHMENTS_DEFAULT_FILTERS);
    setColumnFilters([]);
  }, [setFilters, setColumnFilters]);

  const handleColumnFiltersChange = useCallback((rows: ColumnFilterRow[]) => {
    setColumnFilters(rows);
    setFilters((prev) => ({ ...prev, page: 1 }));
  }, [setFilters, setColumnFilters]);

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
          searchLoading={searchLoading}
        />
      )}

      {canSearch && (
        <ColumnFilters columns={ESTABLISHMENT_FILTER_COLUMNS} value={columnFilters} onChange={handleColumnFiltersChange} />
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
        onSortChange={(field, order) => handleFilterChange({ sortBy: field ?? undefined, sortOrder: order ?? undefined, page: 1 })}
        sortableColumns={ESTABLISHMENTS_SORTABLE_COLUMNS}
        stickyFirstColumn
        onRowClick={canOpenDetail ? (row) => router.push(`/establishments/${row.SBR_ID}`) : undefined}
        getRowClassName={(row) => (row.HAS_PENDING_REQUEST ? 'hover:bg-[#FDF7E3] shadow-[inset_3px_0_0_0_#BF9F5F]' : undefined)}
      />

      <EditEstablishmentModal
        frame={editTarget}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
      />
    </PageContainer>
  );
}
