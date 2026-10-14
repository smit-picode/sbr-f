'use client';

import { useMemo } from 'react';
import { useRouter } from '@/hooks/useAppRouter';
import { useHasPermission } from '@/hooks/usePermission';
import { toast } from '@/utils/toast';
import { useTranslation } from 'react-i18next';
import { Eye, Lock, Table2 } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { NoData } from '@/components/common/NoData';
import { SourceRegulatorTablesSkeleton } from '@/components/common/SourceRegulatorTablesSkeleton';
import { useGetSourceCatalogCountsQuery, useGetSourceCatalogQuery } from '../api/sourceCatalogApi';
import { formatDateTime, formatNumber } from '@/utils/format';
import { groupSourceCatalog } from '../utils/groupSourceCatalog';
import { SOURCE_REGULATOR_COLOR, SOURCE_REGULATOR_FALLBACK_COLOR, isBrowsableSourceTable } from '../constants';

export function SourceRegulatorTablesPage({ code }: { code: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useGetSourceCatalogQuery();
  const canViewData = useHasPermission('source_catalog.view_data');
  const regulator = useMemo(() => groupSourceCatalog(data?.data ?? []).find((r) => r.code === code) ?? null, [data, code]);
  const counts = useGetSourceCatalogCountsQuery();
  const countOf = (table: string) => counts.data?.data?.tables.find((c) => c.table === table);
  const color = SOURCE_REGULATOR_COLOR[code] ?? SOURCE_REGULATOR_FALLBACK_COLOR;

  const back = { label: t('sourceCatalog.backToCatalog', { defaultValue: 'All regulators' }), onClick: () => router.push('/sources') };

  return (
    <PageContainer>
      <PageHeader
        title={code}
        description={regulator?.name ?? undefined}
        back={back}
        chips={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-bold text-white">
            <Eye className="h-3 w-3" />
            {t('sourceCatalog.readOnly', { defaultValue: 'Read-only source' })}
          </span>
        }
      />

      {isLoading ? (
        <SourceRegulatorTablesSkeleton />
      ) : isError ? (
        <div className="rounded-xl bg-white shadow-card">
          <ErrorState message={t('sourceCatalog.loadError', { defaultValue: 'Failed to load the source catalog. Please try again.' })} onRetry={refetch} />
        </div>
      ) : !regulator ? (
        <div className="rounded-xl bg-white shadow-card">
          <NoData message={t('sourceCatalog.notFound', { defaultValue: 'This regulator is not in the source catalog.' })} />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="px-1 text-[12px] font-bold text-slate-400">
            {t('sourceCatalog.tablesIn', { defaultValue: 'Source tables' })} ({regulator.tables.length})
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {regulator.tables.map((table) => {
              const browsable = isBrowsableSourceTable(table.name);
              return (
              <button
                key={table.name}
                type="button"
                disabled={!browsable}
                title={browsable ? undefined : t('sourceCatalog.stagingTip', { defaultValue: 'A pipeline working copy of regulator data. Only the regulator source tables open here, because only they carry the column masking.' })}
                onClick={() => (canViewData
                  ? router.push(`/sources/${encodeURIComponent(code)}/${encodeURIComponent(table.name)}`)
                  : toast.warning(t('sourceCatalog.noDataPermission', { defaultValue: 'You do not have permission to view the data in source tables.' })))}
                className={`flex items-start gap-3 rounded-xl bg-white p-4 text-start shadow-card transition-shadow ${browsable ? 'hover:shadow-float' : 'cursor-default'}`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50" style={{ color }}>
                  <Table2 className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="truncate font-mono text-[13px] font-bold text-slate-800" title={table.name}>{table.name}</div>
                    {!browsable && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-500">
                        <Lock className="h-3 w-3" />
                        {t('sourceCatalog.stagingChip', { defaultValue: 'Staging copy · not browsable' })}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-slate-500">{table.description ?? '—'}</div>
                  {counts.data && (
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-slate-500">
                    {countOf(table.name)?.recordCount != null ? (
                      <>
                        <span><b className="text-slate-700">{formatNumber(countOf(table.name)?.recordCount)}</b> {t('sourceCatalog.records', { defaultValue: 'records' })}</span>
                        {countOf(table.name)?.columnCount != null && (
                          <span><b className="text-slate-700">{countOf(table.name)?.columnCount}</b> {t('sourceCatalog.columns', { defaultValue: 'columns' })}</span>
                        )}
                        <span className="text-slate-400" title={t('sourceCatalog.countedAtTip', { defaultValue: 'When the records were last counted' })}>
                          {t('sourceCatalog.countedAt', { defaultValue: 'counted {{date}}', date: formatDateTime(countOf(table.name)?.refreshedAt) })}
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-400">{t('sourceCatalog.notCounted', { defaultValue: 'not counted yet' })}</span>
                    )}
                  </div>
                  )}
                </div>
              </button>
              );
            })}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
