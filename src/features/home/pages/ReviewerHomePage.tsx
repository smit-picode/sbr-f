'use client';

import { useTranslation } from 'react-i18next';
import { CheckCheck, FileSpreadsheet, Inbox, ShieldCheck, Timer } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { RoleHomeSkeleton } from '@/components/common/RoleHomeSkeleton';
import { useAppSelector, usePermission } from '@/hooks';
import { useHasPermission } from '@/hooks/usePermission';
import { useRouter } from '@/hooks/useAppRouter';
import { formatDate, formatNumber } from '@/utils/format';
import { prettyTableName } from '@/features/auditLog/components/AuditLogColumns';
import { TABLE_BY_ENTITY_TYPE } from '@/features/bulkChange/constants';
import type { BulkChangeEntityType } from '@/features/bulkChange/types';
import { useGetReviewerSummaryQuery } from '../api/homeApi';
import { ExecStatCard } from '../components/ExecStatCard';
import { HomeCard, HomeCardHead, HomeCardLink, HomeListRow, TableChip, WaitingFor } from '../components/RoleHomeParts';
import { HOME_REQUEST_TABLES } from '../constants';
import { firstNameOf } from '../utils/greeting';

const REQUESTS_PATH = '/tasks/attribute-change-requests';
const BULK_PATH = '/tasks/bulk-change';

// For whoever approves changes: how much is waiting, on which tables, and what has waited longest.
export function ReviewerHomePage({ switcher }: { switcher?: React.ReactNode }) {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);
  const { canView: canViewApprovals, canApprove } = usePermission('approvals');
  const canOpenRequests = canViewApprovals || canApprove;
  const canOpenBulk = useHasPermission('bulk_change.view');

  const { data, isLoading, isError, refetch } = useGetReviewerSummaryQuery();
  const summary = data?.data;

  const firstName = firstNameOf(user?.email, t('home.reviewer.badge', { defaultValue: 'Data reviewer' }));
  const header = (
    <PageHeader
      title={t('home.exec.greeting', { defaultValue: 'Welcome' }) + ', ' + firstName}
      description={t('home.reviewer.subtitle', { defaultValue: 'What is waiting for a decision, where it is, and what has waited longest.' })}
      chips={
        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold text-white">
          <ShieldCheck className="h-3 w-3" />
          {t('home.reviewer.badge', { defaultValue: 'Data reviewer' })}
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

  const manualPending = summary.queue.filter((q) => q.channel === 'manual').reduce((n, q) => n + q.pending, 0);
  const bulkPending = summary.queue.filter((q) => q.channel === 'bulk').reduce((n, q) => n + q.pending, 0);
  const oldestAt = summary.queue.map((q) => q.oldestAt).sort()[0];

  const tables = HOME_REQUEST_TABLES.map((tableName) => {
    const rows = summary.queue.filter((q) => q.tableName === tableName);
    return {
      tableName,
      manual: rows.find((q) => q.channel === 'manual')?.pending ?? 0,
      bulk: rows.find((q) => q.channel === 'bulk')?.pending ?? 0,
      oldestAt: rows.map((q) => q.oldestAt).sort()[0] ?? null,
    };
  });
  const maxPending = Math.max(1, ...tables.map((r) => r.manual + r.bulk));

  return (
    <PageContainer>
      {header}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ExecStatCard
          icon={Inbox}
          value={formatNumber(manualPending + bulkPending)}
          label={t('home.reviewer.waiting', { defaultValue: 'Changes waiting' })}
          sub={oldestAt
            ? t('home.reviewer.oldestSince', { defaultValue: 'oldest waiting since {{date}}', date: formatDate(oldestAt) })
            : t('home.reviewer.nothingWaiting', { defaultValue: 'nothing is waiting' })}
        />
        <ExecStatCard
          icon={Timer}
          value={formatNumber(manualPending)}
          label={t('home.reviewer.byHand', { defaultValue: 'Changes made by hand' })}
          sub={t('home.reviewer.byHandSub', { defaultValue: 'single-record edits waiting' })}
          href={canOpenRequests ? REQUESTS_PATH : undefined}
        />
        <ExecStatCard
          icon={FileSpreadsheet}
          value={formatNumber(summary.pendingBatches)}
          label={t('home.reviewer.bulkFiles', { defaultValue: 'Bulk files waiting' })}
          sub={t('home.reviewer.bulkFilesSub', { defaultValue: '{{count}} changes inside them', count: bulkPending })}
          href={canOpenBulk ? BULK_PATH : undefined}
        />
        <ExecStatCard
          icon={CheckCheck}
          value={formatNumber(summary.decidedLast7Days)}
          label={t('home.reviewer.decided', { defaultValue: 'Decided by you' })}
          sub={t('home.reviewer.decidedSub', { defaultValue: 'approved or rejected, last 7 days' })}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <HomeCard className="lg:col-span-2">
          <HomeCardHead
            title={t('home.reviewer.oldestTitle', { defaultValue: 'Waiting longest' })}
            sub={t('home.reviewer.oldestSub', { defaultValue: 'Changes made by hand, the longest-waiting first.' })}
            action={canOpenRequests ? <HomeCardLink label={t('home.role.viewAll', { defaultValue: 'View all' })} onClick={() => router.push(REQUESTS_PATH)} /> : undefined}
          />
          {summary.oldest.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">{t('home.reviewer.oldestEmpty', { defaultValue: 'No changes are waiting for a decision.' })}</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {summary.oldest.map((r) => (
                <HomeListRow key={r.id} onClick={canOpenRequests ? () => router.push(`${REQUESTS_PATH}/${r.id}`) : undefined}>
                  <TableChip tableName={r.tableName} />
                  <span className="font-mono text-xs text-slate-500">{r.recordId == null ? t('home.role.newRecord', { defaultValue: 'new' }) : `#${r.recordId}`}</span>
                  <span className="min-w-0 flex-1 truncate text-slate-600">
                    {t('home.reviewer.requestedBy', { defaultValue: 'by {{who}}', who: r.requestedBy ?? '—' })}
                  </span>
                  <span className="text-xs"><WaitingFor since={r.createdAt} /></span>
                </HomeListRow>
              ))}
            </div>
          )}
        </HomeCard>

        <HomeCard>
          <HomeCardHead
            title={t('home.reviewer.whereTitle', { defaultValue: 'Where they are' })}
            sub={t('home.reviewer.whereSub', { defaultValue: 'Changes waiting on each table, by hand and from bulk files.' })}
          />
          <div className="space-y-1">
            {tables.map((r) => {
              const total = r.manual + r.bulk;
              return (
                <HomeListRow
                  key={r.tableName}
                  onClick={canOpenRequests && total > 0 ? () => router.push(`${REQUESTS_PATH}?tableName=${encodeURIComponent(r.tableName)}`) : undefined}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-700">{prettyTableName(r.tableName)}</span>
                      <span className="tabular-nums text-slate-500">{formatNumber(total)}</span>
                    </div>
                    <div className="flex h-2 overflow-hidden rounded-full bg-slate-100">
                      <span className="h-full bg-adaam" style={{ width: `${(r.manual / maxPending) * 100}%` }} />
                      <span className="h-full bg-adaam/40" style={{ width: `${(r.bulk / maxPending) * 100}%` }} />
                    </div>
                    {total > 0 && (
                      <div className="text-[11px] text-slate-400">
                        {t('home.reviewer.tableSplit', { defaultValue: '{{manual}} by hand, {{bulk}} bulk', manual: formatNumber(r.manual), bulk: formatNumber(r.bulk) })}
                        {' · '}
                        <WaitingFor since={r.oldestAt} />
                      </div>
                    )}
                  </div>
                </HomeListRow>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-4 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-adaam" />{t('home.reviewer.legendManual', { defaultValue: 'by hand' })}</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-adaam/40" />{t('home.reviewer.legendBulk', { defaultValue: 'from bulk files' })}</span>
          </div>
        </HomeCard>
      </div>

      <HomeCard>
        <HomeCardHead
          title={t('home.reviewer.batchesTitle', { defaultValue: 'Bulk files waiting' })}
          sub={t('home.reviewer.batchesSub', { defaultValue: 'Uploaded change files with changes still to decide, oldest first.' })}
          action={canOpenBulk ? <HomeCardLink label={t('home.role.viewAll', { defaultValue: 'View all' })} onClick={() => router.push(BULK_PATH)} /> : undefined}
        />
        {summary.batches.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">{t('home.reviewer.batchesEmpty', { defaultValue: 'No bulk files are waiting for a decision.' })}</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {summary.batches.map((b) => (
              <HomeListRow key={b.id} onClick={canOpenBulk ? () => router.push(`${BULK_PATH}/${b.id}`) : undefined}>
                <span className="font-mono text-xs font-medium text-slate-600">{b.code ?? `#${b.id}`}</span>
                <span className="min-w-0 flex-1 truncate text-slate-600">
                  {TABLE_BY_ENTITY_TYPE[b.entityType as BulkChangeEntityType] ?? b.entityType}
                  <span className="text-slate-400"> · {t('home.reviewer.requestedBy', { defaultValue: 'by {{who}}', who: b.submittedBy ?? '—' })}</span>
                </span>
                <span className="whitespace-nowrap text-xs tabular-nums text-slate-500">
                  {t('home.reviewer.batchPending', { defaultValue: '{{pending}} of {{total}} to decide', pending: formatNumber(b.pending), total: formatNumber(b.changeCount) })}
                </span>
                <span className="text-xs"><WaitingFor since={b.submittedAt} /></span>
              </HomeListRow>
            ))}
          </div>
        )}
      </HomeCard>
    </PageContainer>
  );
}
