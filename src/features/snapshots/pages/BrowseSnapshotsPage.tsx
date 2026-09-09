'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Database, Layers } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/table/DataTable';
import { useAppSelector } from '@/hooks';
import { useDebounce } from '@/hooks';
import { formatDateTime } from '@/utils/format';
import type { ColumnDef } from '@tanstack/react-table';
import type { Snapshot } from '@/types';

export function BrowseSnapshotsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const snapshots = useAppSelector((s) => s.snapshots.items);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const debouncedSearch = useDebounce(search, 400);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return snapshots;
    return snapshots.filter((s) => s.NAME.toLowerCase().includes(q) || s.FROZEN_BY.toLowerCase().includes(q));
  }, [snapshots, debouncedSearch]);

  const paged = filtered.slice((page - 1) * limit, page * limit);

  const columns: ColumnDef<Snapshot>[] = [
    {
      accessorKey: 'NAME',
      header: t('columns.NAME'),
      cell: ({ row }) => (
        <div className="min-w-[200px]">
          <p className="text-sm font-semibold text-slate-800">{row.original.NAME}</p>
          {row.original.DESCRIPTION && (
            <p className="text-xs text-slate-500 truncate max-w-[280px]">{row.original.DESCRIPTION}</p>
          )}
        </div>
      ),
    },
    {
      id: 'STATUS',
      header: t('columns.STATUS'),
      cell: () => <Badge variant="default" className="bg-blue-50 text-blue-700 rounded-md">{t('snapshots.statusFrozen')}</Badge>,
    },
    {
      accessorKey: 'FROZEN_AT',
      header: t('snapshots.frozenOn'),
      cell: ({ getValue }) => <span className="text-sm text-slate-600">{formatDateTime(getValue<string>()).split(',')[0]}</span>,
    },
    {
      id: 'ESTABLISHMENTS',
      header: t('nav.establishments', { defaultValue: 'Establishments' }),
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-600">
          <Layers className="h-3 w-3" />{row.original.establishments.length}
        </span>
      ),
    },
    {
      id: 'ENTERPRISES',
      header: t('nav.enterprises', { defaultValue: 'Enterprises' }),
      cell: ({ row }) => <span className="text-sm text-slate-700">{row.original.enterprises.length}</span>,
    },
    {
      id: 'CONTACTS',
      header: t('nav.contacts', { defaultValue: 'Contacts' }),
      cell: ({ row }) => <span className="text-sm text-slate-700">{row.original.contacts.length}</span>,
    },
    {
      id: 'ADDRESSES',
      header: t('nav.addresses', { defaultValue: 'Addresses' }),
      cell: ({ row }) => <span className="text-sm text-slate-700">{row.original.addresses.length}</span>,
    },
    {
      accessorKey: 'FROZEN_BY',
      header: t('snapshots.frozenBy'),
      cell: ({ getValue }) => <span className="text-sm text-red-600">{getValue<string>()}</span>,
    },
    {
      id: 'actions',
      header: t('columns.ACTIONS'),
      cell: ({ row }) => (
        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); router.push(`/snapshots/browse/${row.original.ID}`); }}>
          <Database className="h-3.5 w-3.5 mr-1.5" />
          {t('snapshots.browseAction')}
        </Button>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={t('snapshots.browseTitle')}
        description={t('snapshots.browseDescription')}
        actions={
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Database className="h-4 w-4" />
            <span className="font-medium text-slate-700">{filtered.length}</span>{' '}
            {filtered.length === 1 ? t('snapshots.frameLabelOne') : t('snapshots.frameLabelMany')}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3 p-4 bg-white border border-slate-200 rounded-lg">
        <SearchInput
          className="shadow-none"
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder={t('snapshots.searchPlaceholder')}
        />
      </div>

      <DataTable
        columns={columns}
        data={paged}
        page={page}
        limit={limit}
        total={filtered.length}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
        onRowClick={(row) => router.push(`/snapshots/browse/${row.ID}`)}
      />
    </PageContainer>
  );
}
