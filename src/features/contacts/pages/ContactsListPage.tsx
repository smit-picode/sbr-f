'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/table/DataTable';
import { SearchInput } from '@/components/common/SearchInput';
import { FilterChips, type FilterChip } from '@/components/common/FilterChips';
import { getContactColumns } from '../components/ContactColumns';
import { EditContactModal } from '../components/EditContactModal';
import { useGetContactsListQuery } from '../api/contactsApi';
import { CONTACT_DEFAULT_FILTERS } from '../constants';
import type { ContactFilters, SbrContact } from '@/types';
import { cleanParams } from '@/utils/query';
import { toast } from '@/utils/toast';
import { useDebounce, usePermission } from '@/hooks';
import { Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function is400(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && (error as { status: unknown }).status === 400;
}
function is403(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && (error as { status: unknown }).status === 403;
}
function is401(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && (error as { status: unknown }).status === 401;
}

export function ContactsListPage() {
  const [filters, setFilters] = useState<ContactFilters>(CONTACT_DEFAULT_FILTERS);
  const [editTarget, setEditTarget] = useState<SbrContact | null>(null);
  const { t } = useTranslation();
  const router = useRouter();

  // Debounce search field
  const debouncedSearch = useDebounce(filters.search, 500);

  const queryParams = cleanParams({
    ...filters,
    search: debouncedSearch,
  });

  const { data, isLoading, isError, error, refetch } = useGetContactsListQuery(queryParams);

  const isValidationError = isError && is400(error);

  useEffect(() => {
    // Skip 403 — global handler in services/api.ts already shows the permission toast
    // Skip 401/403 — global handler in services/api.ts already shows the appropriate toast
    if (isError && !is400(error) && !is401(error) && !is403(error)) toast.error(t('pages.contacts.loadError', { defaultValue: 'Failed to load contacts. Please try again.' }));
  }, [isError, error, t]);

  const handleFilterChange = useCallback((partial: Partial<ContactFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const { canEdit: canEditContact, canSearch, canViewDetail } = usePermission('contacts');
  // A row opens the detail screen for users who can view the detail or edit (mirrors backend guard)
  const canOpenDetail = canViewDetail || canEditContact;
  const columns = getContactColumns((row) => setEditTarget(row), t, canEditContact);
  const records = isValidationError ? [] : (data?.data ?? []);
  const total = isValidationError ? 0 : (data?.total ?? 0);

  return (
    <PageContainer>
      <PageHeader
        title={t('pages.contacts.title')}
        description={t('pages.contacts.description')}
        actions={
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Users className="h-4 w-4" />
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
            placeholder={t('filters.searchByContact')}
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
        isError={isError && !isValidationError}
        onRetry={refetch}
        page={filters.page ?? 1}
        limit={filters.limit ?? 10}
        total={total}
        onPageChange={(p) => handleFilterChange({ page: p })}
        onLimitChange={(l) => handleFilterChange({ limit: l, page: 1 })}
        stickyFirstColumn
        onRowClick={canOpenDetail ? (row) => router.push(`/contacts/${row.ID}`) : undefined}
      />

      <EditContactModal
        contact={editTarget}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
      />
    </PageContainer>
  );
}
