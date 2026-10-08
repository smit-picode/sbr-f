'use client';

import { useMemo, useState } from 'react';
import { useRouter } from '@/hooks/useAppRouter';
import { useTranslation } from 'react-i18next';
import { Building2, CircleDot, Orbit, Users, MapPin, Network, Calendar, User } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { PageLoader } from '@/components/common/Loader';
import { NoData } from '@/components/common/NoData';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DataTable } from '@/components/table/DataTable';
import { usePermission } from '@/hooks';
import { formatNumber } from '@/utils/format';
import type { SnapshotEntity } from '@/types';
import { useGetSnapshotsQuery, useGetSnapshotTableQuery } from '../api/snapshotsApi';
import { getSnapshotColumns } from '../components/SnapshotColumns';
import { SnapshotExportButton } from '../components/SnapshotExportButton';
import { formatFrozenAt } from '../utils/formatFrozenAt';
import { SNAPSHOT_DEFAULT_PAGE_SIZE, SNAPSHOT_ENTITIES, SNAPSHOT_LOOKUP_LIMIT } from '../constants';

const ENTITY_ICON: Record<SnapshotEntity, typeof Building2> = {
  establishments: Building2,
  enterprises: Orbit,
  enterprise_groups: Network,
  contacts: Users,
  addresses: MapPin,
};

// Pill-tab look (filled dune pill on the active tab inside a rounded strip), matching the client design.
const TAB_TRIGGER_CLASS =
  'group h-9 gap-2 rounded-full border-0 bg-transparent px-4 text-[12.5px] font-semibold text-slate-500 shadow-none hover:text-slate-700 ' +
  'data-[state=active]:bg-dune data-[state=active]:text-white data-[state=active]:shadow-soft';

const TAB_COUNT_CLASS =
  'rounded-full bg-slate-200/70 px-2 py-0.5 text-[11px] font-semibold text-slate-500 ' +
  'group-data-[state=active]:bg-white/25 group-data-[state=active]:text-white';

// One tab's table; Radix unmounts inactive tabs, so only the visible entity is ever fetched.
function SnapshotEntityTable({ id, entity }: { id: number; entity: SnapshotEntity }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(SNAPSHOT_DEFAULT_PAGE_SIZE);
  const { data, isLoading, isFetching, isError, refetch } = useGetSnapshotTableQuery({ id, entity, page, limit });
  const columns = useMemo(() => getSnapshotColumns(entity, t), [entity, t]);
  const rows = data?.data ?? [];
  return (
    <DataTable
      columns={columns}
      data={rows}
      isLoading={isLoading || (isFetching && !rows.length)}
      isError={isError}
      onRetry={refetch}
      page={page}
      limit={limit}
      total={data?.total ?? 0}
      onPageChange={setPage}
      onLimitChange={(l) => { setLimit(l); setPage(1); }}
      stickyFirstColumn
    />
  );
}

export function SnapshotDetailPage({ id }: { id: number }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { canView } = usePermission('snapshots');
  const [activeEntity, setActiveEntity] = useState<SnapshotEntity>('establishments');
  // No get-one endpoint: the header comes from the (cached) list row for this snapshot.
  const { data: listRes, isLoading } = useGetSnapshotsQuery({ page: 1, limit: SNAPSHOT_LOOKUP_LIMIT }, { skip: !canView });
  const snapshot = listRes?.data?.find((s) => s.SNAPSHOT_ID === id);
  const back = { label: t('snapshots.backToAll'), onClick: () => router.push('/snapshots/browse') };

  if (!canView) {
    return (
      <PageContainer>
        <div className="rounded-lg bg-white shadow-card overflow-hidden">
          <NoData message={t('snapshots.noViewPermission', { defaultValue: 'You do not have permission to view snapshots.' })} />
        </div>
      </PageContainer>
    );
  }
  if (isLoading) return <PageContainer><PageLoader /></PageContainer>;

  return (
    <PageContainer>
      <PageHeader
        title={snapshot?.SNAPSHOT_NAME ?? t('snapshots.fallbackTitle', { defaultValue: 'Snapshot #{{id}}', id })}
        description={snapshot && (
          <>
            {snapshot.DESCRIPTION && <span className="block">{snapshot.DESCRIPTION}</span>}
            <span className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {t('snapshots.frozenOnAt', { date: formatFrozenAt(snapshot.CREATED_AT) })}
              </span>
              {snapshot.FROZEN_BY_NAME && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {t('snapshots.frozenByUser')} {snapshot.FROZEN_BY_NAME}
                  </span>
                </>
              )}
            </span>
          </>
        )}
        back={back}
        chips={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-bold text-white">
            <CircleDot className="h-3 w-3" />
            {t('snapshots.readOnlyBadge')}
          </span>
        }
        actions={
          <SnapshotExportButton
            id={id}
            entity={activeEntity}
            snapshotName={snapshot?.SNAPSHOT_NAME ?? `snapshot_${id}`}
          />
        }
      />

      <Tabs value={activeEntity} onValueChange={(v) => setActiveEntity(v as SnapshotEntity)}>
        <TabsList className="mb-3 h-auto max-w-full justify-start gap-1 overflow-x-auto rounded-full border border-slate-200 bg-slate-50 p-1">
          {SNAPSHOT_ENTITIES.map(({ entity, countKey, i18nKey, label }) => {
            const Icon = ENTITY_ICON[entity];
            return (
              <TabsTrigger key={entity} value={entity} className={TAB_TRIGGER_CLASS}>
                <Icon className="h-3.5 w-3.5" />
                {t(i18nKey, { defaultValue: label })}
                {snapshot && <span className={TAB_COUNT_CLASS}>{formatNumber(snapshot[countKey])}</span>}
              </TabsTrigger>
            );
          })}
        </TabsList>
        {SNAPSHOT_ENTITIES.map(({ entity }) => (
          <TabsContent key={entity} value={entity}>
            <SnapshotEntityTable id={id} entity={entity} />
          </TabsContent>
        ))}
      </Tabs>
    </PageContainer>
  );
}
