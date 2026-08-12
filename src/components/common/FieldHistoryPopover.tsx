'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { History, User, Landmark, X } from 'lucide-react';
import { formatDate } from '@/utils/format';
import type { HistoryVersion } from './FieldHistoryModal';

interface FieldHistoryPopoverProps {
  versions: HistoryVersion[];
  fieldKey: string;
  fieldLabel: string;
  isLoading?: boolean;
  isError?: boolean;
  onClose: () => void;
}

// Anchored attribute-history popover (tooltip-style). Rendered inside a `relative` field
// wrapper, it opens just below the clicked clock icon — replaces the full-screen drawer.
export function FieldHistoryPopover({ versions, fieldKey, fieldLabel, isLoading, isError, onClose }: FieldHistoryPopoverProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const [openUp, setOpenUp] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // If the downward-opening popover spills past the viewport bottom and there's room above
  // the anchor, flip it to open upward instead. Run BEFORE paint (useLayoutEffect) so the
  // popover appears directly in its final position — no visible jump from down to up.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setOpenUp(rect.bottom > window.innerHeight - 8 && rect.top - rect.height > 8);
  }, [versions, isLoading, isError]);

  const valueOf = (v: HistoryVersion | undefined) => {
    if (!v) return '—';
    const raw = (v as Record<string, unknown>)[fieldKey];
    if (raw == null || raw === '') return '—';
    return typeof raw === 'number' ? raw.toLocaleString() : String(raw);
  };
  const norm = (v: HistoryVersion) => {
    const raw = (v as Record<string, unknown>)[fieldKey];
    return raw == null || raw === '' ? '' : String(raw);
  };
  const fmtReq = (x: unknown) => (x == null || x === '' ? '—' : typeof x === 'number' ? x.toLocaleString() : String(x));

  // Open/closed change requests for this field (PENDING / REJECTED), shown above the applied history.
  const requestEntries = versions.filter((v) => v.request);
  const realVersions = versions.filter((v) => !v.request);
  const fieldRequests = requestEntries.filter((r) => r.changes && Object.prototype.hasOwnProperty.call(r.changes, fieldKey));

  // Collapse versions where this attribute's value did not change (versions arrive newest-first).
  const changes = realVersions.filter((v, i) => i === realVersions.length - 1 || norm(v) !== norm(realVersions[i + 1]));

  const isUserEdit = (v: HistoryVersion) => !!(v.audit && v.audit.columns.includes(fieldKey));

  // Single chronological timeline (newest first). Previously requests were always rendered
  // above applied versions regardless of date — correct when the request is the newest event,
  // but wrong whenever an older PENDING/REJECTED request still sits above newer APPROVED
  // edits (e.g. a rejected attempt followed later by a separate, approved one): the older
  // item appeared first, making the history look out of order / incomplete. Merging both into
  // one array and sorting by date fixes this without changing how any individual entry renders.
  type TimelineItem =
    | { kind: 'request'; date: number; data: HistoryVersion }
    | { kind: 'version'; date: number; data: HistoryVersion; prev?: HistoryVersion };

  const timeOf = (d: unknown): number => (d ? new Date(d as string).getTime() : 0);

  const timeline: TimelineItem[] = [
    ...fieldRequests.map((r): TimelineItem => ({ kind: 'request', date: timeOf(r.VALID_FROM), data: r })),
    ...changes.map((v, i): TimelineItem => ({ kind: 'version', date: timeOf(v.VALID_FROM), data: v, prev: changes[i + 1] })),
  ].sort((a, b) => b.date - a.date);

  return (
    <div
      ref={ref}
      className={`absolute start-0 z-50 w-80 max-w-[90vw] rounded-lg border border-slate-200 bg-white shadow-xl ${openUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2 text-sm font-bold text-slate-800">
          <History className="h-4 w-4 shrink-0 text-[#A71D3A]" />
          {t('fieldHistory.title', { defaultValue: 'Attribute history' })}
          <span className="truncate font-normal text-slate-400">{fieldLabel}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-slate-400 transition-colors hover:text-slate-600"
          aria-label={t('common.close', { defaultValue: 'Close' })}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto px-4 py-3">
        {isLoading ? (
          <p className="py-1 text-sm text-slate-500">{t('fieldHistory.loading', { defaultValue: 'Loading history…' })}</p>
        ) : isError ? (
          <p className="py-1 text-sm text-red-600">{t('fieldHistory.failed', { defaultValue: 'Failed to load history.' })}</p>
        ) : timeline.length === 0 ? (
          <p className="py-1 text-sm text-slate-400">{t('fieldHistory.none', { defaultValue: 'No history recorded.' })}</p>
        ) : (
          <ul className="relative space-y-4">
            <span className="absolute bottom-2 start-[3px] top-2 w-px bg-slate-200" />
            {timeline.map((item, i) => {
              if (item.kind === 'request') {
                const r = item.data;
                const ch = r.changes?.[fieldKey];
                const rejected = r.status === 'REJECTED';
                return (
                  <li key={`req-${i}`} className="relative ps-5">
                    <span className="absolute start-0 top-1.5 h-2 w-2 rounded-full border-2 border-white" style={{ background: rejected ? '#D1495B' : '#E0A23C' }} />
                    <div className="flex flex-wrap items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-[13px] font-semibold text-slate-700">{t('fieldHistory.editedByUser', { defaultValue: 'Edited by user' })}</span>
                      <span className={`rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase ${rejected ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {rejected ? t('fieldHistory.rejected', { defaultValue: 'Rejected' }) : t('fieldHistory.pendingApproval', { defaultValue: 'Pending approval' })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      <span className="text-slate-400 line-through">{fmtReq(ch?.old)}</span>
                      <span className="mx-1 text-slate-400">→</span>
                      {fmtReq(ch?.new)}
                    </p>
                    {r.audit?.reason && <p className="mt-0.5 text-xs italic text-slate-500">“{r.audit.reason}”</p>}
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {formatDate(r.VALID_FROM)}
                      {r.audit?.changedBy && ` · ${t('fieldHistory.updatedBy', { defaultValue: 'Updated by' })} ${r.audit.changedBy}`}
                      {rejected && r.audit?.approvedBy && ` · ${t('fieldHistory.rejectedBy', { defaultValue: 'Rejected by' })} ${r.audit.approvedBy}`}
                    </p>
                  </li>
                );
              }

              const v = item.data;
              const userEdit = isUserEdit(v);
              const dotColor = userEdit ? (v.audit?.approved ? '#1F8A5B' : '#E0A23C') : '#A71D3A';
              return (
                <li key={v.ID ?? i} className="relative ps-5">
                  <span className="absolute start-0 top-1.5 h-2 w-2 rounded-full border-2 border-white" style={{ background: dotColor }} />
                  <div className="flex items-center gap-1.5">
                    {userEdit
                      ? <User className="h-3.5 w-3.5 text-slate-400" />
                      : <Landmark className="h-3.5 w-3.5 text-slate-400" />}
                    <span className="text-[13px] font-semibold text-slate-700">
                      {userEdit
                        ? t('fieldHistory.editedByUser', { defaultValue: 'Edited by user' })
                        : t('fieldHistory.providedByRegulator', { defaultValue: 'Provided by regulator' })}
                    </span>
                    {userEdit
                      ? (v.audit?.approved && (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9.5px] font-bold uppercase text-emerald-700">
                            {t('fieldHistory.approved', { defaultValue: 'Approved' })}
                          </span>
                        ))
                      : (v.SOURCE_CODE && <span className="text-[10px] font-bold tracking-wide text-[#A71D3A]">{v.SOURCE_CODE}</span>)}
                  </div>
                  {userEdit ? (
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      <span className="text-slate-400 line-through">{valueOf(item.prev)}</span>
                      <span className="mx-1 text-slate-400">→</span>
                      {valueOf(v)}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm font-medium text-slate-700">{valueOf(v)}</p>
                  )}
                  {userEdit && v.audit?.reason && (
                    <p className="mt-0.5 text-xs italic text-slate-500">“{v.audit.reason}”</p>
                  )}
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {formatDate(v.VALID_FROM)}
                    {userEdit && v.audit?.changedBy && ` · ${t('fieldHistory.updatedBy', { defaultValue: 'Updated by' })} ${v.audit.changedBy}`}
                    {userEdit && v.audit?.approvedBy && ` · ${t('fieldHistory.approvedBy', { defaultValue: 'Approved by' })} ${v.audit.approvedBy}`}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
