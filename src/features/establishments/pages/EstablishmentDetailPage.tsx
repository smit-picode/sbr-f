'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/common/PageContainer';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PendingBadge } from '@/components/common/PendingBadge';
import { PendingApprovalBanner } from '@/components/common/PendingApprovalBanner';
import { PendingFieldBadge } from '@/components/common/PendingFieldBadge';
import { PageLoader } from '@/components/common/Loader';
import { ErrorState } from '@/components/common/ErrorState';
import { EditEstablishmentModal } from '../components/EditEstablishmentModal';
import { useGetEstablishmentByIdQuery, useGetEstablishmentHistoryQuery } from '../api/establishmentsApi';
import { FieldHistoryPopover } from '@/components/common/FieldHistoryPopover';
import { formatDate } from '@/utils/format';
import { usePermission } from '@/hooks';
import { useLanguage } from '@/i18n';
import type { SbrEstablishment } from '@/types';
import { ChevronLeft, ChevronRight, Pencil, History, Orbit, Briefcase, Landmark, Users, GitBranch, Database, Table, ArrowRight, Activity } from 'lucide-react';

function isEmpty(v: unknown): boolean {
  return v === null || v === undefined || v === '';
}

// The legal units (regulator source records) that compose an establishment are derived from
// its own source identifiers — there is no separate legal-units table. Mirrors the source map.
const SRC_MAP: Record<string, { table: string; value: (e: SbrEstablishment) => string | null }> = {
  MOCI:     { table: 'MOCI_MV_ORG_DATA',     value: (e) => e.MOCI_CR_NUM || e.MOCI_ORG_ID },
  QFC:      { table: 'QFC_REGISTERED_FIRMS', value: (e) => e.QFC_NUMBER },
  QFZ:      { table: 'QFZ_SOURCE',           value: (e) => e.QFZ_SOURCE_ID },
  QSTP:     { table: 'QSTP_ESTB_DATA',       value: (e) => e.QSTP_REG_NUM },
  MOM_FARM: { table: 'QARS_FARM',            value: (e) => e.FARM_NO },
};
const SRC_COLOR: Record<string, string> = {
  MOCI: '#A71D3A', QFC: '#1a3a52', QFZ: '#2B7A9E', QSTP: '#B5742B', MOM_FARM: '#1F8A5B',
};

// Node colours cycled across the horizontal lifecycle timeline (oldest → newest).
const LIFECYCLE_DOT_COLORS: string[] = ['#A71D3A', '#B5742B', '#1a3a52', '#1F8A5B'];

type LegalUnit = { source: string; table: string; idValue: string; current: boolean };

interface FieldEntry {
  k: string;
  label: string;
  value: React.ReactNode;
  source: string | null;
  mono: boolean;
  show: boolean;
}

function DetailField({ recordId, fieldKey, label, value, source, mono, canViewHistory, pendingCount }: {
  recordId: number; fieldKey: string; label: string; value: React.ReactNode; source?: string | null; mono?: boolean; canViewHistory: boolean; pendingCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  // Lazily load the record's change history only while this attribute's popover is open
  const { data, isLoading, isError } = useGetEstablishmentHistoryQuery(recordId, { skip: !open });

  // Close the anchored popover on outside click (the clock button itself toggles)
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div className="relative min-w-0" ref={wrapRef}>
      <button
        type="button"
        onClick={canViewHistory ? () => setOpen((o) => !o) : undefined}
        disabled={!canViewHistory}
        className="group w-full min-w-0 text-start disabled:cursor-default"
      >
        <div className="flex items-center gap-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
          <PendingFieldBadge count={pendingCount} />
          {canViewHistory && <History className="ms-auto h-3 w-3 shrink-0 text-slate-200 transition-colors group-hover:text-[#A71D3A]" />}
        </div>
        <div className={`mt-0.5 text-sm font-semibold text-slate-800 ${mono ? 'break-all font-mono text-[12px]' : ''}`}>{value}</div>
        {!isEmpty(source) && <p className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-slate-400">· {source}</p>}
      </button>
      {open && (
        <FieldHistoryPopover
          versions={data?.data ?? []}
          fieldKey={fieldKey}
          fieldLabel={label}
          isLoading={isLoading}
          isError={isError}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-2.5">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{title}</h2>
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 p-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

type StripItem = { icon: React.ReactNode; label: string; value: React.ReactNode | null; fieldKey: string };

// Same click-to-history behaviour as DetailField, styled to match the highlight-strip cell.
function StripField({ recordId, fieldKey, label, value, icon, canViewHistory, pendingCount }: {
  recordId: number; fieldKey: string; label: string; value: React.ReactNode; icon: React.ReactNode; canViewHistory: boolean; pendingCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, isError } = useGetEstablishmentHistoryQuery(recordId, { skip: !open });

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div className="relative flex min-w-0 items-center gap-2.5" ref={wrapRef}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">{icon}</span>
      <button
        type="button"
        onClick={canViewHistory ? () => setOpen((o) => !o) : undefined}
        disabled={!canViewHistory}
        className="group min-w-0 text-start disabled:cursor-default"
      >
        <div className="flex items-center gap-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
          <PendingFieldBadge count={pendingCount} />
          {canViewHistory && <History className="h-3 w-3 shrink-0 text-slate-200 transition-colors group-hover:text-[#A71D3A]" />}
        </div>
        <div className="truncate text-sm font-bold text-slate-800">{value}</div>
      </button>
      {open && (
        <FieldHistoryPopover
          versions={data?.data ?? []}
          fieldKey={fieldKey}
          fieldLabel={label}
          isLoading={isLoading}
          isError={isError}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function HighlightStrip({ recordId, items, canViewHistory, pendingFields }: {
  recordId: number; items: StripItem[]; canViewHistory: boolean; pendingFields: Record<string, number | undefined>;
}) {
  const visible = items.filter((i) => !isEmpty(i.value));
  if (!visible.length) return null;
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-3 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
      {visible.map((it) => (
        <StripField
          key={it.fieldKey}
          recordId={recordId}
          fieldKey={it.fieldKey}
          label={it.label}
          value={it.value}
          icon={it.icon}
          canViewHistory={canViewHistory}
          pendingCount={pendingFields[it.fieldKey]}
        />
      ))}
    </div>
  );
}

// Header maroon-band name field — same click-to-history behaviour, white-tinted icon for the dark band.
function HeaderNameField({ recordId, fieldKey, label, children, canViewHistory, pendingCount }: {
  recordId: number; fieldKey: string; label: string; children: React.ReactNode; canViewHistory: boolean; pendingCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, isError } = useGetEstablishmentHistoryQuery(recordId, { skip: !open });

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div className="relative min-w-0" ref={wrapRef}>
      <button
        type="button"
        onClick={canViewHistory ? () => setOpen((o) => !o) : undefined}
        disabled={!canViewHistory}
        className="group flex min-w-0 items-center gap-1.5 text-start disabled:cursor-default"
      >
        {children}
        <PendingFieldBadge count={pendingCount} />
        {canViewHistory && <History className="h-3.5 w-3.5 shrink-0 text-white/30 transition-colors group-hover:text-white" />}
      </button>
      {open && (
        <FieldHistoryPopover
          versions={data?.data ?? []}
          fieldKey={fieldKey}
          fieldLabel={label}
          isLoading={isLoading}
          isError={isError}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

export function EstablishmentDetailPage({ sbrId }: { sbrId: number }) {
  const { t } = useTranslation();
  const { isArabic } = useLanguage();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const { canEdit, canViewDetail, canViewHistory } = usePermission('establishments');
  const canOpenDetail = canViewDetail || canEdit;
  const { data, isLoading, isError, refetch } = useGetEstablishmentByIdQuery(sbrId, { skip: !canOpenDetail });

  const BackLink = (
    <button onClick={() => router.push('/establishments')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
      {isArabic ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />} {t('establishmentDetail.allEstablishments')}
    </button>
  );

  if (!canOpenDetail) {
    return (
      <PageContainer>
        <div className="mb-3">{BackLink}</div>
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
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
        <div className="mb-3">{BackLink}</div>
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <ErrorState onRetry={refetch} />
        </div>
      </PageContainer>
    );
  }

  const e = data.data;
  const pendingFields = e.PENDING_FIELDS ?? {};
  const title = e.NAME_ENU || e.NPC_NAME_ENU || `Establishment #${e.SBR_ID}`;

  // Legal units composing this establishment — derived from its source identifiers.
  const legalUnits: LegalUnit[] = (() => {
    const sc = e.SOURCE_CODE || 'MOCI';
    const m = SRC_MAP[sc] ?? SRC_MAP.MOCI;
    const idValue = m.value(e);
    if (isEmpty(idValue)) return [];
    return [{ source: sc, table: m.table, idValue: String(idValue), current: isEmpty(e.VALID_TO) }];
  })();

  // Lifecycle events — synthesised from this establishment's own register / permit dates.
  const lifecycleEvents = [
    { title: 'Entered register', date: e.VALID_FROM },
    { title: 'Commercial registration issued', date: e.CR_ISSUE_DATE },
    { title: 'Commercial permit issued', date: e.CP_ISSUE_DATE },
    { title: 'Registration issued', date: e.REG_DATE },
  ]
    .filter((ev) => !isEmpty(ev.date))
    .sort((a, b) => new Date(a.date as string).getTime() - new Date(b.date as string).getTime());

  // Field builder — hides empty values, attaches the source sub-label and history key.
  const F = (
    k: keyof SbrEstablishment,
    label: string,
    o: { source?: keyof SbrEstablishment; mono?: boolean; date?: boolean; node?: React.ReactNode } = {},
  ): FieldEntry => {
    const raw = e[k];
    const value: React.ReactNode = o.node !== undefined
      ? o.node
      : o.date
        ? formatDate(raw as string | null)
        : String(raw ?? '');
    return { k: k as string, label, value, source: o.source ? (e[o.source] as string | null) : null, mono: !!o.mono, show: !isEmpty(raw) };
  };

  // Field labels + section titles are localized via establishmentDetail.fields.* / .sections.*
  // (English fallback text matches what was previously hardcoded here).
  const fl = (k: string, fallback: string) => t(`establishmentDetail.fields.${k}`, { defaultValue: fallback });
  const sl = (k: string, fallback: string) => t(`establishmentDetail.sections.${k}`, { defaultValue: fallback });

  const identity = [
    F('SBR_ID', fl('SBR_ID', 'SBR ID'), { mono: true }),
    F('SOURCE_CODE', fl('SOURCE_CODE', 'Source'), { mono: true }),
    F('EID', fl('EID', 'EID'), { source: 'EID_SOURCE', mono: true }),
  ].filter((f) => f.show);

  const names = [
    F('NAME_ENU', fl('NAME_ENU', 'Name (EN)'), { source: 'NAME_ENU_SOURCE' }),
    F('NAME_ARA', fl('NAME_ARA', 'Name (AR)'), { source: 'NAME_ARA_SOURCE' }),
    F('TRADE_NAME_ENU', fl('TRADE_NAME_ENU', 'Trade Name'), { source: 'TRADE_NAME_ENU_SOURCE' }),
    F('NPC_NAME_ENU', fl('NPC_NAME_ENU', 'NPC Name'), { source: 'NPC_NAME_ENU_SOURCE' }),
  ].filter((f) => f.show);

  const statusClass = [
    F('EST_STATUS', fl('EST_STATUS', 'Status'), { source: 'EST_STATUS_SOURCE', node: <StatusBadge status={e.EST_STATUS} /> }),
    F('EST_STATUS_CATEGORY', fl('EST_STATUS_CATEGORY', 'Status Category'), { source: 'EST_STATUS_CATEGORY_SOURCE' }),
    F('LEGAL_TYPE', fl('LEGAL_TYPE', 'Legal Type'), { source: 'LEGAL_TYPE_SOURCE' }),
    F('SECTOR_ID', fl('SECTOR_ID', 'Sector'), { source: 'SECTOR_ID_SOURCE' }),
    F('ISIC_CODE', fl('ISIC_CODE', 'ISIC Code'), { source: 'ISIC_CODE_SOURCE', mono: true }),
    F('EMPLOYMENT_COUNT', fl('EMPLOYMENT_COUNT', 'Employees'), { source: 'EMPLOYMENT_COUNT_SOURCE' }),
    F('MAIN_BRANCH_FLG', fl('MAIN_BRANCH_FLG', 'Main / Branch'), { source: 'MAIN_BRANCH_FLG_SOURCE' }),
    F('HOLDING_COMPANY_FLG', fl('HOLDING_COMPANY_FLG', 'Holding Co.'), { source: 'HOLDING_COMPANY_FLG_SOURCE' }),
  ].filter((f) => f.show);

  const registration = [
    F('MOCI_ORG_ID', fl('MOCI_ORG_ID', 'MOCI Org ID'), { mono: true }),
    F('MOCI_CR_NUM', fl('MOCI_CR_NUM', 'MOCI CR'), { mono: true }),
    F('MOCI_CP_NUM', fl('MOCI_CP_NUM', 'MOCI CP'), { mono: true }),
    F('QFC_NUMBER', fl('QFC_NUMBER', 'QFC Number'), { mono: true }),
    F('QFZ_SOURCE_ID', fl('QFZ_SOURCE_ID', 'QFZ Source ID'), { mono: true }),
    F('QSTP_REG_NUM', fl('QSTP_REG_NUM', 'QSTP Reg'), { mono: true }),
    F('FARM_NO', fl('FARM_NO', 'Farm No'), { mono: true }),
  ].filter((f) => f.show);

  const dates = [
    F('CR_ISSUE_DATE', fl('CR_ISSUE_DATE', 'CR Issue'), { date: true }),
    F('CR_EXPIRY_DATE', fl('CR_EXPIRY_DATE', 'CR Expiry'), { date: true }),
    F('CP_ISSUE_DATE', fl('CP_ISSUE_DATE', 'CP Issue'), { date: true }),
    F('REG_DATE', fl('REG_DATE', 'Reg Date'), { date: true }),
    F('VALID_FROM', fl('VALID_FROM', 'Valid From'), { date: true }),
  ].filter((f) => f.show);

  const renderCard = (titleKey: string, fields: FieldEntry[]) =>
    fields.length > 0 && (
      <DetailCard title={titleKey}>
        {fields.map((f) => (
          <DetailField
            key={f.k}
            recordId={sbrId}
            fieldKey={f.k}
            label={f.label}
            value={f.value}
            source={f.source}
            mono={f.mono}
            canViewHistory={canViewHistory}
            pendingCount={pendingFields[f.k]}
          />
        ))}
      </DetailCard>
    );

  return (
    <PageContainer>
      {BackLink}

      {/* Header band — rounded directly (no overflow-hidden wrapper) so the attribute-history
          popover on the name fields can render outside the band instead of being clipped. */}
      <div>
        <div className="rounded-lg bg-gradient-to-br from-[#7c1228] to-[#A71D3A] px-6 py-5 text-white shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded bg-white/15 px-2 py-0.5 font-mono text-xs">SBR #{e.SBR_ID}</span>
                {e.EST_STATUS && <StatusBadge status={e.EST_STATUS} className="rounded-md" />}
                {e.HAS_PENDING_REQUEST && <PendingBadge />}
              </div>
              {e.NAME_ENU ? (
                <HeaderNameField
                  recordId={sbrId}
                  fieldKey="NAME_ENU"
                  label={fl('NAME_ENU', 'Name (EN)')}
                  canViewHistory={canViewHistory}
                  pendingCount={pendingFields.NAME_ENU}
                >
                  <h1 className="mt-2 truncate text-2xl font-bold">{title}</h1>
                </HeaderNameField>
              ) : (
                <h1 className="mt-2 truncate text-2xl font-bold">{title}</h1>
              )}
              {e.NAME_ARA && (
                <HeaderNameField
                  recordId={sbrId}
                  fieldKey="NAME_ARA"
                  label={fl('NAME_ARA', 'Name (AR)')}
                  canViewHistory={canViewHistory}
                  pendingCount={pendingFields.NAME_ARA}
                >
                  <p className="truncate text-sm text-white/80">{e.NAME_ARA}</p>
                </HeaderNameField>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" onClick={() => router.push(e.ASSOCIATED_ENTERPRISE_ID ? `/enterprises/${e.ASSOCIATED_ENTERPRISE_ID}` : '/enterprises')} className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                <Orbit className="mr-1.5 h-4 w-4" /> {t('establishmentDetail.viewIn360')}
              </Button>
              {canEdit && (
                <Button onClick={() => setEditOpen(true)} className="bg-white text-[#A71D3A] hover:bg-white/90">
                  <Pencil className="mr-1.5 h-4 w-4" /> {t('actions.edit')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {e.HAS_PENDING_REQUEST && <PendingApprovalBanner />}

      {canViewHistory && (
        <p className="flex items-center gap-1.5 text-xs text-slate-400">
          <History className="h-3.5 w-3.5 text-[#A71D3A]" /> {t('fieldHistory.clickHint')}
        </p>
      )}

      <HighlightStrip
        recordId={sbrId}
        canViewHistory={canViewHistory}
        pendingFields={pendingFields}
        items={[
          { fieldKey: 'SECTOR_ID', icon: <Briefcase className="h-4 w-4" />, label: fl('SECTOR_ID', 'Sector'), value: e.SECTOR_ID },
          { fieldKey: 'LEGAL_TYPE', icon: <Landmark className="h-4 w-4" />, label: fl('LEGAL_TYPE', 'Legal Type'), value: e.LEGAL_TYPE },
          { fieldKey: 'EMPLOYMENT_COUNT', icon: <Users className="h-4 w-4" />, label: fl('EMPLOYMENT_COUNT', 'Employees'), value: e.EMPLOYMENT_COUNT != null ? String(e.EMPLOYMENT_COUNT) : null },
          { fieldKey: 'MAIN_BRANCH_FLG', icon: <GitBranch className="h-4 w-4" />, label: fl('MAIN_BRANCH_FLG', 'Main / Branch'), value: e.MAIN_BRANCH_FLG },
          { fieldKey: 'SOURCE_CODE', icon: <Database className="h-4 w-4" />, label: fl('SOURCE_CODE', 'Source'), value: e.SOURCE_CODE },
        ]}
      />

      {lifecycleEvents.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <Activity className="h-4 w-4 text-[#A71D3A]" />
            <h2 className="text-sm font-semibold text-slate-800">{t('establishmentDetail.lifecycleEvents')}</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{lifecycleEvents.length}</span>
          </div>
          <div className="p-4">
            <ol className="flex items-start">
              {lifecycleEvents.map((ev, i) => {
                const color = LIFECYCLE_DOT_COLORS[i % LIFECYCLE_DOT_COLORS.length];
                const isLast = i === lifecycleEvents.length - 1;
                return (
                  <li key={i} className="relative min-w-0 flex-1">
                    {/* Connecting rail from this node to the next (hidden on the last node) */}
                    {!isLast && (
                      <span className="absolute top-[5px] h-px w-full bg-slate-200 start-[5px]" />
                    )}
                    <span
                      className="relative z-10 block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <p className="mt-2 pe-4 text-sm font-medium" style={{ color }}>{ev.title}</p>
                    <p className="mt-0.5 pe-4 text-xs text-slate-400">{formatDate(ev.date)}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}

      {legalUnits.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <Table className="h-4 w-4 text-[#A71D3A]" />
            <h2 className="text-sm font-semibold text-slate-800">{t('establishmentDetail.composedOf')}</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{legalUnits.length}</span>
            <button
              type="button"
              onClick={() => router.push('/legal-units')}
              className="ms-auto inline-flex items-center gap-1 text-xs font-semibold text-[#A71D3A] hover:underline"
            >
              {t('establishmentDetail.viewInLegalUnits')} <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-2">
            {legalUnits.map((lu, i) => (
              <button
                key={i}
                type="button"
                onClick={() => router.push(`/legal-units?search=${encodeURIComponent(lu.idValue)}`)}
                className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors hover:border-[#A71D3A]/40 hover:bg-[#FCF4F6] ${lu.current ? 'border-slate-200' : 'border-slate-200 bg-slate-50/50'}`}
              >
                <span
                  className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold text-white"
                  style={{ background: SRC_COLOR[lu.source] ?? '#64748b' }}
                >
                  {lu.source}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mono text-[12px] font-semibold text-slate-700">{lu.idValue}</div>
                  <div className="truncate text-[10.5px] text-slate-400">{lu.table}</div>
                </div>
                {lu.current ? (
                  <span className="shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-700">
                    {t('establishmentDetail.current')}
                  </span>
                ) : (
                  <span className="shrink-0 text-[9.5px] font-bold uppercase tracking-wide text-slate-400">
                    {t('establishmentDetail.historical')}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          {renderCard(sl('identity', 'Identity'), identity)}
          {renderCard(sl('statusClassification', 'Status & Classification'), statusClass)}
          {renderCard(sl('dates', 'Dates'), dates)}
        </div>
        <div className="flex flex-col gap-4">
          {renderCard(sl('names', 'Names'), names)}
          {renderCard(sl('registration', 'Registration'), registration)}
        </div>
      </div>

      <EditEstablishmentModal frame={editOpen ? e : null} open={editOpen} onClose={() => setEditOpen(false)} />
    </PageContainer>
  );
}
