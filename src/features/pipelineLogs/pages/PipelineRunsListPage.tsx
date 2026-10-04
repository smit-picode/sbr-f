'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from '@/hooks/useAppRouter';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/table/DataTable';
import { SearchInput } from '@/components/common/SearchInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { getPipelineRunsColumns } from '../components/PipelineRunsColumns';
import { useGetPipelineRunsQuery } from '../api/pipelineLogsApi';
import { PIPELINE_RUNS_DEFAULT_FILTERS, PIPELINE_RUN_STATUS_OPTIONS } from '../constants';
import type { PipelineRunFilters } from '@/types';
import { cleanParams } from '@/utils/query';
import { toast } from '@/utils/toast';
import { useDebounce, usePersistedState } from '@/hooks';
import { RotateCcw, DatabaseZap } from 'lucide-react';

function is401(e: unknown): boolean { return typeof e === 'object' && e !== null && 'status' in e && (e as { status: unknown }).status === 401; }
function is403(e: unknown): boolean { return typeof e === 'object' && e !== null && 'status' in e && (e as { status: unknown }).status === 403; }

export function PipelineRunsListPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [filters, setFilters] = usePersistedState<PipelineRunFilters>('sbr:pipelineLogs:filters', PIPELINE_RUNS_DEFAULT_FILTERS);
  const debouncedSearch = useDebounce(filters.search, 400);

  const queryParams = cleanParams({
    ...filters,
    search: debouncedSearch,
    status: filters.status === '__all__' ? undefined : filters.status,
  });

  const { data, currentData, isLoading, isError, error, refetch, isFetching } = useGetPipelineRunsQuery(queryParams);

  const isPermissionError = isError && is403(error);
  const isSessionError    = isError && is401(error);

  useEffect(() => {
    if (isError && !isPermissionError && !isSessionError) {
      toast.error(t('pipelineLogs.loadError', { defaultValue: 'Failed to load pipeline runs. Please try again.' }));
    }
  }, [isError, isPermissionError, isSessionError, t]);

  const handleFilterChange = useCallback((partial: Partial<PipelineRunFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, [setFilters]);

  const handleReset = useCallback(() => {
    setFilters(PIPELINE_RUNS_DEFAULT_FILTERS);
  }, [setFilters]);

  const isDefault = JSON.stringify(filters) === JSON.stringify(PIPELINE_RUNS_DEFAULT_FILTERS);

  const columns = getPipelineRunsColumns((runId) => router.push(`/admin/pipeline-logs/${runId}`), t);
  const records = (isPermissionError || isSessionError) ? [] : (data?.data ?? []);
  const total   = (isPermissionError || isSessionError) ? 0 : (data?.total ?? 0);

  return (
    <PageContainer>
      <PageHeader
        title={t('admin.tabs.pipelineLogs', { defaultValue: 'Pipeline Logs' })}
        description={t('admin.tabs.pipelineLogsDesc', { defaultValue: 'ETL pipeline run history — read-only.' })}
        actions={
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <DatabaseZap className="h-4 w-4" />
            <span className="font-medium text-slate-700">{total.toLocaleString()}</span> {t('table.records', { defaultValue: 'records' })}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3 p-4 bg-white shadow-card rounded-lg">
        <SearchInput
          className="shadow-none"
          value={filters.search ?? ''}
          onChange={(v) => handleFilterChange({ search: v, page: 1 })}
          placeholder={t('pipelineLogs.searchPlaceholder', { defaultValue: 'Search by run ID or note...' })}
        />

        <Select value={filters.status ?? ''} onValueChange={(v) => handleFilterChange({ status: v, page: 1 })}>
          <SelectTrigger className="w-40 shadow-none">
            <SelectValue placeholder={t('filters.status', { defaultValue: 'Status' })} />
          </SelectTrigger>
          <SelectContent>
            {PIPELINE_RUN_STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value || '__all__'}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className={isDefault ? 'cursor-not-allowed' : undefined}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isDefault}
            className={`gap-1.5 ${isDefault ? 'pointer-events-none opacity-40' : ''}`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t('filters.reset', { defaultValue: 'Reset' })}
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={records}
        isLoading={isLoading}
        isRefreshing={isFetching && !currentData}
        isError={isError}
        onRetry={refetch}
        page={filters.page ?? 1}
        limit={filters.limit ?? 10}
        total={total}
        onPageChange={(p) => handleFilterChange({ page: p })}
        onLimitChange={(l) => handleFilterChange({ limit: l, page: 1 })}
        stickyFirstColumn
      />
    </PageContainer>
  );
}
