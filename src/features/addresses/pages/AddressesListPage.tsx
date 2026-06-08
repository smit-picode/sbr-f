'use client';

import { useState, useCallback, useEffect } from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/table/DataTable';
import { SearchInput } from '@/components/common/SearchInput';
import { getAddressColumns } from '../components/AddressColumns';
import { EditAddressModal } from '../components/EditAddressModal';
import { useGetAddressesListQuery } from '../api/addressesApi';
import { ADDRESS_DEFAULT_FILTERS } from '../constants';
import type { AddressFilters, SbrAddress } from '@/types';
import { cleanParams } from '@/utils/query';
import { toast } from '@/utils/toast';
import { useDebounce } from '@/hooks';
import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function AddressesListPage() {
  const [filters, setFilters] = useState<AddressFilters>(ADDRESS_DEFAULT_FILTERS);
  const [editTarget, setEditTarget] = useState<SbrAddress | null>(null);
  const { t } = useTranslation();

  // Debounce search field
  const debouncedSearch = useDebounce(filters.search, 500);

  const queryParams = cleanParams({
    ...filters,
    search: debouncedSearch,
  });

  const { data, isLoading, isError, refetch } = useGetAddressesListQuery(queryParams);

  useEffect(() => {
    if (isError) toast.error('Failed to load addresses. Please try again.');
  }, [isError]);

  const handleFilterChange = useCallback((partial: Partial<AddressFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const columns = getAddressColumns((row) => setEditTarget(row), t);
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

      <div className="flex flex-wrap items-center gap-3 p-4 bg-white border border-slate-200 rounded-lg">
        <SearchInput
          value={filters.search ?? ''}
          onChange={(v) => handleFilterChange({ search: v, page: 1 })}
          placeholder={t('filters.searchByAddress')}
        />
      </div>

      <DataTable
        columns={columns}
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

      <EditAddressModal
        address={editTarget}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
      />
    </PageContainer>
  );
}
