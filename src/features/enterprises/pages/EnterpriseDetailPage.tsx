'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/common/PageContainer';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PendingBadge } from '@/components/common/PendingBadge';
import { PendingApprovalBanner } from '@/components/common/PendingApprovalBanner';
import { PendingFieldBadge } from '@/components/common/PendingFieldBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/common/Loader';
import { ErrorState } from '@/components/common/ErrorState';
import { useGetEnterpriseByIdQuery } from '../api/enterprisesApi';
import { getIsicLabel } from '../constants';
import { EstablishmentHistoryPopover } from '../components/EstablishmentHistoryModal';
import { EditEnterpriseModal } from '../components/EditEnterpriseModal';
import type {
  EnterpriseEstablishment,
  EnterpriseChangeHistoryEntry,
  EnterpriseProfilingChange,
  SbrEstablishment,
} from '@/types';
import { nullableText, formatDate } from '@/utils/format';
import { usePermission } from '@/hooks';
import { useLanguage } from '@/i18n';
import {
  ChevronLeft, ChevronRight, Target, Briefcase, Building2, Users, MapPin,
  GitBranch, ClipboardList, ArrowUpRight, History, Pencil,
} from 'lucide-react';

const MAROON = '#A71D3A';

// Table-name pill colours (same palette as the Attribute Change Requests list)
const TABLE_BADGE: Record<string, string> = {
  SBR_ESTABLISHMENTS: 'bg-[#A71D3A]/10 text-[#A71D3A]',
  SBR_ENTERPRISES: 'bg-amber-50 text-amber-700',
  SBR_CONTACTS: 'bg-emerald-50 text-emerald-700',
  SBR_ADDRESSES: 'bg-sky-50 text-sky-700',
};

function SummaryCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-slate-500">{label}</p>
      <div className="mt-0.5 text-sm font-medium text-slate-800 truncate">{value}</div>
    </div>
  );
}

function SectionCard({ title, count, icon, children }: { title: string; count?: number; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <span style={{ color: MAROON }}>{icon}</span>
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        {count != null && (
          <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{count}</span>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function IsicChip({ code, fromText, primary }: { code: string; fromText?: string; primary?: boolean }) {
  const desc = getIsicLabel(code);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs ${
        primary ? 'border-[#A71D3A]/15 bg-[#A71D3A]/5' : 'border-slate-200 bg-slate-50'
      }`}
    >
      <span className="font-mono font-semibold text-slate-800">{code}</span>
      {desc && <span className="text-slate-500">{desc}</span>}
      {fromText && <span className="text-slate-400">{fromText}</span>}
      {primary && <span className="font-semibold text-[#A71D3A]">· PRIMARY</span>}
    </span>
  );
}

function FieldWithHistory({ label, value, sbrId, field, fieldLabel, pendingCount }: {
  label: string;
  value: React.ReactNode;
  sbrId: number;
  field: keyof SbrEstablishment;
  fieldLabel: string;
  pendingCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  // These cards show establishment fields, so history is gated by establishments.view_history
  const { canViewHistory } = usePermission('establishments');

  // Close the anchored popover on outside click / Escape (the clock button itself toggles)
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative min-w-0" ref={wrapRef}>
      <div className="flex items-center gap-1.5">
        <p className="text-xs text-slate-500">{label}</p>
        <PendingFieldBadge count={pendingCount} />
      </div>
      <div className="mt-0.5 flex items-center gap-1 text-sm font-medium text-slate-800">
        <span className="truncate">{value}</span>
        {canViewHistory && (
          <button type="button" onClick={() => setOpen((o) => !o)} className={`cursor-pointer transition-colors hover:text-[#A71D3A] ${pendingCount ? 'text-[#A71D3A]' : 'text-slate-300'}`} title="View history">
            <History className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {open && canViewHistory && (
        <EstablishmentHistoryPopover sbrId={sbrId} field={field} fieldLabel={fieldLabel} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}

function EstablishmentCard({ est, headSbrId, t, onOpen }: { est: EnterpriseEstablishment; headSbrId: number | null; t: (k: string, o?: { lng?: string }) => string; onOpen: (est: EnterpriseEstablishment) => void }) {
  const isMain = est.SBR_ID === headSbrId || est.MAIN_BRANCH_FLG === 'MAIN';
  const activitiesCount = est.ISIC_CODE ? 1 : 0;
  return (
    <div className="rounded-lg border border-slate-200">
      {/* header */}
      <div className={`rounded-t-lg px-4 py-3 ${isMain ? 'bg-[#A71D3A]/5' : 'bg-slate-50'}`}>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-medium text-slate-600">#{est.SBR_ID}</span>
          {isMain ? (
            <Badge className="rounded bg-[#A71D3A] text-white text-[10px] font-bold">{t('enterpriseDetail.mainUnit')}</Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]">{t('enterpriseDetail.branch')}</Badge>
          )}
          <StatusBadge status={est.EST_STATUS} />
          <button type="button" onClick={() => onOpen(est)} className="ml-auto text-slate-400 transition-colors hover:text-[#A71D3A]" title={t('enterpriseDetail.openEstablishment')}>
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 font-semibold text-slate-800">{nullableText(est.NAME_ENU)}</p>
        {est.MOCI_CR_NUM && <p className="text-xs text-slate-500">CR {est.MOCI_CR_NUM}</p>}
      </div>
      {/* body */}
      <div className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <FieldWithHistory label={t('enterpriseDetail.sector')} value={nullableText(est.SECTOR_ID)} sbrId={est.SBR_ID} field="SECTOR_ID" fieldLabel={t('enterpriseDetail.sector')} pendingCount={est.PENDING_FIELDS?.SECTOR_ID} />
          <FieldWithHistory label={t('enterpriseDetail.legalType')} value={nullableText(est.LEGAL_TYPE)} sbrId={est.SBR_ID} field="LEGAL_TYPE" fieldLabel={t('enterpriseDetail.legalType')} pendingCount={est.PENDING_FIELDS?.LEGAL_TYPE} />
          <FieldWithHistory label={t('enterpriseDetail.employees')} value={est.EMPLOYMENT_COUNT != null ? est.EMPLOYMENT_COUNT.toLocaleString() : '—'} sbrId={est.SBR_ID} field="EMPLOYMENT_COUNT" fieldLabel={t('enterpriseDetail.employees')} pendingCount={est.PENDING_FIELDS?.EMPLOYMENT_COUNT} />
          <SummaryCell label={t('enterpriseDetail.activities')} value={activitiesCount} />
        </div>

        {est.ISIC_CODE && (
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">{t('enterpriseDetail.registeredActivities')}</p>
            <IsicChip code={est.ISIC_CODE} primary />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-3 md:grid-cols-2">
          {/* contacts */}
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
              <Users className="h-3.5 w-3.5" /> {t('enterpriseDetail.contacts')} <span className="text-slate-400">({est.contacts?.length ?? 0})</span>
            </p>
            {est.contacts?.length ? (
              <ul className="space-y-1.5">
                {est.contacts.map((c) => (
                  <li key={c.ID} className="text-sm">
                    <span className="text-slate-700">{nullableText(c.CONTACT_NAME ?? c.EMAIL)}</span>
                    <span className="block text-xs text-slate-400">
                      {[c.ROLE, c.PHONE ?? c.MOBILE, c.EMAIL].filter(Boolean).join(' · ') || '—'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">—</p>
            )}
          </div>
          {/* addresses */}
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
              <MapPin className="h-3.5 w-3.5" /> {t('enterpriseDetail.addresses')} <span className="text-slate-400">({est.addresses?.length ?? 0})</span>
            </p>
            {est.addresses?.length ? (
              <ul className="space-y-1.5">
                {est.addresses.map((a) => (
                  <li key={a.ID} className="text-sm">
                    <span className="text-slate-700">
                      {[a.MUNICIPALITY_ID, a.ZONE ? `Zone ${a.ZONE}` : null, a.STREET ? `St ${a.STREET}` : null].filter(Boolean).join(' · ') || '—'}
                    </span>
                    {a.QARS && <span className="block text-xs text-slate-400">QARS {a.QARS}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">—</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChangeHistoryList({ entries }: { entries: EnterpriseChangeHistoryEntry[] }) {
  const { t } = useTranslation();
  if (!entries.length) return <p className="text-sm text-slate-400">{t('enterpriseDetail.noChangeHistory')}</p>;
  return (
    <ul className="space-y-3">
      {entries.map((e) => {
        const recordId = e.NEW_RECORD_ID ?? e.PREV_RECORD_ID;
        const s = (e.STATUS || 'APPROVED').toUpperCase();
        const statusCfg = s === 'REJECTED'
          ? { cls: 'bg-red-50 text-red-700', label: 'Rejected' }
          : s === 'PENDING'
          ? { cls: 'bg-amber-50 text-amber-700', label: 'Pending approval' }
          : { cls: 'bg-emerald-50 text-emerald-700', label: 'Approved' };
        return (
          <li key={e.ID} className="rounded-md border border-slate-100 p-2.5">
            <div className="flex items-center gap-2">
              <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${TABLE_BADGE[e.TABLE_NAME] ?? 'bg-slate-100 text-slate-600'}`}>{e.TABLE_NAME}</span>
              {recordId != null && <span className="font-mono text-xs font-medium text-red-600">#{recordId}</span>}
              <span className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium ${statusCfg.cls}`}>{statusCfg.label}</span>
            </div>
            <p className="mt-1 text-sm text-slate-700">{nullableText(e.REASON)}</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {formatDate(e.CREATED_AT)}
              {e.changedByUser?.EMAIL && ` · ${e.changedByUser.EMAIL}`}
              {e.approvedByUser?.EMAIL && ` → ${e.approvedByUser.EMAIL}`}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function ProfilingChangesList({ entries }: { entries: EnterpriseProfilingChange[] }) {
  return (
    <ul className="mt-3">
      {entries.map((e, i) => {
        const added = e.ACTION === 'ADD';
        const isLast = i === entries.length - 1;
        return (
          <li key={e.ID} className="relative flex gap-3 pb-4 last:pb-0">
            {/* Timeline rail: dot + connecting vertical line to the next entry */}
            <div className="relative flex w-2.5 flex-shrink-0 justify-center">
              {!isLast && (
                <span
                  className="absolute left-1/2 top-2 w-px -translate-x-1/2 bg-slate-200"
                  style={{ height: 'calc(100% + 0.5rem)' }}
                />
              )}
              <span
                className="z-10 mt-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white"
                style={{ backgroundColor: added ? '#059669' : '#dc2626' }}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${added ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {added ? '+ Added' : '− Removed'}
                </span>
                <span className="text-sm font-medium text-slate-800">
                  {e.SBR_ID != null && <span className="font-mono text-red-600">#{e.SBR_ID}</span>}
                  {e.NAME ? ` — ${e.NAME}` : ''}{e.CR ? ` (${e.CR})` : ''}
                </span>
              </div>
              {e.REASON && <p className="mt-0.5 text-xs italic text-slate-500">“{e.REASON}”</p>}
              <p className="mt-0.5 text-xs text-slate-400">
                {formatDate(e.CREATED_AT)}
                {e.changedByUser?.EMAIL && ` · ${e.changedByUser.EMAIL}`}
                {e.approvedByUser?.EMAIL && ` → ${e.approvedByUser.EMAIL}`}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function EnterpriseDetailPage({ enterpriseId }: { enterpriseId: number }) {
  const { t } = useTranslation();
  const { isArabic } = useLanguage();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const { canEdit, canViewDetail } = usePermission('enterprises');
  // Detail can be opened by anyone who can view the detail OR edit (mirrors the backend getById guard)
  const canOpenDetail = canViewDetail || canEdit;
  const { data, isLoading, isError, refetch } = useGetEnterpriseByIdQuery(enterpriseId, { skip: !canOpenDetail });

  if (!canOpenDetail) {
    return (
      <PageContainer>
        <button onClick={() => router.push('/enterprises')} className="mb-3 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          {isArabic ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />} {t('enterpriseDetail.allEnterprises')}
        </button>
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-8 text-center">
          <p className="text-sm text-slate-500">{t('admin.panel.accessDeniedDesc')}</p>
        </div>
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer>
        <PageLoader />
      </PageContainer>
    );
  }

  if (isError || !data?.data) {
    return (
      <PageContainer>
        <button onClick={() => router.push('/enterprises')} className="mb-3 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          {isArabic ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />} {t('enterpriseDetail.allEnterprises')}
        </button>
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <ErrorState onRetry={refetch} />
        </div>
      </PageContainer>
    );
  }

  // Default arrays to [] so a partial payload can't crash .map/.length on this page
  const { enterprise, establishments = [], secondaryActivities = [], changeHistory = [], profilingChanges = [] } = data.data;

  return (
    <PageContainer>
      {/* Back link */}
      <button onClick={() => router.push('/enterprises')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        {isArabic ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />} {t('enterpriseDetail.allEnterprises')}
      </button>

      {/* Header card */}
      <div className="overflow-hidden rounded-lg shadow-sm">
        <div className="bg-gradient-to-br from-[#7c1228] to-[#A71D3A] px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded bg-white/15 px-2 py-0.5 font-mono text-xs">
                  <Target className="h-3.5 w-3.5" /> ENT-{enterprise.ENTERPRISE_ID}
                </span>
                <StatusBadge status={enterprise.STATUS} className="rounded-md" />
                {enterprise.HAS_PENDING_REQUEST && <PendingBadge />}
              </div>
              <h1 className="mt-2 text-2xl font-bold">{nullableText(enterprise.NAME_ENU)}</h1>
              {enterprise.MAIN_CR && <p className="text-sm text-white/80">CR {enterprise.MAIN_CR}</p>}
            </div>
            {canEdit && (
              <Button onClick={() => setEditOpen(true)} className="shrink-0 bg-white text-[#A71D3A] hover:bg-white/90">
                <Pencil className="mr-1.5 h-4 w-4" /> {t('actions.edit')}
              </Button>
            )}
          </div>
        </div>
        {/* Summary strip */}
        <div className="grid grid-cols-2 gap-4 border border-t-0 border-slate-200 bg-white px-6 py-4 md:grid-cols-3 lg:grid-cols-6">
          <SummaryCell label={t('enterpriseDetail.sector')} value={nullableText(enterprise.SECTOR_ID)} />
          <SummaryCell label={t('enterpriseDetail.status')} value={nullableText(enterprise.STATUS)} />
          <SummaryCell label={t('enterpriseDetail.legalType')} value={nullableText(enterprise.LEGAL_TYPE)} />
          <SummaryCell label={t('enterpriseDetail.mainUnit')} value={enterprise.MAIN_ESTABLISHMENT_SBR_ID != null ? <span className="font-mono">#{enterprise.MAIN_ESTABLISHMENT_SBR_ID}</span> : '—'} />
          <SummaryCell label={t('enterpriseDetail.linkedEstablishments')} value={enterprise.ESTABLISHMENT_COUNT} />
          <SummaryCell label={t('enterpriseDetail.validFrom')} value={formatDate(enterprise.VALID_FROM)} />
        </div>
      </div>

      {enterprise.HAS_PENDING_REQUEST && <PendingApprovalBanner />}

      {/* Economic activity — full width */}
      <SectionCard title={t('enterpriseDetail.economicActivity')} icon={<Briefcase className="h-4 w-4" />}>
            <div className="flex flex-col gap-6 md:flex-row md:gap-10">
              <div className="w-full md:max-w-md">
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">{t('enterpriseDetail.mainActivity')}</p>
                {enterprise.ISIC_CODE ? (
                  <div className="rounded-md bg-[#A71D3A]/5 p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-semibold text-slate-800">{enterprise.ISIC_CODE}</span>
                      <span className="rounded bg-[#A71D3A]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#A71D3A]">PRIMARY</span>
                    </div>
                    {getIsicLabel(enterprise.ISIC_CODE) && (
                      <p className="mt-1.5 text-sm text-slate-600">{getIsicLabel(enterprise.ISIC_CODE)}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">—</p>
                )}
              </div>
              <div className="flex-1">
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">{t('enterpriseDetail.secondaryActivities')}</p>
                {secondaryActivities.length ? (
                  <div className="flex flex-wrap gap-2">
                    {secondaryActivities.map((s, i) => (
                      <IsicChip key={i} code={s.ISIC_CODE} fromText={`${t('enterpriseDetail.from')} #${s.FROM_SBR_ID}`} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">—</p>
                )}
              </div>
            </div>
      </SectionCard>

      {/* Linked establishments + rail */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-4 lg:col-span-2">
          {/* Linked establishments */}
          <SectionCard title={t('enterpriseDetail.linkedEstablishments')} count={establishments.length} icon={<Building2 className="h-4 w-4" />}>
            <div className="space-y-3">
              {establishments.map((est) => (
                <EstablishmentCard
                  key={est.ID}
                  est={est}
                  headSbrId={enterprise.MAIN_ESTABLISHMENT_SBR_ID}
                  t={t}
                  onOpen={(e) => router.push(`/establishments?search=${encodeURIComponent(e.NAME_ENU ?? String(e.SBR_ID))}`)}
                />
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <SectionCard title={t('enterpriseDetail.profilingChanges')} count={profilingChanges.length} icon={<GitBranch className="h-4 w-4" />}>
            <p className="text-xs text-slate-500">{t('enterpriseDetail.profilingDesc')}</p>
            {profilingChanges.length > 0
              ? <ProfilingChangesList entries={profilingChanges} />
              : <p className="mt-2 text-sm text-slate-400">{t('enterpriseDetail.noProfilingChanges')}</p>}
          </SectionCard>

          <SectionCard title={t('enterpriseDetail.changeHistory')} count={changeHistory.length} icon={<ClipboardList className="h-4 w-4" />}>
            <ChangeHistoryList entries={changeHistory} />
          </SectionCard>
        </div>
      </div>

      <EditEnterpriseModal
        enterprise={enterprise}
        establishments={establishments}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </PageContainer>
  );
}
