'use client';

import { useMemo } from 'react';
import { useRouter } from '@/hooks/useAppRouter';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Landmark, Table2 } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { NoData } from '@/components/common/NoData';
import { SourceCatalogSkeleton } from '@/components/common/SourceCatalogSkeleton';
import { useGetSourceCatalogQuery } from '../api/sourceCatalogApi';
import { groupSourceCatalog } from '../utils/groupSourceCatalog';
import { SOURCE_REGULATOR_COLOR, SOURCE_REGULATOR_FALLBACK_COLOR } from '../constants';

export function SourceCatalogPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useGetSourceCatalogQuery();
  const regulators = useMemo(() => groupSourceCatalog(data?.data ?? []), [data]);

  return (
    <PageContainer>
      <PageHeader
        title={t('sourceCatalog.title', { defaultValue: 'Source Data Explorer' })}
        description={t('sourceCatalog.description', { defaultValue: 'Browse the raw data feeds from each regulator — read-only.' })}
      />

      {isLoading ? (
        <SourceCatalogSkeleton />
      ) : isError ? (
        <div className="rounded-xl bg-white shadow-card">
          <ErrorState message={t('sourceCatalog.loadError', { defaultValue: 'Failed to load the source catalog. Please try again.' })} onRetry={refetch} />
        </div>
      ) : regulators.length === 0 ? (
        <div className="rounded-xl bg-white shadow-card">
          <NoData message={t('sourceCatalog.empty', { defaultValue: 'No source tables are registered yet.' })} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {regulators.map((reg) => {
            const color = SOURCE_REGULATOR_COLOR[reg.code] ?? SOURCE_REGULATOR_FALLBACK_COLOR;
            return (
              <button
                key={reg.code}
                type="button"
                onClick={() => router.push(`/sources/${encodeURIComponent(reg.code)}`)}
                className="group rounded-xl bg-white p-5 text-start shadow-card transition-all hover:shadow-md"
                style={{ borderTop: `3px solid ${color}` }}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: color }}>
                    <Landmark className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-extrabold text-slate-900">{reg.code}</div>
                    <div className="truncate text-[11.5px] text-slate-500">{reg.name ?? '—'}</div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-[12px] text-slate-500">
                  <Table2 className="h-3.5 w-3.5 text-slate-400" />
                  <b className="text-slate-700">{reg.tables.length}</b> {t('sourceCatalog.tables', { defaultValue: 'tables' })}
                </div>
                <div className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold transition-all group-hover:gap-2" style={{ color }}>
                  {t('sourceCatalog.browseTables', { defaultValue: 'Browse tables' })}
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
