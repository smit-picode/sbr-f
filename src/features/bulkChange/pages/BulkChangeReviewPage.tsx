'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Check, X, CheckCircle2, User, Clock } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n';
import { MOCK_BULK_DETAILS } from '../mocks/bulkChangeMocks';
import { toast } from '@/utils/toast';

const STATUS_KEYS = new Set(['EST_STATUS']);

// Fields rendered via StatusBadge don't go through this — everything else falls back to '—'.
const fmt = (v: string | number | null): string => (v == null || v === '' ? '—' : String(v));

export function BulkChangeReviewPage({ id }: { id: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { isArabic } = useLanguage();
  const [submitting, setSubmitting] = useState<'approve' | 'reject' | null>(null);

  // No backend/API exists for this feature yet (pending DBA procedures) — read from static mock data.
  const task = MOCK_BULK_DETAILS[id];

  if (!task) {
    return (
      <PageContainer>
        <ErrorState message={t('bulkChange.notFound', { defaultValue: 'Bulk change task not found.' })} />
      </PageContainer>
    );
  }

  const pending = task.STATUS === 'Pending';
  const statusCls = task.STATUS === 'Approved' ? 'bg-emerald-50 text-emerald-700' : task.STATUS === 'Rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700';
  const statusLabel =
    task.STATUS === 'Approved'
      ? t('bulkChange.statusApproved', { defaultValue: 'Approved' })
      : task.STATUS === 'Rejected'
        ? t('bulkChange.statusRejected', { defaultValue: 'Rejected' })
        : t('bulkChange.statusPending', { defaultValue: 'Pending' });
  // Decided tasks are reached via the History list, not the pending queue — send Back there.
  const backHref = pending ? '/tasks/bulk-change' : '/tasks/bulk-change/history';

  const doAction = async (kind: 'approve' | 'reject') => {
    // Not wired to a backend yet — simulate the round-trip so the interaction reads as real.
    setSubmitting(kind);
    await new Promise((res) => setTimeout(res, 400));
    setSubmitting(null);
    toast.success(
      kind === 'approve'
        ? t('bulkChange.approved', { defaultValue: 'Bulk change approved.' })
        : t('bulkChange.rejected', { defaultValue: 'Bulk change rejected.' })
    );
    router.push('/tasks/bulk-change');
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
          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${statusCls}`}>
            <Clock className="h-3 w-3" /> {statusLabel}
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
            <p className="mt-0.5 break-words text-sm font-medium text-slate-800">{task.SUBMITTED_AT}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">{t('bulkChange.cols.table', { defaultValue: 'Table' })}</p>
            <p className="mt-0.5 break-words text-sm font-medium text-slate-800">{task.TABLE_NAME}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">{t('bulkChange.cols.records', { defaultValue: 'Records' })}</p>
            <p className="mt-0.5 break-words text-sm font-medium text-slate-800">
              {task.RECORDS} · {task.CHANGES} {t('bulkChange.changes', { defaultValue: 'Changes' })}
            </p>
          </div>
        </div>
      </div>

      {/* Reason */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t('bulkChange.reasonForChange', { defaultValue: 'Reason for Change' })}
        </div>
        <p className="px-5 py-3 text-sm text-slate-700">{task.REASON}</p>
      </div>

      {/* Confirm bulk change table */}
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
              {task.ROWS.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-3 align-top">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </td>
                  {row.fields.map((f) => (
                    <td key={f.key} className={`px-3 py-3 align-top ${f.changed ? 'bg-amber-50/70 rounded-md' : ''}`}>
                      {f.changed ? (
                        <div className="min-w-0">
                          <p className="truncate text-xs text-slate-400 line-through">{fmt(f.oldValue)}</p>
                          {STATUS_KEYS.has(f.key) ? (
                            <StatusBadge status={f.value as string | null} />
                          ) : (
                            <p className="truncate text-sm font-semibold text-slate-800">{fmt(f.value)}</p>
                          )}
                        </div>
                      ) : (
                        <div className="min-w-0">
                          {STATUS_KEYS.has(f.key) ? (
                            <StatusBadge status={f.value as string | null} />
                          ) : (
                            <p className="truncate text-sm font-medium text-slate-800">{fmt(f.value)}</p>
                          )}
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">{t('bulkChange.noChange', { defaultValue: 'No change' })}</p>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pending && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => doAction('reject')}
            disabled={submitting !== null}
            className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
          >
            <X className="h-4 w-4" /> {t('bulkChange.reject', { defaultValue: 'Reject' })}
          </Button>
          <Button
            onClick={() => doAction('approve')}
            disabled={submitting !== null}
            className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Check className="h-4 w-4" /> {t('bulkChange.approve', { defaultValue: 'Approve' })}
          </Button>
        </div>
      )}
    </PageContainer>
  );
}
