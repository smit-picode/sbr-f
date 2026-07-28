'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/table/DataTable';
import { SearchInput } from '@/components/common/SearchInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FilterChips, type FilterChip } from '@/components/common/FilterChips';
import { ColumnFilters, type ColumnFilterRow } from '@/components/common/ColumnFilters';
import { getLegalUnitColumns } from '../components/LegalUnitColumns';
import { useGetLegalUnitsListQuery } from '../api/legalUnitsApi';
import { LEGAL_UNITS_DEFAULT_FILTERS, LEGAL_UNIT_RECORD_FILTER_OPTIONS, LEGAL_UNIT_FILTER_COLUMNS } from '../constants';
import { SOURCE_CODE_OPTIONS } from '@/constants';
import type { LegalUnitFilters } from '@/types';
import { cleanParams } from '@/utils/query';
import { toast } from '@/utils/toast';
import { useDebounce, usePermission } from '@/hooks';
import { Table, RotateCcw, EyeOff } from 'lucide-react';

function is400(e: unknown): boolean { return typeof e === 'object' && e !== null && 'status' in e && (e as { status: unknown }).status === 400; }
function is401(e: unknown): boolean { return typeof e === 'object' && e !== null && 'status' in e && (e as { status: unknown }).status === 401; }
function is403(e: unknown): boolean { return typeof e === 'object' && e !== null && 'status' in e && (e as { status: unknown }).status === 403; }

export function LegalUnitsListPage() {
  const searchParams = useSearchParams();
  // Deep-link support (e.g. clicking a legal unit on the Establishment detail page):
  // seed the search filter from ?search=... on first load only; normal navigation to
  // /legal-units (no query param) behaves exactly as before.
  const [filters, setFilters] = useState<LegalUnitFilters>(() => {
    const initialSearch = searchParams.get('search');
    return initialSearch ? { ...LEGAL_UNITS_DEFAULT_FILTERS, search: initialSearch } : LEGAL_UNITS_DEFAULT_FILTERS;
  });
  const [columnFilters, setColumnFilters] = useState<ColumnFilterRow[]>([]);
  const { t } = useTranslation();
  const router = useRouter();

  const debouncedSearch = useDebounce(filters.search, 400);

  const { canSearch } = usePermission('legal_units');

  const activeColumnFilters = columnFilters.filter((r) => r.column && r.value.trim());

  const queryParams = cleanParams({
    ...filters,
    search: debouncedSearch,
    source: filters.source === '__all__' ? undefined : filters.source,
    recordFilter: filters.recordFilter === '__all__' ? undefined : filters.recordFilter,
    columnFilters: activeColumnFilters.length
      ? JSON.stringify(activeColumnFilters.map((r) => ({ column: r.column, operator: r.operator, value: r.value.trim() })))
      : undefined,
  });

  const { data, isLoading, isError, error, refetch } = useGetLegalUnitsListQuery(queryParams);

  const isValidationError = isError && is400(error);
  const isPermissionError = isError && is403(error);
  const isSessionError    = isError && is401(error);

  useEffect(() => {
    if (isError && !isValidationError && !isPermissionError && !isSessionError) {
      toast.error(t('legalUnits.loadError', { defaultValue: 'Failed to load legal units. Please try again.' }));
    }
  }, [isError, isValidationError, isPermissionError, isSessionError, t]);

  const handleFilterChange = useCallback((partial: Partial<LegalUnitFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleReset = useCallback(() => {
    setFilters(LEGAL_UNITS_DEFAULT_FILTERS);
    setColumnFilters([]);
  }, []);

  const handleColumnFiltersChange = useCallback((rows: ColumnFilterRow[]) => {
    setColumnFilters(rows);
    setFilters((prev) => ({ ...prev, page: 1 }));
  }, []);

  const isDefault = JSON.stringify(filters) === JSON.stringify(LEGAL_UNITS_DEFAULT_FILTERS) && columnFilters.length === 0;

  const activeChips: FilterChip[] = [];
  if (filters.search) {
    activeChips.push({ key: 'search', label: `${t('filters.search', { defaultValue: 'Search' })}: ${filters.search}`, onRemove: () => handleFilterChange({ search: '', page: 1 }) });
  }
  if (filters.source && filters.source !== '__all__') {
    activeChips.push({ key: 'source', label: `${t('filters.source', { defaultValue: 'Source' })}: ${filters.source}`, onRemove: () => handleFilterChange({ source: '', page: 1 }) });
  }
  if (filters.recordFilter && filters.recordFilter !== '__all__') {
    const opt = LEGAL_UNIT_RECORD_FILTER_OPTIONS.find((o) => o.value === filters.recordFilter);
    activeChips.push({ key: 'recordFilter', label: opt?.label ?? filters.recordFilter, onRemove: () => handleFilterChange({ recordFilter: '', page: 1 }) });
  }

  const columns = getLegalUnitColumns((sbrId) => router.push(`/establishments/${sbrId}`), t);
  const records = (isValidationError || isPermissionError || isSessionError) ? [] : (data?.data ?? []);
  const total   = (isValidationError || isPermissionError || isSessionError) ? 0 : (data?.total ?? 0);

  return (
    <PageContainer>
      <PageHeader
        title={t('pages.legalUnits.title', { defaultValue: 'Legal Units' })}
        description={t('pages.legalUnits.description', { defaultValue: 'Regulator records that compose each establishment — read-only source ledger.' })}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <EyeOff className="h-3.5 w-3.5" />
              {t('legalUnits.readOnlyLedger', { defaultValue: 'Read-only ledger' })}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <Table className="h-4 w-4" />
              <span className="font-medium text-slate-700">{total.toLocaleString()}</span> {t('table.records', { defaultValue: 'records' })}
            </div>
          </div>
        }
      />

      {canSearch && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-white border border-slate-200 rounded-lg">
          <SearchInput
            className="shadow-none"
            value={filters.search ?? ''}
            onChange={(v) => handleFilterChange({ search: v, page: 1 })}
            placeholder={t('legalUnits.searchPlaceholder', { defaultValue: 'Search by LU ID, establishment, or source...' })}
          />

          <Select value={filters.source ?? ''} onValueChange={(v) => handleFilterChange({ source: v, page: 1 })}>
            <SelectTrigger className="w-36 shadow-none">
              <SelectValue placeholder={t('filters.source', { defaultValue: 'Source' })} />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_CODE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value || '__all__'}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.recordFilter ?? ''} onValueChange={(v) => handleFilterChange({ recordFilter: v, page: 1 })}>
            <SelectTrigger className="w-40 shadow-none">
              <SelectValue placeholder={t('legalUnits.allRecords', { defaultValue: 'All records' })} />
            </SelectTrigger>
            <SelectContent>
              {LEGAL_UNIT_RECORD_FILTER_OPTIONS.map((opt) => (
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
      )}

      {canSearch && (
        <ColumnFilters columns={LEGAL_UNIT_FILTER_COLUMNS} value={columnFilters} onChange={handleColumnFiltersChange} />
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
    </PageContainer>
  );
}
