'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { useGetEstablishmentHistoryQuery } from '@/features/establishments/api/establishmentsApi';
import type { SbrEstablishment } from '@/types';
import { formatDate } from '@/utils/format';
import { useTranslation } from 'react-i18next';
import { History, User, Landmark, X } from 'lucide-react';

interface AuditMeta {
  columns: string[];
  reason: string | null;
  changedBy: string | null;
  approvedBy: string | null;
  decidedAt: string | null;
  approved: boolean;
  operation: string | null;
}
type Version = SbrEstablishment & {
  _audit?: AuditMeta | null;
  _request?: boolean;
  status?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
};

interface EstablishmentHistoryPopoverProps {
  sbrId: number;
  field: keyof SbrEstablishment;
  fieldLabel: string;
  onClose: () => void;
}

// Anchored attribute-history popover — rendered inside a `relative` field wrapper, opens
// just below the clicked clock icon (tooltip-style, not a full-screen dialog).
export function EstablishmentHistoryPopover({ sbrId, field, fieldLabel, onClose }: EstablishmentHistoryPopoverProps) {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useGetEstablishmentHistoryQuery(sbrId);
  const versions = (data?.data ?? []) as Version[];
  const ref = useRef<HTMLDivElement>(null);
  const [openUp, setOpenUp] = useState(false);

  // Flip the popover upward when it would spill past the viewport bottom and there's room above.
  // useLayoutEffect runs before paint so it appears in its final position (no visible jump).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setOpenUp(rect.bottom > window.innerHeight - 8 && rect.top - rect.height > 8);
  }, [versions, isLoading, isError]);

  const valueOf = (v: Version | undefined) => {
    if (!v) return '—';
    const raw = v[field] as unknown;
    if (raw == null || raw === '') return '—';
    return typeof raw === 'number' ? raw.toLocaleString() : String(raw);
  };
  const norm = (v: Version) => {
    const raw = v[field] as unknown;
    return raw == null || raw === '' ? '' : String(raw);
  };
  const fmtReq = (x: unknown) => (x == null || x === '' ? '—' : typeof x === 'number' ? x.toLocaleString() : String(x));

  // Open/closed change requests for this field (PENDING / REJECTED), shown above the applied history.
  const requestEntries = versions.filter((v) => v._request);
  const realVersions = versions.filter((v) => !v._request);
  const fieldRequests = requestEntries.filter((r) => r.changes && Object.prototype.hasOwnProperty.call(r.changes, field as string));

  // Collapse versions where this attribute's value did not change (versions arrive newest-first).
  const changes = realVersions.filter((v, i) => i === realVersions.length - 1 || norm(v) !== norm(realVersions[i + 1]));

  const isUserEdit = (v: Version) => !!(v._audit && v._audit.columns.includes(field as string));

  return (
    <div
      ref={ref}
      className={`absolute start-0 z-50 w-80 max-w-[90vw] rounded-lg border border-slate-200 bg-white shadow-xl ${openUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <History className="h-4 w-4 text-[#A71D3A]" />
          {t('fieldHistory.title', { defaultValue: 'Attribute history' })}
          <span className="font-normal text-slate-400">{fieldLabel}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 transition-colors hover:text-slate-600"
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
        ) : changes.length === 0 && fieldRequests.length === 0 ? (
          <p className="py-1 text-sm text-slate-400">{t('fieldHistory.none', { defaultValue: 'No history recorded.' })}</p>
        ) : (
          <ul className="relative space-y-4">
            <span className="absolute bottom-2 start-[3px] top-2 w-px bg-slate-200" />
            {fieldRequests.map((r, i) => {
              const ch = r.changes?.[field as string];
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
                  {r._audit?.reason && <p className="mt-0.5 text-xs italic text-slate-500">“{r._audit.reason}”</p>}
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {formatDate(r.VALID_FROM)}
                    {r._audit?.changedBy && ` · by ${r._audit.changedBy}`}
                  </p>
                </li>
              );
            })}
            {changes.map((v, i) => {
              const userEdit = isUserEdit(v);
              const dotColor = userEdit ? (v._audit?.approved ? '#1F8A5B' : '#E0A23C') : '#A71D3A';
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
                      ? (v._audit?.approved && (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9.5px] font-bold uppercase text-emerald-700">
                            {t('fieldHistory.approved', { defaultValue: 'Approved' })}
                          </span>
                        ))
                      : (v.SOURCE_CODE && <span className="text-[10px] font-bold tracking-wide text-[#A71D3A]">{v.SOURCE_CODE}</span>)}
                  </div>
                  {userEdit ? (
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      <span className="text-slate-400 line-through">{valueOf(changes[i + 1])}</span>
                      <span className="mx-1 text-slate-400">→</span>
                      {valueOf(v)}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm font-medium text-slate-700">{valueOf(v)}</p>
                  )}
                  {userEdit && v._audit?.reason && (
                    <p className="mt-0.5 text-xs italic text-slate-500">“{v._audit.reason}”</p>
                  )}
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {formatDate(v.VALID_FROM)}
                    {userEdit && v._audit?.changedBy && ` · by ${v._audit.changedBy}`}
                    {userEdit && v._audit?.approvedBy && ` · approved by ${v._audit.approvedBy}`}
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
