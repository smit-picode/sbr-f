'use client';

import { useState, useCallback, useEffect } from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/table/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAuditLogColumns, prettyTableName } from '../components/AuditLogColumns';
import { FilterChips, type FilterChip } from '@/components/common/FilterChips';
import { ColumnFilters, type ColumnFilterRow, columnFiltersParam } from '@/components/common/ColumnFilters';
import { useGetAuditLogListQuery } from '../api/auditLogApi';
import type { AuditLogFilters } from '@/types';
import { cleanParams } from '@/utils/query';
import { toast } from '@/utils/toast';
import { ClipboardList, RotateCcw, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '@/hooks/useDebounce';
import { usePermission } from '@/hooks';
import { AUDIT_LOG_DEFAULT_FILTERS, AUDIT_LOG_FILTER_COLUMNS, AUDIT_LOG_TABLE_VALUES } from '../constants';

const DEFAULT_FILTERS = AUDIT_LOG_DEFAULT_FILTERS;
const TABLE_OPTIONS = [
  { label: 'All Tables', value: '__all__' },
  ...AUDIT_LOG_TABLE_VALUES.map((v) => ({ label: prettyTableName(v), value: v })),
];

function is400(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && (error as { status: unknown }).status === 400;
}

// RTK Query sets status: 'FETCH_ERROR' when a request is aborted/cancelled (e.g. superseded by a
// newer query while the user is still typing). These are not real errors — suppress the toast.
function isFetchError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && (error as { status: unknown }).status === 'FETCH_ERROR';
}

export function AuditLogPage() {
  const [filters, setFilters] = useState<AuditLogFilters>(DEFAULT_FILTERS);
  const [columnFilters, setColumnFilters] = useState<ColumnFilterRow[]>([]);
  // Debounce column-filter changes so the API is only called 500 ms after the user stops typing,
  // preventing a request (and cancelled-request error toast) on every keystroke.
  const debouncedColumnFilters = useDebounce(columnFilters, 500);
  const [recordIdInput, setRecordIdInput] = useState<string>('');
  const debouncedRecordId = useDebounce(recordIdInput, 500);
  const { t } = useTranslation();

  // Sync debounced recordId into filters
  useEffect(() => {
    const val = debouncedRecordId ? Number(debouncedRecordId) : undefined;
    setFilters((prev) => ({ ...prev, recordId: val && val > 0 ? val : undefined, page: 1 }));
  }, [debouncedRecordId]);

  const { canSearch } = usePermission('audit_log');

  // Use the debounced value for the API query — the immediate value drives the UI only.

  const queryParams = cleanParams({
    ...filters,
    columnFilters: columnFiltersParam(debouncedColumnFilters),
  });

  const { data, currentData, isLoading, isError, error, refetch, isFetching } = useGetAuditLogListQuery(queryParams, {
    refetchOnMountOrArgChange: true,
  });

  const isValidationError = isError && is400(error);

  useEffect(() => {
    const is401 = typeof error === 'object' && error !== null && 'status' in error && (error as { status: unknown }).status === 401;
    const is403 = typeof error === 'object' && error !== null && 'status' in error && (error as { status: unknown }).status === 403;
    // Skip 401/403 — global handler in services/api.ts already shows the appropriate toast
    if (isError && !is400(error) && !is401 && !is403 && !isFetchError(error)) {
      toast.error(t('pages.auditLog.loadError', { defaultValue: 'Failed to load audit log. Please try again.' }));
    }
  }, [isError, error, t]);

  const handleFilterChange = useCallback((partial: Partial<AuditLogFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleColumnFiltersChange = useCallback((rows: ColumnFilterRow[]) => {
    setColumnFilters(rows);
    setFilters((prev) => ({ ...prev, page: 1 }));
  }, []);

  const records = isValidationError ? [] : (data?.data ?? []);
  const total = isValidationError ? 0 : (data?.total ?? 0);

  // Active-filter chips
  const activeChips: FilterChip[] = [];
  if (filters.mine) {
    activeChips.push({
      key: 'mine',
      label: t('pages.auditLog.onlyMine', { defaultValue: 'Only my changes' }),
      onRemove: () => handleFilterChange({ mine: undefined, page: 1 }),
    });
  }
  if (filters.tableName) {
    activeChips.push({
      key: 'tableName',
      label: `${t('filters.table', { defaultValue: 'Table' })}: ${prettyTableName(filters.tableName)}`,
      onRemove: () => handleFilterChange({ tableName: undefined, page: 1 }),
    });
  }
  if (filters.recordId) {
    activeChips.push({
      key: 'recordId',
      label: `${t('filters.recordId', { defaultValue: 'Record ID' })}: ${filters.recordId}`,
      onRemove: () => { setRecordIdInput(''); handleFilterChange({ recordId: undefined, page: 1 }); },
    });
  }
  const clearAllAudit = () => { setFilters(DEFAULT_FILTERS); setRecordIdInput(''); setColumnFilters([]); };

  return (
    <PageContainer>
      <PageHeader
        title={t('pages.auditLog.title')}
        description={t('pages.auditLog.description')}
        actions={
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <ClipboardList className="h-4 w-4" />
            <span className="font-medium text-slate-700">{total.toLocaleString()}</span> {t('table.records')}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3 p-4 bg-white shadow-card rounded-lg">
        <Button
          variant="outline"
          size="sm"
          aria-pressed={!!filters.mine}
          title={t('pages.auditLog.onlyMineHint', { defaultValue: 'Changes you submitted, approved or rejected' })}
          onClick={() => handleFilterChange({ mine: filters.mine ? undefined : true, page: 1 })}
          className={`h-8 gap-1.5 text-xs shadow-none ${filters.mine ? 'border-[#A29374] bg-[#F4F0E8] text-[#87795D] hover:bg-[#F4F0E8]' : ''}`}
        >
          <UserRound className="h-3.5 w-3.5" />
          {t('pages.auditLog.onlyMine', { defaultValue: 'Only my changes' })}
        </Button>

        {canSearch && (
          <Select
            value={filters.tableName ?? '__all__'}
            onValueChange={(v) => handleFilterChange({ tableName: v === '__all__' ? undefined : v, page: 1 })}
          >
            <SelectTrigger className="w-44 shadow-none">
              <SelectValue placeholder={t('filters.allTables')} />
            </SelectTrigger>
            <SelectContent>
              {TABLE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {canSearch && (
          <Input
            type="number"
            placeholder={t('filters.filterByRecordId')}
            autoComplete="off"
            className="w-48 h-8 text-xs shadow-none focus:border-[#A29374]/40 focus:ring-[#A29374]/20"
            min="1"
            value={recordIdInput}
            onKeyDown={(e) => {
              if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
            }}
            onChange={(e) => {
              const val = e.target.value;
              if (val !== '' && Number(val) <= 0) {
                toast.warning(t('pages.auditLog.recordIdPositive', { defaultValue: 'Record ID must be greater than 0.' }));
                return;
              }
              setRecordIdInput(val);
            }}
          />
        )}

        {(() => {
          const isDefault = JSON.stringify(filters) === JSON.stringify(DEFAULT_FILTERS) && columnFilters.length === 0;
          return (
            <div className={isDefault ? 'cursor-not-allowed' : undefined}>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllAudit}
                disabled={isDefault}
                className={`gap-1.5 ${isDefault ? 'pointer-events-none opacity-40' : ''}`}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {t('filters.reset')}
              </Button>
            </div>
          );
        })()}
      </div>

      {canSearch && (
        <ColumnFilters columns={AUDIT_LOG_FILTER_COLUMNS} labelPrefix="columnFilters.columns.auditLog" value={columnFilters} onChange={handleColumnFiltersChange} valuesUrl="/audit-log/filter-values" />
      )}

      <FilterChips chips={activeChips} onClearAll={clearAllAudit} />

      <DataTable
        columns={getAuditLogColumns(t)}
        data={records}
        isLoading={isLoading}
        isRefreshing={isFetching && !currentData}
        isError={isError && !isValidationError}
        onRetry={refetch}
        page={filters.page ?? 1}
        limit={filters.limit ?? 10}
        total={total}
        onPageChange={(p) => handleFilterChange({ page: p })}
        onLimitChange={(l) => handleFilterChange({ limit: l, page: 1 })}
      />
    </PageContainer>
  );
}
