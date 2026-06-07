'use client';

import { useState, useCallback, useEffect } from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/table/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { auditLogColumns } from '../components/AuditLogColumns';
import { useGetAuditLogListQuery } from '../api/auditLogApi';
import type { AuditLogFilters } from '@/types';
import { cleanParams } from '@/utils/query';
import { toast } from '@/utils/toast';
import { ClipboardList, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const DEFAULT_FILTERS: AuditLogFilters = { page: 1, limit: 20 };

const TABLE_OPTIONS = [
  { label: 'All Tables', value: '__all__' },
  { label: 'SBR_FRAME', value: 'SBR_FRAME' },
  { label: 'SBR_CONTACTS', value: 'SBR_CONTACTS' },
  { label: 'SBR_ADDRESSES', value: 'SBR_ADDRESSES' },
];

export function AuditLogPage() {
  const [filters, setFilters] = useState<AuditLogFilters>(DEFAULT_FILTERS);
  const { t } = useTranslation();

  const { data, isLoading, isError, refetch } = useGetAuditLogListQuery(cleanParams(filters), {
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (isError) toast.error('Failed to load audit log. Please try again.');
  }, [isError]);

  const handleFilterChange = useCallback((partial: Partial<AuditLogFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const records = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <PageContainer>
      <PageHeader
        title={t('pages.auditLog.title')}
        description={t('pages.auditLog.description')}
        actions={
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <ClipboardList className="h-4 w-4" />
            <span className="font-medium text-slate-700">{total.toLocaleString()}</span> records
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3 p-4 bg-white border border-slate-200 rounded-lg">
        <Select
          value={filters.tableName ?? '__all__'}
          onValueChange={(v) => handleFilterChange({ tableName: v === '__all__' ? undefined : v, page: 1 })}
        >
          <SelectTrigger className="w-40">
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
          placeholder="Filter by Record ID..."
          className="w-48"
          value={filters.recordId ?? ''}
          onChange={(e) =>
            handleFilterChange({ recordId: e.target.value ? Number(e.target.value) : undefined, page: 1 })
          }
        />

        {(() => {
          const isDefault = JSON.stringify(filters) === JSON.stringify(DEFAULT_FILTERS);
          return (
            <div className={isDefault ? 'cursor-not-allowed' : undefined}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(DEFAULT_FILTERS)}
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
        columns={auditLogColumns}
        data={records}
        isLoading={isLoading}
        isError={isError}
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
