'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/common/PageContainer';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/common/Loader';
import { ErrorState } from '@/components/common/ErrorState';
import { useGetEnterpriseByIdQuery } from '../api/enterprisesApi';
import { getIsicLabel } from '../constants';
import { EstablishmentHistoryModal } from '../components/EstablishmentHistoryModal';
import { EditEnterpriseModal } from '../components/EditEnterpriseModal';
import type {
  EnterpriseEstablishment,
  EnterpriseChangeHistoryEntry,
  EnterpriseLifecycleEvent,
  SbrLegalUnit,
} from '@/types';
import { nullableText, formatDate } from '@/utils/format';
import { usePermission } from '@/hooks';
import { useLanguage } from '@/i18n';
import {
  ChevronLeft, ChevronRight, Target, Briefcase, Building2, Users, MapPin,
  Activity, GitBranch, ClipboardList, ArrowUpRight, History, Pencil,
} from 'lucide-react';

const MAROON = '#A71D3A';

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

function FieldWithHistory({ label, value, onHistory }: { label: string; value: React.ReactNode; onHistory: () => void }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-slate-500">{label}</p>
      <div className="mt-0.5 flex items-center gap-1 text-sm font-medium text-slate-800">
        <span className="truncate">{value}</span>
        <button type="button" onClick={onHistory} className="text-slate-300 transition-colors hover:text-[#A71D3A]" title="View history">
          <History className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function EstablishmentCard({ est, headSbrId, t, onOpen }: { est: EnterpriseEstablishment; headSbrId: number | null; t: (k: string, o?: { lng?: string }) => string; onOpen: (est: EnterpriseEstablishment) => void }) {
  const isMain = est.SBR_ID === headSbrId || est.MAIN_BRANCH_FLG === 'MAIN';
  const activitiesCount = est.ISIC_CODE ? 1 : 0;
  const [hist, setHist] = useState<{ key: keyof SbrLegalUnit; label: string } | null>(null);
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
          <FieldWithHistory label={t('enterpriseDetail.sector')} value={nullableText(est.SECTOR_ID)} onHistory={() => setHist({ key: 'SECTOR_ID', label: t('enterpriseDetail.sector') })} />
          <FieldWithHistory label={t('enterpriseDetail.legalType')} value={nullableText(est.LEGAL_TYPE)} onHistory={() => setHist({ key: 'LEGAL_TYPE', label: t('enterpriseDetail.legalType') })} />
          <FieldWithHistory label={t('enterpriseDetail.employees')} value={est.EMPLOYMENT_COUNT != null ? est.EMPLOYMENT_COUNT.toLocaleString() : '—'} onHistory={() => setHist({ key: 'EMPLOYMENT_COUNT', label: t('enterpriseDetail.employees') })} />
          <SummaryCell label={t('enterpriseDetail.activities')} value={activitiesCount} />
        </div>

        <EstablishmentHistoryModal
          sbrId={est.SBR_ID}
          field={hist?.key ?? null}
          fieldLabel={hist?.label ?? ''}
          name={est.NAME_ENU}
          open={!!hist}
          onClose={() => setHist(null)}
        />

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

function LifecycleTimeline({ events }: { events: EnterpriseLifecycleEvent[] }) {
  if (!events.length) return <p className="text-sm text-slate-400">—</p>;
  return (
    <ul className="space-y-3">
      {events.map((ev, i) => (
        <li key={i} className="relative pl-5">
          <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: MAROON }} />
          <p className="text-sm font-medium text-slate-800">{ev.TITLE}</p>
          <p className="text-xs text-slate-500">{formatDate(ev.DATE)} · {ev.REF}</p>
        </li>
      ))}
    </ul>
  );
}

function ChangeHistoryList({ entries }: { entries: EnterpriseChangeHistoryEntry[] }) {
  if (!entries.length) return <p className="text-sm text-slate-400">No change history recorded.</p>;
  return (
    <ul className="space-y-3">
      {entries.map((e) => {
        const approved = !!e.APPROVAL_DATE || !!e.approvedByUser;
        const recordId = e.NEW_RECORD_ID ?? e.PREV_RECORD_ID;
        return (
          <li key={e.ID} className="rounded-md border border-slate-100 p-2.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wide text-slate-500">{e.TABLE_NAME}</span>
              {recordId != null && <span className="font-mono text-xs font-medium text-red-600">#{recordId}</span>}
              <span className="ml-auto">
                {approved
                  ? <Badge variant="success" className="text-[10px]">Approved</Badge>
                  : <Badge variant="secondary" className="text-[10px]">{e.OPERATION}</Badge>}
              </span>
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

  const { enterprise, establishments, secondaryActivities, lifecycleEvents, changeHistory } = data.data;

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
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded bg-white/15 px-2 py-0.5 font-mono text-xs">
                  <Target className="h-3.5 w-3.5" /> ENT-{enterprise.ENTERPRISE_ID}
                </span>
                <StatusBadge status={enterprise.STATUS} className="rounded-md" />
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
          <SummaryCell label={t('enterpriseDetail.mainUnit')} value={enterprise.MAIN_LEGAL_UNIT_SBR_ID != null ? <span className="font-mono">#{enterprise.MAIN_LEGAL_UNIT_SBR_ID}</span> : '—'} />
          <SummaryCell label={t('enterpriseDetail.linkedEstablishments')} value={enterprise.ESTABLISHMENT_COUNT} />
          <SummaryCell label={t('enterpriseDetail.validFrom')} value={formatDate(enterprise.VALID_FROM)} />
        </div>
      </div>

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
                  headSbrId={enterprise.MAIN_LEGAL_UNIT_SBR_ID}
                  t={t}
                  onOpen={(e) => router.push(`/legal-units?search=${encodeURIComponent(e.NAME_ENU ?? String(e.SBR_ID))}`)}
                />
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <SectionCard title={t('enterpriseDetail.lifecycleEvents')} count={lifecycleEvents.length} icon={<Activity className="h-4 w-4" />}>
            <LifecycleTimeline events={lifecycleEvents} />
          </SectionCard>

          <SectionCard title={t('enterpriseDetail.profilingChanges')} count={0} icon={<GitBranch className="h-4 w-4" />}>
            <p className="text-xs text-slate-500">{t('enterpriseDetail.profilingDesc')}</p>
            <p className="mt-2 text-sm text-slate-400">{t('enterpriseDetail.noProfilingChanges')}</p>
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
