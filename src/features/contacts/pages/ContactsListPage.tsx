'use client';

import { useState, useCallback, useEffect } from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/table/DataTable';
import { SearchInput } from '@/components/common/SearchInput';
import { getContactColumns } from '../components/ContactColumns';
import { EditContactModal } from '../components/EditContactModal';
import { useGetContactsListQuery } from '../api/contactsApi';
import { CONTACT_DEFAULT_FILTERS } from '../constants';
import type { ContactFilters, SbrContact } from '@/types';
import { cleanParams } from '@/utils/query';
import { toast } from '@/utils/toast';
import { useDebounce } from '@/hooks';
import { Users } from 'lucide-react';

function is400(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && (error as { status: unknown }).status === 400;
}

export function ContactsListPage() {
  const [filters, setFilters] = useState<ContactFilters>(CONTACT_DEFAULT_FILTERS);
  const [editTarget, setEditTarget] = useState<SbrContact | null>(null);

  // Debounce search field
  const debouncedSearch = useDebounce(filters.search, 500);

  const queryParams = cleanParams({
    ...filters,
    search: debouncedSearch,
  });

  const { data, isLoading, isError, error, refetch } = useGetContactsListQuery(queryParams);

  const isValidationError = isError && is400(error);

  useEffect(() => {
    if (isError && !is400(error)) toast.error('Failed to load contacts. Please try again.');
  }, [isError, error]);

  const handleFilterChange = useCallback((partial: Partial<ContactFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const columns = getContactColumns((row) => setEditTarget(row));
  const records = isValidationError ? [] : (data?.data ?? []);
  const total = isValidationError ? 0 : (data?.total ?? 0);

  return (
    <PageContainer>
      <PageHeader
        title="Contacts"
        description="Business contacts associated with registered establishments"
        actions={
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Users className="h-4 w-4" />
            <span className="font-medium text-slate-700">{total.toLocaleString()}</span> records
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3 p-4 bg-white border border-slate-200 rounded-lg">
        <SearchInput
          value={filters.search ?? ''}
          onChange={(v) => handleFilterChange({ search: v, page: 1 })}
          placeholder="Search by name, email, or phone..."
        />
      </div>

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

      <EditContactModal
        contact={editTarget}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
      />
    </PageContainer>
  );
}
