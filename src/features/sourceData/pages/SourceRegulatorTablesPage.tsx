'use client';

import { useMemo } from 'react';
import { useRouter } from '@/hooks/useAppRouter';
import { useTranslation } from 'react-i18next';
import { Eye, Table2 } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { NoData } from '@/components/common/NoData';
import { SourceRegulatorTablesSkeleton } from '@/components/common/SourceRegulatorTablesSkeleton';
import { useGetSourceCatalogQuery } from '../api/sourceCatalogApi';
import { groupSourceCatalog } from '../utils/groupSourceCatalog';
import { SOURCE_REGULATOR_COLOR, SOURCE_REGULATOR_FALLBACK_COLOR } from '../constants';

export function SourceRegulatorTablesPage({ code }: { code: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useGetSourceCatalogQuery();
  const regulator = useMemo(() => groupSourceCatalog(data?.data ?? []).find((r) => r.code === code) ?? null, [data, code]);
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
            {regulator.tables.map((table) => (
              <div key={table.name} className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-card">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50" style={{ color }}>
                  <Table2 className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mono text-[13px] font-bold text-slate-800" title={table.name}>{table.name}</div>
                  <div className="mt-0.5 text-[11.5px] text-slate-500">{table.description ?? '—'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
