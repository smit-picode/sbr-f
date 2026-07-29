'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/table/DataTable';
import { SearchInput } from '@/components/common/SearchInput';
import { FilterChips, type FilterChip } from '@/components/common/FilterChips';
import { getAddressColumns } from '../components/AddressColumns';
import { EditAddressModal } from '../components/EditAddressModal';
import { useGetAddressesListQuery } from '../api/addressesApi';
import { ADDRESS_DEFAULT_FILTERS } from '../constants';
import type { AddressFilters, SbrAddress } from '@/types';
import { cleanParams } from '@/utils/query';
import { toast } from '@/utils/toast';
import { useDebounce, usePermission } from '@/hooks';
import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function AddressesListPage() {
  const [filters, setFilters] = useState<AddressFilters>(ADDRESS_DEFAULT_FILTERS);
  const [editTarget, setEditTarget] = useState<SbrAddress | null>(null);
  const { t } = useTranslation();
  const router = useRouter();

  // Debounce search field
  const debouncedSearch = useDebounce(filters.search, 500);

  const queryParams = cleanParams({
    ...filters,
    search: debouncedSearch,
  });

  const { data, isLoading, isError, error, refetch } = useGetAddressesListQuery(queryParams);

  useEffect(() => {
    const is401 = typeof error === 'object' && error !== null && 'status' in error && (error as { status: unknown }).status === 401;
    const is403 = typeof error === 'object' && error !== null && 'status' in error && (error as { status: unknown }).status === 403;
    // Skip 401/403 — global handler in services/api.ts already shows the appropriate toast
    if (isError && !is401 && !is403) toast.error(t('pages.addresses.loadError', { defaultValue: 'Failed to load addresses. Please try again.' }));
  }, [isError, error, t]);

  const handleFilterChange = useCallback((partial: Partial<AddressFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const { canEdit: canEditAddress, canSearch, canViewDetail } = usePermission('addresses');
  // A row opens the detail screen for users who can view the detail or edit (mirrors backend guard)
  const canOpenDetail = canViewDetail || canEditAddress;
  const columns = getAddressColumns((row) => setEditTarget(row), t, canEditAddress);
  const records = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <PageContainer>
      <PageHeader
        title={t('pages.addresses.title')}
        description={t('pages.addresses.description')}
        actions={
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin className="h-4 w-4" />
            <span className="font-medium text-slate-700">{total.toLocaleString()}</span> {t('table.records')}
          </div>
        }
      />

      {canSearch && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-white border border-slate-200 rounded-lg">
          <SearchInput
            className="shadow-none"
            value={filters.search ?? ''}
            onChange={(v) => handleFilterChange({ search: v, page: 1 })}
            placeholder={t('filters.searchByAddress')}
          />
        </div>
      )}

      {canSearch && (
        <FilterChips
          chips={filters.search ? [{
            key: 'search',
            label: `${t('filters.search', { defaultValue: 'Search' })}: ${filters.search}`,
            onRemove: () => handleFilterChange({ search: '', page: 1 }),
          } as FilterChip] : []}
          onClearAll={() => handleFilterChange({ search: '', page: 1 })}
        />
      )}

      <DataTable
        columns={columns}
        data={records}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        page={filters.page ?? 1}
        limit={filters.limit ?? 10}
        total={total}
        onPageChange={(p) => handleFilterChange({ page: p })}
        onLimitChange={(l) => handleFilterChange({ limit: l, page: 1 })}
        onSortChange={(field, order) => handleFilterChange({ sortBy: field, sortOrder: order, page: 1 })}
        stickyFirstColumn
        onRowClick={canOpenDetail ? (row) => router.push(`/addresses/${row.ID}`) : undefined}
      />

      <EditAddressModal
        address={editTarget}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
      />
    </PageContainer>
  );
}
