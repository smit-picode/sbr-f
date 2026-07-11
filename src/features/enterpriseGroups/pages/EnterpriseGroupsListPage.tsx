'use client';

import { useState, useCallback, useEffect } from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/table/DataTable';
import { FilterChips, type FilterChip } from '@/components/common/FilterChips';
import { ColumnFilters, type ColumnFilterRow } from '@/components/common/ColumnFilters';
import { SearchInput } from '@/components/common/SearchInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { getEnterpriseGroupColumns } from '../components/EnterpriseGroupColumns';
import { CreateEnterpriseGroupModal } from '../components/CreateEnterpriseGroupModal';
import { useGetEnterpriseGroupsListQuery } from '../api/enterpriseGroupsApi';
import {
  ENTERPRISE_GROUP_DEFAULT_FILTERS,
  ENTERPRISE_GROUP_FILTER_COLUMNS,
  ENTERPRISE_GROUP_STATUS_OPTIONS,
  ENTERPRISE_GROUP_TYPE_OPTIONS,
} from '../constants';
import type { EnterpriseGroupFilters } from '@/types';
import { cleanParams } from '@/utils/query';
import { toast } from '@/utils/toast';
import { useDebounce, usePermission } from '@/hooks';
import { RotateCcw, Network, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function is400(e: unknown): boolean { return typeof e === 'object' && e !== null && 'status' in e && (e as { status: unknown }).status === 400; }
function is401(e: unknown): boolean { return typeof e === 'object' && e !== null && 'status' in e && (e as { status: unknown }).status === 401; }
function is403(e: unknown): boolean { return typeof e === 'object' && e !== null && 'status' in e && (e as { status: unknown }).status === 403; }

export function EnterpriseGroupsListPage() {
  const [filters, setFilters] = useState<EnterpriseGroupFilters>(ENTERPRISE_GROUP_DEFAULT_FILTERS);
  const [columnFilters, setColumnFilters] = useState<ColumnFilterRow[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const { t } = useTranslation();
  const debouncedSearch = useDebounce(filters.search, 400);

  const { canSearch, canCreate } = usePermission('enterprise_groups');

  const activeColumnFilters = columnFilters.filter((r) => r.column && r.value.trim());

  const queryParams = cleanParams({
    ...filters,
    search: debouncedSearch,
    status: filters.status === '__all__' ? undefined : filters.status,
    type:   filters.type === '__all__' ? undefined : filters.type,
    columnFilters: activeColumnFilters.length
      ? JSON.stringify(activeColumnFilters.map((r) => ({ column: r.column, operator: r.operator, value: r.value.trim() })))
      : undefined,
  });

  const { data, isLoading, isError, error, refetch } = useGetEnterpriseGroupsListQuery(queryParams);

  const isValidationError = isError && is400(error);

  useEffect(() => {
    if (isError && !is400(error) && !is401(error) && !is403(error)) {
      toast.error('Failed to load enterprise groups. Please try again.');
    }
  }, [isError, error]);

  const handleFilterChange = useCallback((partial: Partial<EnterpriseGroupFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleReset = useCallback(() => {
    setFilters(ENTERPRISE_GROUP_DEFAULT_FILTERS);
    setColumnFilters([]);
  }, []);

  const handleColumnFiltersChange = useCallback((rows: ColumnFilterRow[]) => {
    setColumnFilters(rows);
    setFilters((prev) => ({ ...prev, page: 1 }));
  }, []);

  const isDefault = JSON.stringify(filters) === JSON.stringify(ENTERPRISE_GROUP_DEFAULT_FILTERS) && columnFilters.length === 0;

  const activeChips: FilterChip[] = [];
  if (filters.search) {
    activeChips.push({ key: 'search', label: `Search: ${filters.search}`, onRemove: () => handleFilterChange({ search: '', page: 1 }) });
  }
  if (filters.status && filters.status !== '__all__') {
    activeChips.push({ key: 'status', label: `Status: ${filters.status}`, onRemove: () => handleFilterChange({ status: '', page: 1 }) });
  }
  if (filters.type && filters.type !== '__all__') {
    activeChips.push({ key: 'type', label: `Type: ${filters.type}`, onRemove: () => handleFilterChange({ type: '', page: 1 }) });
  }

  const columns = getEnterpriseGroupColumns(t);
  const records = isValidationError ? [] : (data?.data ?? []);
  const total   = isValidationError ? 0  : (data?.total ?? 0);

  return (
    <PageContainer>
      <PageHeader
        title={t('pages.enterpriseGroups.title', { defaultValue: 'Enterprise Groups' })}
        description={t('pages.enterpriseGroups.description', { defaultValue: 'Enterprises under common control (a UCI). Manage groupings and ownership.' })}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <Network className="h-4 w-4" />
              <span className="font-medium text-slate-700">{total.toLocaleString()}</span> {t('table.records', { defaultValue: 'records' })}
            </div>
            {canCreate && (
              <Button
                size="sm"
                style={{ background: 'linear-gradient(135deg, #A71D3A, #6B1428)', border: 'none' }}
                className="text-white gap-1.5"
              >
                <Plus className="h-4 w-4" />
                {t('enterpriseGroups.createGroup', { defaultValue: 'Create group' })}
              </Button>
            )}
          </div>
        }
      />

      {canSearch && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-white border border-slate-200 rounded-lg">
          <SearchInput
            className="shadow-none"
            value={filters.search ?? ''}
            onChange={(v) => handleFilterChange({ search: v, page: 1 })}
            placeholder={t('filters.searchByGroupIdOrUci', { defaultValue: 'Search by group ID, name, or UCI...' })}
          />

          <Select
            value={filters.type ?? ''}
            onValueChange={(v) => handleFilterChange({ type: v, page: 1 })}
          >
            <SelectTrigger className="w-40 shadow-none">
              <SelectValue placeholder={t('enterpriseGroups.allTypes', { defaultValue: 'All types' })} />
            </SelectTrigger>
            <SelectContent>
              {ENTERPRISE_GROUP_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value || '__all__'}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status ?? ''}
            onValueChange={(v) => handleFilterChange({ status: v, page: 1 })}
          >
            <SelectTrigger className="w-40 shadow-none">
              <SelectValue placeholder={t('enterpriseGroups.allStatuses', { defaultValue: 'All statuses' })} />
            </SelectTrigger>
            <SelectContent>
              {ENTERPRISE_GROUP_STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value || '__all__'}>{o.label}</SelectItem>
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
      )}

      {canSearch && (
        <ColumnFilters columns={ENTERPRISE_GROUP_FILTER_COLUMNS} value={columnFilters} onChange={handleColumnFiltersChange} />
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
        onRowClick={undefined}
        stickyFirstColumn
      />

      <CreateEnterpriseGroupModal open={showCreate} onClose={() => setShowCreate(false)} />
    </PageContainer>
  );
}
