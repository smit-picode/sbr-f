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
import { useDebounce } from '@/hooks';
import { Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function is400(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && (error as { status: unknown }).status === 400;
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

  const { data, isLoading, isError, error, refetch } = useGetFrameListQuery(queryParams);

  const isValidationError = isError && is400(error);

  useEffect(() => {
    if (isError && !is400(error)) toast.error('Failed to load establishments. Please try again.');
  }, [isError, error]);

  const handleFilterChange = useCallback((partial: Partial<FrameFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleReset = useCallback(() => {
    setFilters(FRAME_DEFAULT_FILTERS);
  }, []);

  const columns = getFrameColumns((row) => setEditTarget(row), t);
  const records = isValidationError ? [] : (data?.data ?? []);
  const total = isValidationError ? 0 : (data?.total ?? 0);

  return (
    <PageContainer>
      <PageHeader
        title={t('pages.frame.title')}
        description={t('pages.frame.description')}
        actions={
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Building2 className="h-4 w-4" />
            <span className="font-medium text-slate-700">{total.toLocaleString()}</span> records
          </div>
        }
      />

      <FrameFiltersBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        isDefault={JSON.stringify(filters) === JSON.stringify(FRAME_DEFAULT_FILTERS)}
      />

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
