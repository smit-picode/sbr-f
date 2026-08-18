'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock, User, X, XCircle } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { ErrorState } from '@/components/common/ErrorState';
import { PageLoader } from '@/components/common/Loader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n';
import { usePermission } from '@/hooks';
import { formatDate } from '@/utils/format';
import { toast } from '@/utils/toast';
import { useDecideBulkChangeMutation, useGetBulkChangeByIdQuery } from '../api/bulkChangeApi';
import { BulkChangeStatusBadge } from '../components/BulkChangeStatusBadge';
import { TABLE_BY_ENTITY_TYPE } from '../constants';
import type { BulkChangeDecision } from '../types';

const STATUS_KEYS = new Set(['EST_STATUS']);

// Fields rendered via StatusBadge don't go through this — everything else falls back to '—'.
const fmt = (v: string | number | null): string => (v == null || v === '' ? '—' : String(v));

export function BulkChangeReviewPage({ id }: { id: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { isArabic } = useLanguage();
  const [pendingAction, setPendingAction] = useState<BulkChangeDecision | null>(null);

  const batchId = Number(id);
  const { data, isLoading, isError, refetch } = useGetBulkChangeByIdQuery(batchId, { skip: !Number.isInteger(batchId) });
  const [decideBulkChange] = useDecideBulkChangeMutation();
  // Deciding needs both layers the API enforces: module access (bulk_change.approve) AND the
  // general approver right (approvals.approve), which SBR_PORTAL_PKG.DECIDE_BULK also checks.
  const approvals = usePermission('approvals');
  const bulkChange = usePermission('bulk_change');
  const canApprove = bulkChange.canApprove && approvals.canApprove;

  if (isLoading) {
    return <PageContainer><PageLoader /></PageContainer>;
  }

  const task = data?.data;
  if (isError || !task) {
    return (
      <PageContainer>
        <ErrorState
          message={t('bulkChange.notFound', { defaultValue: 'Bulk change task not found.' })}
          onRetry={refetch}
        />
      </PageContainer>
    );
  }

  const isPending = task.STATUS === 'PENDING';
  // Decided tasks are reached via the History list, not the pending queue — send Back there.
  const backHref = isPending ? '/tasks/bulk-change' : '/tasks/bulk-change/history';
  const tableKey = TABLE_BY_ENTITY_TYPE[task.ENTITY_TYPE];

  const doAction = async (decision: BulkChangeDecision) => {
    setPendingAction(decision);
    try {
      const response = await decideBulkChange({ id: task.BATCH_ID, decision }).unwrap();
      const result = response.data;

      // DECIDE_BULK is best-effort: individual rows can fail on a row lock (ORA-20009) or a
      // conflicting pending change (ORA-20012) while the rest go through. Report that honestly
      // instead of claiming the whole batch succeeded.
      if (result && result.failed > 0) {
        toast.warning(
          t('bulkChange.decidedPartial', {
            defaultValue: '{{succeeded}} of {{total}} changes {{decision}}; {{failed}} could not be applied.',
            succeeded: result.succeeded,
            total: result.total,
            failed: result.failed,
            decision: decision.toLowerCase(),
          })
        );
      } else {
        toast.success(
          decision === 'APPROVED'
            ? t('bulkChange.approved', { defaultValue: 'Bulk change approved.' })
            : t('bulkChange.rejected', { defaultValue: 'Bulk change rejected.' })
        );
      }
      router.push('/tasks/bulk-change');
    } catch {
      // The base query already surfaced the server message as a toast.
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <PageContainer>
      <button
        onClick={() => router.push(backHref)}
        className="mb-1 flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-[#A71D3A]"
      >
        {isArabic ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />} {t('bulkChange.back', { defaultValue: 'Back to bulk changes' })}
      </button>

      {/* Header */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-medium text-slate-500">{task.ID}</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3 text-slate-400" />
            <BulkChangeStatusBadge status={task.STATUS} />
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">{t('bulkChange.cols.submittedBy', { defaultValue: 'Submitted by' })}</p>
            <p className="mt-0.5 flex items-start gap-1.5 text-sm font-medium text-[#A71D3A]">
              <User className="h-3.5 w-3.5 mt-0.5 shrink-0 text-slate-400" /> <span className="min-w-0 break-words">{task.SUBMITTED_BY}</span>
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">{t('bulkChange.cols.submitted', { defaultValue: 'Submitted' })}</p>
            <p className="mt-0.5 break-words text-sm font-medium text-slate-800">{formatDate(task.SUBMITTED_AT)}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">{t('bulkChange.cols.table', { defaultValue: 'Table' })}</p>
            <p className="mt-0.5 break-words text-sm font-medium text-slate-800">
              {t(`nav.${tableKey.toLowerCase()}`, { defaultValue: tableKey })}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">{t('bulkChange.cols.records', { defaultValue: 'Records' })}</p>
            <p className="mt-0.5 break-words text-sm font-medium text-slate-800">
              {task.RECORDS} · {task.CHANGES} {t('bulkChange.changes', { defaultValue: 'Changes' })}
            </p>
          </div>
        </div>
      </div>

      {/* Rows the procedure could not create at all — no change request exists for these. */}
      {task.FAILED_ITEMS.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">
              {t('bulkChange.failedItemsTitle', {
                defaultValue: '{{count}} row(s) from the upload could not be submitted.',
                count: task.FAILED_ITEMS.length,
              })}
            </p>
            <ul className="mt-1 space-y-0.5">
              {task.FAILED_ITEMS.map((item) => (
                <li key={item.index}>
                  {t('bulkChange.wizard.validate.row', { defaultValue: 'Row' })} {item.index + 1}: {item.error ?? item.error_code}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Reason */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t('bulkChange.reasonForChange', { defaultValue: 'Reason for Change' })}
        </div>
        <p className="px-5 py-3 text-sm text-slate-700">{fmt(task.REASON)}</p>
      </div>

      {/* Per-record diff */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t('bulkChange.confirmTitle', { defaultValue: 'Confirm Bulk Change' })}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="w-10 px-3 py-2.5" />
                {task.COLUMNS.map((col) => (
                  <th key={col.key} className="whitespace-nowrap px-3 py-2.5 text-start text-xs font-medium uppercase tracking-wide text-slate-500">
                    {t(`bulkChange.reviewColumns.${col.key}`, { defaultValue: col.label })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {task.ROWS.map((row) => {
                // A row's own status can diverge from the batch's when it was decided
                // individually from the Attribute Change Requests screen, or when it failed
                // during a partial bulk decision.
                const rowRejected = row.status === 'REJECTED';
                return (
                  <tr key={row.auditLogId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-3 align-top">
                      {rowRejected
                        ? <XCircle className="h-4 w-4 text-red-500" />
                        : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                    </td>
                    {task.COLUMNS.map((col) => {
                      const field = row.fields.find((f) => f.key === col.key);
                      // The identifier column isn't part of CHANGE_DATA — show the record id.
                      if (!field) {
                        return (
                          <td key={col.key} className="px-3 py-3 align-top">
                            <p className="truncate text-sm font-medium text-slate-800">
                              {col.key === task.COLUMNS[0].key ? row.id : '—'}
                            </p>
                          </td>
                        );
                      }
                      return (
                        <td key={col.key} className={`px-3 py-3 align-top ${field.changed ? 'bg-amber-50/70 rounded-md' : ''}`}>
                          <div className="min-w-0">
                            {field.changed && (
                              <p className="truncate text-xs text-slate-400 line-through">{fmt(field.oldValue)}</p>
                            )}
                            {STATUS_KEYS.has(field.key) ? (
                              <StatusBadge status={field.value as string | null} />
                            ) : (
                              <p className={`truncate text-sm text-slate-800 ${field.changed ? 'font-semibold' : 'font-medium'}`}>
                                {fmt(field.value)}
                              </p>
                            )}
                            {!field.changed && (
                              <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                {t('bulkChange.noChange', { defaultValue: 'No change' })}
                              </p>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isPending && canApprove && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => doAction('REJECTED')}
            disabled={pendingAction !== null}
            className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
          >
            <X className="h-4 w-4" /> {t('bulkChange.reject', { defaultValue: 'Reject' })}
          </Button>
          <Button
            onClick={() => doAction('APPROVED')}
            disabled={pendingAction !== null}
            className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Check className="h-4 w-4" /> {t('bulkChange.approve', { defaultValue: 'Approve' })}
          </Button>
        </div>
      )}
    </PageContainer>
  );
}
