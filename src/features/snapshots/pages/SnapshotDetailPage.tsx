'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Snowflake, Building2, Orbit, Users, MapPin, Calendar, User } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DataTable } from '@/components/table/DataTable';
import { NoData } from '@/components/common/NoData';
import { useAppSelector } from '@/hooks';
import { formatDateTime } from '@/utils/format';
import {
  getSnapshotEstablishmentColumns, getSnapshotEnterpriseColumns,
  getSnapshotContactColumns, getSnapshotAddressColumns,
} from '../components/SnapshotColumns';

const PAGE_SIZE = 20;

// Underline-tab look (plain text + a bottom border on the active tab), matching the reference
// design rather than the shadcn default's gray pill/segmented-control styling.
const TAB_TRIGGER_CLASS =
  'group gap-1.5 rounded-none border-b-2 border-transparent bg-transparent px-1 pb-2.5 pt-0 text-sm font-medium text-slate-500 shadow-none ' +
  'data-[state=active]:border-[#A71D3A] data-[state=active]:bg-transparent data-[state=active]:text-[#A71D3A] data-[state=active]:font-semibold data-[state=active]:shadow-none';

// Count next to each tab's label — a plain muted number while inactive, a light pink pill
// (matching the reference) once its tab is selected. Uses Radix's data-state on the parent
// TabsTrigger via the `group` class above, so no extra "which tab is active" state is needed.
const TAB_COUNT_CLASS =
  'rounded-full px-1.5 text-xs font-normal text-slate-400 ' +
  'group-data-[state=active]:bg-red-50 group-data-[state=active]:text-[#A71D3A] group-data-[state=active]:font-semibold';

function usePagedSlice<T>(rows: T[]) {
  const [page, setPage] = useState(1);
  const data = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return { page, setPage, data, total: rows.length };
}

export function SnapshotDetailPage({ id }: { id: number }) {
  const { t } = useTranslation();
  const router = useRouter();
  const snapshot = useAppSelector((s) => s.snapshots.items.find((sn) => sn.ID === id));

  const establishmentColumns = useMemo(() => getSnapshotEstablishmentColumns(t), [t]);
  const enterpriseColumns = useMemo(() => getSnapshotEnterpriseColumns(t), [t]);
  const contactColumns = useMemo(() => getSnapshotContactColumns(t), [t]);
  const addressColumns = useMemo(() => getSnapshotAddressColumns(t), [t]);

  const establishments = usePagedSlice(snapshot?.establishments ?? []);
  const enterprises = usePagedSlice(snapshot?.enterprises ?? []);
  const contacts = usePagedSlice(snapshot?.contacts ?? []);
  const addresses = usePagedSlice(snapshot?.addresses ?? []);

  if (!snapshot) {
    return (
      <PageContainer>
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
          <NoData message={t('snapshots.noData')} description={t('snapshots.noDataDesc')} />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <button
        type="button"
        onClick={() => router.push('/snapshots/browse')}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-[#A71D3A] w-fit"
      >
        <ChevronLeft className="h-4 w-4" />
        {t('snapshots.backToAll')}
      </button>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-600 shrink-0">
              <Snowflake className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">{snapshot.NAME}</h1>
              {snapshot.DESCRIPTION && <p className="text-sm text-slate-500 mt-0.5">{snapshot.DESCRIPTION}</p>}
              <p className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 mt-1.5">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {t('snapshots.frozenOnAt', { date: formatDateTime(snapshot.FROZEN_AT) })}
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {t('snapshots.frozenByUser')} <span className="text-red-500">{snapshot.FROZEN_BY}</span>
                </span>
              </p>
            </div>
          </div>
          <Badge variant="warning" className="rounded-md whitespace-nowrap">
            {t('snapshots.readOnlyBadge')}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="establishments">
        {/* Underline tabs (not the shadcn pill default) to match the reference design — overridden
            per-instance via className, since Tabs has no other caller in the app to break. */}
        <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b border-slate-200 bg-transparent p-0">
          <TabsTrigger value="establishments" className={TAB_TRIGGER_CLASS}>
            <Building2 className="h-3.5 w-3.5" />
            {t('nav.establishments', { defaultValue: 'Establishments' })}
            <span className={TAB_COUNT_CLASS}>{establishments.total}</span>
          </TabsTrigger>
          <TabsTrigger value="enterprises" className={TAB_TRIGGER_CLASS}>
            <Orbit className="h-3.5 w-3.5" />
            {t('nav.enterprises', { defaultValue: 'Enterprises' })}
            <span className={TAB_COUNT_CLASS}>{enterprises.total}</span>
          </TabsTrigger>
          <TabsTrigger value="contacts" className={TAB_TRIGGER_CLASS}>
            <Users className="h-3.5 w-3.5" />
            {t('nav.contacts', { defaultValue: 'Contacts' })}
            <span className={TAB_COUNT_CLASS}>{contacts.total}</span>
          </TabsTrigger>
          <TabsTrigger value="addresses" className={TAB_TRIGGER_CLASS}>
            <MapPin className="h-3.5 w-3.5" />
            {t('nav.addresses', { defaultValue: 'Addresses' })}
            <span className={TAB_COUNT_CLASS}>{addresses.total}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="establishments">
          <DataTable
            columns={establishmentColumns}
            data={establishments.data}
            page={establishments.page}
            limit={PAGE_SIZE}
            total={establishments.total}
            onPageChange={establishments.setPage}
            onLimitChange={() => { /* fixed page size for this read-only view */ }}
            stickyFirstColumn
          />
        </TabsContent>
        <TabsContent value="enterprises">
          <DataTable
            columns={enterpriseColumns}
            data={enterprises.data}
            page={enterprises.page}
            limit={PAGE_SIZE}
            total={enterprises.total}
            onPageChange={enterprises.setPage}
            onLimitChange={() => { /* fixed page size for this read-only view */ }}
            stickyFirstColumn
          />
        </TabsContent>
        <TabsContent value="contacts">
          <DataTable
            columns={contactColumns}
            data={contacts.data}
            page={contacts.page}
            limit={PAGE_SIZE}
            total={contacts.total}
            onPageChange={contacts.setPage}
            onLimitChange={() => { /* fixed page size for this read-only view */ }}
            stickyFirstColumn
          />
        </TabsContent>
        <TabsContent value="addresses">
          <DataTable
            columns={addressColumns}
            data={addresses.data}
            page={addresses.page}
            limit={PAGE_SIZE}
            total={addresses.total}
            onPageChange={addresses.setPage}
            onLimitChange={() => { /* fixed page size for this read-only view */ }}
            stickyFirstColumn
          />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
