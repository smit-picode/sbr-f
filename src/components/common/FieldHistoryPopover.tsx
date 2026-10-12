'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { History, User, Landmark, X, ArrowRight } from 'lucide-react';
import { formatDate } from '@/utils/format';
import { useLanguage } from '@/i18n';
import type { HistoryVersion } from './FieldHistoryModal';

interface FieldHistoryPopoverProps {
  versions: HistoryVersion[];
  fieldKey: string;
  fieldLabel: string;
  isLoading?: boolean;
  isError?: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

const PANEL_WIDTH = 290;

// Anchored attribute-history popover (tooltip-style) — replaces the full-screen drawer.
export function FieldHistoryPopover({ versions, fieldKey, fieldLabel, isLoading, isError, onClose, anchorRef }: FieldHistoryPopoverProps) {
  const { t } = useTranslation();
  const { isArabic } = useLanguage();
  const panelRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<{ left: number; maxHeight: number; top?: number; bottom?: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [anchorRef, onClose]);

  useLayoutEffect(() => {
    const update = () => {
      const anchorRect = anchorRef.current?.getBoundingClientRect();
      if (!anchorRect) return;
      const margin = 8;
      const spaceBelow = window.innerHeight - anchorRect.bottom - margin;
      const spaceAbove = anchorRect.top - margin;
      const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
      const maxHeight = Math.max(160, Math.min(420, openUp ? spaceAbove : spaceBelow));
      const left = Math.min(
        Math.max(margin, anchorRect.right - PANEL_WIDTH),
        window.innerWidth - PANEL_WIDTH - margin
      );
      setRect(
        openUp
          ? { left, maxHeight, bottom: window.innerHeight - anchorRect.top + margin }
          : { left, maxHeight, top: anchorRect.bottom + margin }
      );
    };
    update();
    window.addEventListener('resize', update);
    document.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      document.removeEventListener('scroll', update, true);
    };
  }, [anchorRef, isArabic, versions, isLoading, isError]);

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

  const requestEntries = versions.filter((v) => v.request);
  const realVersions = versions.filter((v) => !v.request);
  const fieldRequests = requestEntries.filter((r) => r.changes && Object.prototype.hasOwnProperty.call(r.changes, fieldKey));

  const changes = realVersions.filter((v, i) => i === realVersions.length - 1 || norm(v) !== norm(realVersions[i + 1]));

  const isUserEdit = (v: HistoryVersion) => !!(v.audit && v.audit.columns.includes(fieldKey));

  // Single chronological timeline (newest first).
  type TimelineItem =
    | { kind: 'request'; date: number; data: HistoryVersion }
    | { kind: 'version'; date: number; data: HistoryVersion; prev?: HistoryVersion };

  const timeOf = (d: unknown): number => (d ? new Date(d as string).getTime() : 0);

  const timeline: TimelineItem[] = [
    ...fieldRequests.map((r): TimelineItem => ({ kind: 'request', date: timeOf(r.VALID_FROM), data: r })),
    ...changes.map((v, i): TimelineItem => ({ kind: 'version', date: timeOf(v.VALID_FROM), data: v, prev: changes[i + 1] })),
  ].sort((a, b) => b.date - a.date);

  const hasUserEdits = timeline.some((item) => item.kind === 'request' || isUserEdit(item.data));

  if (!rect) return null;

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-50 flex flex-col overflow-hidden rounded-xl bg-white shadow-card shadow-2xl"
      style={{
        left: rect.left,
        width: PANEL_WIDTH,
        maxHeight: rect.maxHeight,
        ...(rect.top !== undefined ? { top: rect.top } : { bottom: rect.bottom }),
      }}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-3.5 py-2.5">
        <History className="h-3.5 w-3.5 shrink-0 text-adaam" />
        <span className="text-[12px] font-bold text-slate-700">
          {t('fieldHistory.title', { defaultValue: 'Attribute history' })}
        </span>
        <span className="ms-1 truncate text-[11px] text-slate-400">{fieldLabel}</span>
        <button
          type="button"
          onClick={onClose}
          className="ms-auto shrink-0 text-slate-400 transition-colors hover:text-slate-700"
          aria-label={t('common.close', { defaultValue: 'Close' })}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 py-3">
        {!isLoading && !isError && !hasUserEdits && timeline.length > 0 && (
          <div className="mb-2 text-[11px] text-slate-400">
            {t('fieldHistory.noEdits', { defaultValue: 'No edits — original source value' })}
          </div>
        )}
        {isLoading ? (
          <p className="py-1 text-[12px] text-slate-500">{t('fieldHistory.loading', { defaultValue: 'Loading history…' })}</p>
        ) : isError ? (
          <p className="py-1 text-[12px] text-red-600">{t('fieldHistory.failed', { defaultValue: 'Failed to load history.' })}</p>
        ) : timeline.length === 0 ? (
          <p className="py-1 text-[12px] text-slate-400">{t('fieldHistory.none', { defaultValue: 'No history recorded.' })}</p>
        ) : (
          <ul className="relative ps-4">
            <span className="absolute bottom-1.5 start-[5px] top-1.5 w-px bg-slate-200" />
            {timeline.map((item, i) => {
              if (item.kind === 'request') {
                const r = item.data;
                const ch = r.changes?.[fieldKey];
                const rejected = r.status === 'REJECTED';
                return (
                  <li key={`req-${i}`} className="relative pb-3.5 last:pb-0">
                    <span className="absolute -start-4 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white" style={{ background: rejected ? '#DF7878' : '#BF9F5F' }} />
                    <div className="flex flex-wrap items-center gap-1.5">
                      <User className="h-3 w-3 text-slate-400" />
                      <span className="text-[12px] font-semibold text-slate-700">{t('fieldHistory.editedByUser', { defaultValue: 'Edited by user' })}</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold ${rejected ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {rejected ? t('fieldHistory.rejected', { defaultValue: 'Rejected' }) : t('fieldHistory.pendingApproval', { defaultValue: 'Pending approval' })}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px]">
                      <span className="text-slate-400 line-through">{fmtReq(ch?.old)}</span>
                      <ArrowRight className="h-3 w-3 shrink-0 text-slate-300 rtl:rotate-180" />
                      <span className="font-semibold text-slate-800">{fmtReq(ch?.new)}</span>
                    </div>
                    {r.audit?.reason && <p className="mt-1 text-[11px] italic text-slate-500">“{r.audit.reason}”</p>}
                    <p className="mt-1 text-[10.5px] text-slate-400">
                      {formatDate(r.VALID_FROM)}
                      {r.audit?.changedBy && ` · ${t('fieldHistory.updatedBy', { defaultValue: 'Updated by' })} ${r.audit.changedBy}`}
                      {rejected && r.audit?.approvedBy && ` · ${t('fieldHistory.rejectedBy', { defaultValue: 'Rejected by' })} ${r.audit.approvedBy}`}
                    </p>
                  </li>
                );
              }

              const v = item.data;
              const userEdit = isUserEdit(v);
              const dotColor = userEdit ? (v.audit?.approved ? '#059669' : '#BF9F5F') : '#A29374';
              return (
                <li key={v.ID ?? i} className="relative pb-3.5 last:pb-0">
                  <span className="absolute -start-4 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white" style={{ background: dotColor }} />
                  <div className="flex items-center gap-1.5">
                    {userEdit
                      ? <User className="h-3 w-3 text-slate-400" />
                      : <Landmark className="h-3 w-3 text-slate-400" />}
                    <span className="text-[12px] font-semibold text-slate-700">
                      {userEdit
                        ? t('fieldHistory.editedByUser', { defaultValue: 'Edited by user' })
                        : t('fieldHistory.providedByRegulator', { defaultValue: 'Provided by regulator' })}
                    </span>
                    {userEdit
                      ? (v.audit?.approved && (
                          <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-emerald-700">
                            {t('fieldHistory.approved', { defaultValue: 'Approved' })}
                          </span>
                        ))
                      : (v.SOURCE_CODE && (
                          <span className="text-[11px] font-semibold text-adaam">{v.SOURCE_CODE}</span>
                        ))}
                  </div>
                  {userEdit ? (
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px]">
                      <span className="text-slate-400 line-through">{valueOf(item.prev)}</span>
                      <ArrowRight className="h-3 w-3 shrink-0 text-slate-300 rtl:rotate-180" />
                      <span className="font-semibold text-slate-800">{valueOf(v)}</span>
                    </div>
                  ) : (
                    <p className="mt-1 text-[12px] font-semibold text-slate-800">{valueOf(v)}</p>
                  )}
                  {userEdit && v.audit?.reason && (
                    <p className="mt-1 text-[11px] italic text-slate-500">“{v.audit.reason}”</p>
                  )}
                  <p className="mt-0.5 text-[10.5px] text-slate-400">
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
    </div>,
    document.body
  );
}
