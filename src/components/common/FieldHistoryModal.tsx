'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Landmark, User, ArrowRight } from 'lucide-react';
import { formatDate } from '@/utils/format';

interface AuditMeta {
  columns: string[];
  reason: string | null;
  changedBy: string | null;
  approvedBy: string | null;
  decidedAt: string | null;
  approved: boolean;
  operation: string | null;
}

// A version row carries VALID_FROM/VALID_TO/SOURCE_CODE plus the audited fields, and
// optionally `_audit` metadata when the version resulted from a user edit.
export interface HistoryVersion {
  ID?: number;
  VALID_FROM?: string | null;
  VALID_TO?: string | null;
  SOURCE_CODE?: string | null;
  _audit?: AuditMeta | null;
}

interface FieldHistoryModalProps {
  versions: HistoryVersion[];
  fieldKey: string | null;
  fieldLabel: string;
  open: boolean;
  isLoading?: boolean;
  isError?: boolean;
  onClose: () => void;
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-[11px] text-slate-400">{label}</span>
      <span className="text-end text-[12px] font-medium text-slate-700">{value}</span>
    </div>
  );
}

export function FieldHistoryModal({ versions, fieldKey, fieldLabel, open, isLoading, isError, onClose }: FieldHistoryModalProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(0);

  useEffect(() => { setSelected(0); }, [fieldKey]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const valueOf = (v: HistoryVersion | undefined) => {
    if (!v || !fieldKey) return '—';
    const raw = (v as Record<string, unknown>)[fieldKey];
    return raw == null || raw === '' ? '—' : String(raw);
  };
  const sourceOf = (v: HistoryVersion) => v.SOURCE_CODE ?? null;
  const isUserEdit = (v: HistoryVersion) => !!(v._audit && fieldKey && v._audit.columns.includes(fieldKey));
  const asOf = (v: HistoryVersion) => {
    if (!v.VALID_FROM) return '—';
    const d = new Date(v.VALID_FROM);
    return isNaN(d.getTime()) ? formatDate(v.VALID_FROM) : d.toLocaleString('en-GB');
  };
  const decidedOf = (v: HistoryVersion) => {
    const raw = v._audit?.decidedAt;
    if (!raw) return '—';
    const d = new Date(raw);
    return isNaN(d.getTime()) ? formatDate(raw) : d.toLocaleString('en-GB');
  };

  // Collapse versions where THIS attribute's value did not change (other fields' edits create
  // versions where this field is unchanged). Versions arrive newest-first.
  const normalize = (v: HistoryVersion) => {
    const raw = fieldKey ? (v as Record<string, unknown>)[fieldKey] : null;
    return raw == null || raw === '' ? '' : String(raw);
  };
  const changeVersions = fieldKey
    ? versions.filter((v, i) => i === versions.length - 1 || normalize(v) !== normalize(versions[i + 1]))
    : versions;

  const countLabel = changeVersions.length === 1
    ? t('fieldHistory.changeRecordedOne', { defaultValue: '1 change recorded' })
    : t('fieldHistory.changeRecordedMany', { count: changeVersions.length, defaultValue: '{{count}} changes recorded' });

  const current = changeVersions[selected];

  const editedByUser = t('fieldHistory.editedByUser', { defaultValue: 'Edited by user' });
  const providedByRegulator = t('fieldHistory.providedByRegulator', { defaultValue: 'Provided by regulator' });

  const ApprovedBadge = () => (
    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9.5px] font-bold uppercase text-emerald-700">
      {t('fieldHistory.approved', { defaultValue: 'Approved' })}
    </span>
  );

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 px-5 py-4 text-white" style={{ background: 'linear-gradient(110deg,#6B1428,#A71D3A)' }}>
          <div className="min-w-0">
            <p className="text-[11px]" style={{ color: '#f0cdd5' }}>{t('fieldHistory.title', { defaultValue: 'Attribute history' })}</p>
            <p className="truncate text-[16px] font-bold">{fieldLabel}</p>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 text-white/80 transition-colors hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <p className="text-sm text-slate-500">{t('fieldHistory.loading', { defaultValue: 'Loading history…' })}</p>
          ) : isError ? (
            <p className="text-sm text-red-600">{t('fieldHistory.failed', { defaultValue: 'Failed to load history.' })}</p>
          ) : changeVersions.length === 0 ? (
            <p className="text-sm text-slate-400">{t('fieldHistory.none', { defaultValue: 'No history recorded.' })}</p>
          ) : (
            <>
              <p className="text-[12px] text-slate-400">{countLabel}</p>

              {/* Timeline */}
              <div className="space-y-2">
                {changeVersions.map((v, i) => {
                  const on = i === selected;
                  const userEdit = isUserEdit(v);
                  return (
                    <button
                      key={v.ID ?? i}
                      type="button"
                      onClick={() => setSelected(i)}
                      className={`block w-full rounded-xl border p-3 text-start transition-colors ${on ? 'border-[#A71D3A]/20 bg-[#FCF4F6]' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-bold text-slate-800">{userEdit ? editedByUser : providedByRegulator}</span>
                        {userEdit && v._audit?.approved && <ApprovedBadge />}
                      </div>
                      {userEdit ? (
                        <p className="mt-0.5 truncate text-sm font-semibold text-slate-700">
                          {valueOf(changeVersions[i + 1])} <span className="text-slate-400">→</span> {valueOf(v)}
                        </p>
                      ) : (
                        <p className="mt-0.5 truncate text-sm font-semibold text-slate-700">{valueOf(v)}</p>
                      )}
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {formatDate(v.VALID_FROM)} · {userEdit ? (v._audit?.changedBy ?? '—') : (sourceOf(v) ?? '—')}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Selected detail */}
              {current && (isUserEdit(current) ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="mb-2.5 flex items-center gap-2">
                    <User className="h-4 w-4 text-[#A71D3A]" />
                    <span className="text-[13px] font-bold text-slate-800">{editedByUser}</span>
                    {current._audit?.approved && <span className="ms-auto"><ApprovedBadge /></span>}
                  </div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[12px] text-slate-400 line-through">{valueOf(changeVersions[selected + 1])}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    <span className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[12px] font-bold text-slate-800">{valueOf(current)}</span>
                  </div>
                  <div className="space-y-1.5">
                    {current._audit?.reason && <MetaRow label={t('fieldHistory.reason', { defaultValue: 'Reason' })} value={<span className="italic">“{current._audit.reason}”</span>} />}
                    <MetaRow label={t('fieldHistory.changedBy', { defaultValue: 'Changed by' })} value={current._audit?.changedBy ?? '—'} />
                    <MetaRow label={t('fieldHistory.approvedBy', { defaultValue: 'Approved by' })} value={current._audit?.approvedBy ?? t('fieldHistory.automatic', { defaultValue: 'Automatic' })} />
                    <MetaRow label={t('fieldHistory.decided', { defaultValue: 'Decided' })} value={decidedOf(current)} />
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="mb-2.5 flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-[#A71D3A]" />
                    <span className="text-[13px] font-bold text-slate-800">{providedByRegulator}</span>
                    {sourceOf(current) && <span className="ms-auto text-[10px] font-bold tracking-wide text-[#A71D3A]">{sourceOf(current)}</span>}
                  </div>
                  <span className="inline-block rounded-md border border-slate-300 bg-white px-2 py-1 text-[12px] font-bold text-slate-800">{valueOf(current)}</span>
                  <div className="mt-3 space-y-1.5">
                    <MetaRow label={t('fieldHistory.reason', { defaultValue: 'Reason' })} value={t('fieldHistory.sourceProvided', { defaultValue: 'Value provided directly by the source register.' })} />
                    <MetaRow label={t('fieldHistory.ownerReg', { defaultValue: 'Owner reg.' })} value={sourceOf(current) ?? '—'} />
                    <MetaRow label={t('fieldHistory.asOf', { defaultValue: 'As of' })} value={asOf(current)} />
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
