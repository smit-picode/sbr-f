'use client';

import { useState, useCallback, useEffect } from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/table/DataTable';
import { getLegalUnitsColumns } from '../components/LegalUnitsColumns';
import { LegalUnitsFiltersBar } from '../components/LegalUnitsFilters';
import { FilterChips, type FilterChip } from '@/components/common/FilterChips';
import { EditLegalUnitModal } from '../components/EditLegalUnitModal';
import { useGetLegalUnitsListQuery } from '../api/legalUnitsApi';
import { LEGAL_UNITS_DEFAULT_FILTERS } from '../constants';
import type { LegalUnitFilters, SbrLegalUnit } from '@/types';
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

export function LegalUnitsListPage() {
  const [filters, setFilters] = useState<LegalUnitFilters>(LEGAL_UNITS_DEFAULT_FILTERS);
  const [editTarget, setEditTarget] = useState<SbrLegalUnit | null>(null);
  const { t } = useTranslation();

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

  // Determine which permission to declare for this request.
  // The backend checks this header strictly: it must be in the route's allowed list
  // AND the user must have that specific permission (or hold the parent without any children).
  const FILTER_KEYS: (keyof typeof queryParams)[] = ['search', 'estStatus', 'sectorId', 'sourceCode', 'isicCode', 'mainBranchFLG'];
  const hasActiveFilters = FILTER_KEYS.some(k => {
    const v = queryParams[k];
    return v !== undefined && v !== '' && v !== null;
  });
  // Search requires BOTH view (to see the list) AND search (to filter it) — sent as comma-separated
  const declaredPermission = hasActiveFilters
    ? 'establishments.view,establishments.search'
    : 'establishments.view';

  const { data, isLoading, isError, error, refetch } = useGetLegalUnitsListQuery({
    ...queryParams,
    _permission: declaredPermission,
  });

  const isValidationError = isError && is400(error);
  const isPermissionError = isError && is403(error);
  const isSessionError    = isError && is401(error);

  useEffect(() => {
    // Skip 400/401/403 — each has its own handler (validation inline, session/permission via global handler)
    if (isError && !isValidationError && !isPermissionError && !isSessionError) {
      toast.error('Failed to load legal units. Please try again.');
    }
  }, [isError, isValidationError, isPermissionError]);

  const handleFilterChange = useCallback((partial: Partial<LegalUnitFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleReset = useCallback(() => {
    setFilters(LEGAL_UNITS_DEFAULT_FILTERS);
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

  const { canEdit: canEditLegalUnit, canSearch } = usePermission('establishments');
  const columns = getLegalUnitsColumns((row) => setEditTarget(row), t, canEditLegalUnit);
  // On 403: clear data so stale cached records don't appear alongside the error state
  const records = (isValidationError || isPermissionError || isSessionError) ? [] : (data?.data ?? []);
  const total   = (isValidationError || isPermissionError || isSessionError) ? 0 : (data?.total ?? 0);

  return (
    <PageContainer>
      <PageHeader
        title={t('pages.legalUnits.title')}
        description={t('pages.legalUnits.description')}
        actions={
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Building2 className="h-4 w-4" />
            <span className="font-medium text-slate-700">{total.toLocaleString()}</span> {t('table.records')}
          </div>
        }
      />

      {canSearch && (
        <LegalUnitsFiltersBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          isDefault={JSON.stringify(filters) === JSON.stringify(LEGAL_UNITS_DEFAULT_FILTERS)}
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
      />

      <EditLegalUnitModal
        frame={editTarget}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
      />
    </PageContainer>
  );
}
