'use client';

import { useState, useCallback, useEffect } from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/table/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAuditLogColumns } from '../components/AuditLogColumns';
import { useGetAuditLogListQuery } from '../api/auditLogApi';
import type { AuditLogFilters } from '@/types';
import { cleanParams } from '@/utils/query';
import { toast } from '@/utils/toast';
import { ClipboardList, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '@/hooks/useDebounce';
import { usePermission } from '@/hooks';

const DEFAULT_FILTERS: AuditLogFilters = { page: 1, limit: 20 };

const TABLE_OPTIONS = [
  { label: 'All Tables', value: '__all__' },
  { label: 'SBR_LEGAL_UNITS', value: 'SBR_LEGAL_UNITS' },
  { label: 'SBR_CONTACTS', value: 'SBR_CONTACTS' },
  { label: 'SBR_ADDRESSES', value: 'SBR_ADDRESSES' },
];

function is400(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && (error as { status: unknown }).status === 400;
}

export function AuditLogPage() {
  const [filters, setFilters] = useState<AuditLogFilters>(DEFAULT_FILTERS);
  const [recordIdInput, setRecordIdInput] = useState<string>('');
  const debouncedRecordId = useDebounce(recordIdInput, 500);
  const { t } = useTranslation();

  // Sync debounced recordId into filters
  useEffect(() => {
    const val = debouncedRecordId ? Number(debouncedRecordId) : undefined;
    setFilters((prev) => ({ ...prev, recordId: val && val > 0 ? val : undefined, page: 1 }));
  }, [debouncedRecordId]);

  const { data, isLoading, isError, error, refetch } = useGetAuditLogListQuery(cleanParams(filters), {
    refetchOnMountOrArgChange: true,
  });

  const isValidationError = isError && is400(error);

  useEffect(() => {
    const is401 = typeof error === 'object' && error !== null && 'status' in error && (error as { status: unknown }).status === 401;
    const is403 = typeof error === 'object' && error !== null && 'status' in error && (error as { status: unknown }).status === 403;
    // Skip 401/403 — global handler in services/api.ts already shows the appropriate toast
    if (isError && !is400(error) && !is401 && !is403) {
      toast.error('Failed to load audit log. Please try again.');
    }
  }, [isError, error]);

  const handleFilterChange = useCallback((partial: Partial<AuditLogFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const records = isValidationError ? [] : (data?.data ?? []);
  const total = isValidationError ? 0 : (data?.total ?? 0);

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
          className="w-48 shadow-none"
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
          const isDefault = JSON.stringify(filters) === JSON.stringify(DEFAULT_FILTERS);
          return (
            <div className={isDefault ? 'cursor-not-allowed' : undefined}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setFilters(DEFAULT_FILTERS); setRecordIdInput(''); }}
                disabled={isDefault}
                className={`gap-1.5 ${isDefault ? 'pointer-events-none opacity-40' : ''}`}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            </div>
          );
        })()}
      </div>

      <DataTable
        columns={getAuditLogColumns(t)}
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
    </PageContainer>
  );
}
