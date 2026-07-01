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
import { ColumnFilters, type ColumnFilterRow } from '@/components/common/ColumnFilters';
import { useGetAuditLogListQuery } from '../api/auditLogApi';
import type { AuditLogFilters } from '@/types';
import { cleanParams } from '@/utils/query';
import { toast } from '@/utils/toast';
import { ClipboardList, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '@/hooks/useDebounce';
import { usePermission } from '@/hooks';

const DEFAULT_FILTERS: AuditLogFilters = { page: 1, limit: 10 };

// Values stay as the real table names (sent to the backend); labels are display-only.
const TABLE_VALUES = ['SBR_ESTABLISHMENTS', 'SBR_ENTERPRISES', 'SBR_CONTACTS', 'SBR_ADDRESSES'];
const TABLE_OPTIONS = [
  { label: 'All Tables', value: '__all__' },
  ...TABLE_VALUES.map((v) => ({ label: prettyTableName(v), value: v })),
];

// Columns exposed to the dynamic "Column filters" UI. Values match the backend
// AUDIT_LOG_FILTER_COLUMNS allow-list (auditLog.controller); labels are display-only.
const AUDIT_LOG_FILTER_COLUMNS: { value: string; label: string }[] = [
  { value: 'TABLE_NAME', label: 'Table' },
  { value: 'OPERATION', label: 'Operation' },
  { value: 'STATUS', label: 'Status' },
  { value: 'CHANGE_REASON', label: 'Reason' },
  { value: 'PREV_RECORD_ID', label: 'Prev Record ID' },
  { value: 'NEW_RECORD_ID', label: 'New Record ID' },
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
  const activeColumnFilters = debouncedColumnFilters.filter((r) => r.column && r.value.trim());

  const queryParams = cleanParams({
    ...filters,
    columnFilters: activeColumnFilters.length
      ? JSON.stringify(activeColumnFilters.map((r) => ({ column: r.column, operator: r.operator, value: r.value.trim() })))
      : undefined,
  });

  const { data, isLoading, isError, error, refetch } = useGetAuditLogListQuery(queryParams, {
    refetchOnMountOrArgChange: true,
  });

  const isValidationError = isError && is400(error);

  useEffect(() => {
    const is401 = typeof error === 'object' && error !== null && 'status' in error && (error as { status: unknown }).status === 401;
    const is403 = typeof error === 'object' && error !== null && 'status' in error && (error as { status: unknown }).status === 403;
    // Skip 401/403 — global handler in services/api.ts already shows the appropriate toast
    if (isError && !is400(error) && !is401 && !is403 && !isFetchError(error)) {
      toast.error('Failed to load audit log. Please try again.');
    }
  }, [isError, error]);

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

      {canSearch && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-white border border-slate-200 rounded-lg">
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

          <Input
            type="number"
            placeholder={t('filters.filterByRecordId')}
            className="w-48 h-8 text-xs shadow-none focus:border-[#A71D3A]/40 focus:ring-[#A71D3A]/20"
            min="1"
            value={recordIdInput}
            onKeyDown={(e) => {
              if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
            }}
            onChange={(e) => {
              const val = e.target.value;
              if (val !== '' && Number(val) <= 0) {
                toast.warning('Record ID must be greater than 0.');
                return;
              }
              setRecordIdInput(val);
            }}
          />

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
      )}

      {canSearch && (
        <ColumnFilters columns={AUDIT_LOG_FILTER_COLUMNS} value={columnFilters} onChange={handleColumnFiltersChange} />
      )}

      {canSearch && <FilterChips chips={activeChips} onClearAll={clearAllAudit} />}

      <DataTable
        columns={getAuditLogColumns(t)}
        data={records}
        isLoading={isLoading}
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
