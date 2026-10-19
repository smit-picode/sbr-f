'use client';

import { useTranslation } from 'react-i18next';
import { CheckCircle2, FileSpreadsheet, Gauge, Hourglass, PenLine, XCircle } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { RoleHomeSkeleton } from '@/components/common/RoleHomeSkeleton';
import { useAppSelector, usePermission } from '@/hooks';
import { useHasPermission } from '@/hooks/usePermission';
import { useRouter } from '@/hooks/useAppRouter';
import { formatDate, formatNumber } from '@/utils/format';
import { useGetDataQualitySummaryQuery } from '@/features/quality/api/dataQualityApi';
import { ScoreBar, formatPct } from '@/features/quality/components/QualityScore';
import { DQ_DIMENSIONS, DQ_OVERALL_DIMENSION } from '@/features/quality/constants';
import { tierFor } from '@/features/quality/utils/scores';
import { BulkChangeStatusBadge } from '@/features/bulkChange/components/BulkChangeStatusBadge';
import { TABLE_BY_ENTITY_TYPE } from '@/features/bulkChange/constants';
import type { BulkChangeEntityType, BulkChangeStatus } from '@/features/bulkChange/types';
import { useGetStewardSummaryQuery } from '../api/homeApi';
import { ExecStatCard } from '../components/ExecStatCard';
import { HomeCard, HomeCardHead, HomeCardLink, HomeListRow, RequestStatusChip, TableChip } from '../components/RoleHomeParts';
import { firstNameOf } from '../utils/greeting';

// For register editors: their change requests, decisions, and the register's data quality.
export function StewardHomePage({ switcher }: { switcher?: React.ReactNode }) {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);
  const { canView: canViewApprovals, canApprove } = usePermission('approvals');
  const canOpenRequests = canViewApprovals || canApprove;
  const canOpenBulk = useHasPermission('bulk_change.view');
  const canViewQuality = useHasPermission('data_quality.view');

  const { data, isLoading, isError, refetch } = useGetStewardSummaryQuery();
  const dq = useGetDataQualitySummaryQuery(undefined, { skip: !canViewQuality });
  const summary = data?.data;

  const firstName = firstNameOf(user?.email, t('home.steward.badge', { defaultValue: 'Data steward' }));
  const header = (
    <PageHeader
      title={t('home.exec.greeting', { defaultValue: 'Welcome' }) + ', ' + firstName}
      description={t('home.steward.subtitle', { defaultValue: 'Your changes to the register, what was decided on them, and how the register scores on data quality.' })}
      chips={
        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold text-white">
          <PenLine className="h-3 w-3" />
          {t('home.steward.badge', { defaultValue: 'Data steward' })}
        </span>
      }
      actions={switcher}
    />
  );

  if (isLoading) return <PageContainer>{header}<RoleHomeSkeleton /></PageContainer>;
  if (isError || !summary) {
    return (
      <PageContainer>
        {header}
        <HomeCard><ErrorState message={t('home.role.loadError', { defaultValue: 'This dashboard could not be loaded.' })} onRetry={refetch} /></HomeCard>
      </PageContainer>
    );
  }

  const { manual, bulk } = summary.counts;
  const windowSub = t('home.steward.window', { defaultValue: 'last {{days}} days', days: summary.windowDays });
  const splitSub = (m: number, b: number) =>
    t('home.steward.split', { defaultValue: '{{manual}} by hand, {{bulk}} from bulk files, {{window}}', manual: formatNumber(m), bulk: formatNumber(b), window: windowSub });

  const overall = dq.data?.data?.dimensions.find((d) => d.QUALITY_DIMENSION === DQ_OVERALL_DIMENSION);
  const dimensionRows = DQ_DIMENSIONS.map((d) => ({
    name: d.name,
    pct: dq.data?.data?.dimensions.find((x) => x.QUALITY_DIMENSION === d.name)?.WEIGHTED_PCT ?? null,
  }));
  const lastScored = dq.data?.data?.lastRun?.FINISHED_AT;

  return (
    <PageContainer>
      {header}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ExecStatCard
          icon={Hourglass}
          value={formatNumber(manual.pending + bulk.pending)}
          label={t('home.steward.awaiting', { defaultValue: 'Awaiting a decision' })}
          sub={splitSub(manual.pending, bulk.pending)}
        />
        <ExecStatCard
          icon={CheckCircle2}
          value={formatNumber(manual.approved + bulk.approved)}
          label={t('home.steward.approved', { defaultValue: 'Approved' })}
          sub={splitSub(manual.approved, bulk.approved)}
        />
        <ExecStatCard
          icon={XCircle}
          value={formatNumber(manual.rejected + bulk.rejected)}
          label={t('home.steward.rejected', { defaultValue: 'Rejected' })}
          sub={splitSub(manual.rejected, bulk.rejected)}
        />
        {canViewQuality ? (
          <ExecStatCard
            icon={Gauge}
            value={dq.isLoading ? '—' : formatPct(overall?.WEIGHTED_PCT)}
            label={t('home.steward.quality', { defaultValue: 'Register data quality' })}
            sub={lastScored
              ? t('home.steward.lastScored', { defaultValue: 'scored {{date}}', date: formatDate(lastScored) })
              : t('home.steward.notScored', { defaultValue: 'not scored yet' })}
            href="/quality/dashboard"
          />
        ) : (
          <ExecStatCard
            icon={FileSpreadsheet}
            value={formatNumber(summary.batches.length)}
            label={t('home.steward.bulkFiles', { defaultValue: 'Recent bulk files' })}
            sub={t('home.steward.bulkFilesSub', { defaultValue: 'your latest uploads, listed below' })}
          />
        )}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <HomeCard className={canViewQuality ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <HomeCardHead
            title={t('home.steward.recentTitle', { defaultValue: 'My recent changes' })}
            sub={t('home.steward.recentSub', { defaultValue: 'Changes you made by hand on a record, newest first, with the reviewer’s decision.' })}
          />
          {summary.recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">{t('home.steward.recentEmpty', { defaultValue: 'You have not changed any records yet.' })}</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {summary.recent.map((r) => (
                <HomeListRow key={r.id} onClick={canOpenRequests ? () => router.push(`/tasks/attribute-change-requests/${r.id}`) : undefined}>
                  <TableChip tableName={r.tableName} />
                  <span className="font-mono text-xs text-slate-500">{r.recordId == null ? t('home.role.newRecord', { defaultValue: 'new' }) : `#${r.recordId}`}</span>
                  <span className="min-w-0 flex-1 truncate text-slate-600">
                    {r.status === 'PENDING'
                      ? t('home.steward.sentOn', { defaultValue: 'sent {{date}}', date: formatDate(r.createdAt) })
                      : t('home.steward.decidedBy', { defaultValue: 'by {{who}}, {{date}}', who: r.decidedBy ?? '—', date: formatDate(r.decidedAt) })}
                    {r.reason && <span className="text-slate-400"> · “{r.reason}”</span>}
                  </span>
                  <RequestStatusChip status={r.status} />
                </HomeListRow>
              ))}
            </div>
          )}
        </HomeCard>

        {canViewQuality && (
          <HomeCard>
            <HomeCardHead
              title={t('home.steward.dimensionsTitle', { defaultValue: 'Data quality by dimension' })}
              sub={t('home.steward.dimensionsSub', { defaultValue: 'Share of checks passed in the latest scoring.' })}
              action={<HomeCardLink label={t('home.role.open', { defaultValue: 'Open' })} onClick={() => router.push('/quality/dashboard')} />}
            />
            {dq.isError || (!dq.isLoading && !overall) ? (
              <p className="py-8 text-center text-sm text-slate-400">{t('home.steward.notScoredLong', { defaultValue: 'The register has not been scored yet.' })}</p>
            ) : (
              <div className="space-y-3">
                {dimensionRows.map((d) => (
                  <div key={d.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-600">{t(`dq.dimension.${d.name}`, { defaultValue: d.name })}</span>
                      <span className="tabular-nums text-slate-500">{formatPct(d.pct)}</span>
                    </div>
                    <ScoreBar pct={d.pct} tier={tierFor(d.pct)} />
                  </div>
                ))}
              </div>
            )}
          </HomeCard>
        )}
      </div>

      <HomeCard>
        <HomeCardHead
          title={t('home.steward.batchesTitle', { defaultValue: 'My bulk files' })}
          sub={t('home.steward.batchesSub', { defaultValue: 'Your latest bulk change uploads and how their changes were decided.' })}
        />
        {summary.batches.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">{t('home.steward.batchesEmpty', { defaultValue: 'You have not uploaded a bulk change file yet.' })}</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {summary.batches.map((b) => (
              <HomeListRow key={b.id} onClick={canOpenBulk ? () => router.push(`/tasks/bulk-change/${b.id}`) : undefined}>
                <span className="font-mono text-xs font-medium text-slate-600">{b.code ?? `#${b.id}`}</span>
                <span className="min-w-0 flex-1 truncate text-slate-600">
                  {TABLE_BY_ENTITY_TYPE[b.entityType as BulkChangeEntityType] ?? b.entityType}
                  {b.fileName && <span className="text-slate-400"> · {b.fileName}</span>}
                </span>
                <span className="hidden whitespace-nowrap text-xs tabular-nums text-slate-500 sm:inline">
                  {t('home.steward.batchCounts', {
                    defaultValue: '{{approved}} approved, {{rejected}} rejected, {{pending}} waiting',
                    approved: formatNumber(b.approved), rejected: formatNumber(b.rejected), pending: formatNumber(b.pending),
                  })}
                </span>
                <span className="hidden whitespace-nowrap text-xs text-slate-400 md:inline">{formatDate(b.submittedAt)}</span>
                <BulkChangeStatusBadge status={b.status as BulkChangeStatus} />
              </HomeListRow>
            ))}
          </div>
        )}
      </HomeCard>
    </PageContainer>
  );
}
