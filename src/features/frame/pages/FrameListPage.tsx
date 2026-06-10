'use client';

import { useState, useCallback, useEffect } from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/table/DataTable';
import { getFrameColumns } from '../components/FrameColumns';
import { FrameFiltersBar } from '../components/FrameFilters';
import { EditFrameModal } from '../components/EditFrameModal';
import { useGetFrameListQuery } from '../api/frameApi';
import { FRAME_DEFAULT_FILTERS } from '../constants';
import type { FrameFilters, SbrFrame } from '@/types';
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

export function FrameListPage() {
  const [filters, setFilters] = useState<FrameFilters>(FRAME_DEFAULT_FILTERS);
  const [editTarget, setEditTarget] = useState<SbrFrame | null>(null);
  const { t } = useTranslation();

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

  const { data, isLoading, isError, error, refetch } = useGetFrameListQuery({
    ...queryParams,
    _permission: declaredPermission,
  });

  const isValidationError = isError && is400(error);
  const isPermissionError = isError && is403(error);
  const isSessionError    = isError && is401(error);

  useEffect(() => {
    // Skip 400/401/403 — each has its own handler (validation inline, session/permission via global handler)
    if (isError && !isValidationError && !isPermissionError && !isSessionError) {
      toast.error('Failed to load establishments. Please try again.');
    }
  }, [isError, isValidationError, isPermissionError]);

  const handleFilterChange = useCallback((partial: Partial<FrameFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleReset = useCallback(() => {
    setFilters(FRAME_DEFAULT_FILTERS);
  }, []);

  const { canEdit: canEditFrame, canSearch } = usePermission('establishments');
  const columns = getFrameColumns((row) => setEditTarget(row), t, canEditFrame);
  // On 403: clear data so stale cached records don't appear alongside the error state
  const records = (isValidationError || isPermissionError || isSessionError) ? [] : (data?.data ?? []);
  const total   = (isValidationError || isPermissionError || isSessionError) ? 0 : (data?.total ?? 0);

  return (
    <PageContainer>
      <PageHeader
        title={t('pages.frame.title')}
        description={t('pages.frame.description')}
        actions={
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Building2 className="h-4 w-4" />
            <span className="font-medium text-slate-700">{total.toLocaleString()}</span> {t('table.records')}
          </div>
        }
      />

      {canSearch && (
        <FrameFiltersBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          isDefault={JSON.stringify(filters) === JSON.stringify(FRAME_DEFAULT_FILTERS)}
        />
      )}

      <DataTable
        columns={columns}
        data={records}
        isLoading={isLoading}
        isError={isError && !isValidationError}
        onRetry={refetch}
        page={filters.page ?? 1}
        limit={filters.limit ?? 20}
        total={total}
        onPageChange={(p) => handleFilterChange({ page: p })}
        onLimitChange={(l) => handleFilterChange({ limit: l, page: 1 })}
      />

      <EditFrameModal
        frame={editTarget}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
      />
    </PageContainer>
  );
}
