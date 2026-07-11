'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/common/PageContainer';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { useGetEnterpriseGroupByIdQuery } from '../api/enterpriseGroupsApi';
import { EditEnterpriseGroupModal } from '../components/EditEnterpriseGroupModal';
import { nullableText, formatDate } from '@/utils/format';
import { usePermission } from '@/hooks';
import type { EnterpriseGroupMember } from '@/types';
import {
  ChevronLeft, Pencil, ArrowUpRight, Orbit,
  GitFork, ShieldCheck, Activity, Info, Network,
} from 'lucide-react';

const MAROON = '#A71D3A';

function SectionCard({ title, icon, children, badge }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <span style={{ color: MAROON }}>{icon}</span>
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        {badge && <span className="ml-1">{badge}</span>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function ControlTree({ uci, group, members, onMemberClick, hint }: {
  uci: { name: string | null; type: string | null; country: string | null; id?: string | null };
  group: { groupId: string; name: string | null; type?: string | null; enterpriseCount?: number };
  members: { enterpriseId: number; name: string | null; isHead: boolean; estCount: number }[];
  onMemberClick?: (enterpriseId: number) => void;
  hint?: string;
}) {
  const [tooltip, setTooltip] = useState<{ title: string; lines: string[] } | null>(null);

  // Fixed node dimensions — generous to accommodate 2-line names
  const NODE_W = 260;
  const MEMBER_W = 160;
  const UCI_H   = 84;
  const GROUP_H = 73;
  const MEMBER_H = 88;
  const V_GAP   = 44;   // vertical space between rows (curve travel distance)
  const H_GAP   = 28;   // horizontal gap between sibling member nodes
  const PAD_X   = 64;   // left/right padding so curves don't clip

  const n = members.length;
  const totalMemberW = n > 0 ? n * MEMBER_W + (n - 1) * H_GAP : 0;
  const containerW = Math.max(NODE_W, totalMemberW) + PAD_X * 2;
  const cx = containerW / 2;

  const UCI_Y    = 0;
  const GROUP_Y  = UCI_Y + UCI_H + V_GAP;
  const MEMBER_Y = GROUP_Y + GROUP_H + V_GAP;
  const HINT_Y   = MEMBER_Y + MEMBER_H + 20;
  const containerH = HINT_Y + 20;

  const membersStartX = cx - totalMemberW / 2;
  const memberCenterXs = members.map((_, i) => membersStartX + i * (MEMBER_W + H_GAP) + MEMBER_W / 2);

  // Cubic bezier path with vertical tangents at both ends
  const bezier = (x1: number, y1: number, x2: number, y2: number): string => {
    const cp = (y2 - y1) * 0.55;
    return `M ${x1} ${y1} C ${x1} ${y1 + cp}, ${x2} ${y2 - cp}, ${x2} ${y2}`;
  };

  // Tooltip content builders
  const uciResidency = uci.country === 'Qatar' ? 'Resident' : uci.country ? 'Non-resident' : null;
  const uciTooltip = {
    title: uci.name ?? '—',
    lines: [
      uci.type ?? '',
      [uci.country, uciResidency].filter(Boolean).join(' · '),
      uci.id ?? '',
    ].filter(Boolean) as string[],
  };

  const groupTooltip = {
    title: group.name ?? '—',
    lines: [
      `Group ${group.groupId}`,
      group.type ?? '',
      group.enterpriseCount !== undefined ? `${group.enterpriseCount} Enterprises` : '',
    ].filter(Boolean) as string[],
  };

  const memberTooltip = (m: typeof members[0]) => ({
    title: m.name ?? '—',
    lines: [
      `ENT-${m.enterpriseId}`,
      m.estCount > 0 ? `${m.estCount} establishments` : '',
      m.isHead ? '★ Group head' : '',
    ].filter(Boolean) as string[],
  });

  return (
    <div className="relative select-none">
      {/* ── Hover tooltip — top-right corner of section, outside scroll area ── */}
      {tooltip && (
        <div
          className="absolute top-0 end-0 z-20 rounded-xl bg-slate-800 px-3 py-2.5 shadow-xl pointer-events-none"
          style={{ minWidth: 160, maxWidth: 220 }}
        >
          <p className="text-sm font-bold text-white leading-snug">{tooltip.title}</p>
          {tooltip.lines.map((line, i) => (
            <p key={i} className="text-xs text-slate-300 mt-0.5 leading-snug">{line}</p>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
      <div className="relative" style={{ width: containerW, height: containerH }}>

        {/* ── SVG curve layer ─────────────────────────────────── */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={containerW}
          height={containerH}
        >
          {/* UCI bottom → GROUP top */}
          <path
            d={bezier(cx, UCI_Y + UCI_H, cx, GROUP_Y)}
            fill="none" stroke="#CBD5E1" strokeWidth="1.5"
          />
          {/* GROUP bottom → each member top center */}
          {memberCenterXs.map((mx, i) => (
            <path
              key={i}
              d={bezier(cx, GROUP_Y + GROUP_H, mx, MEMBER_Y)}
              fill="none" stroke="#CBD5E1" strokeWidth="1.5"
            />
          ))}
        </svg>

        {/* ── UCI node ─────────────────────────────────────────── */}
        <div
          className="absolute rounded-2xl border border-[#A71D3A]/30 bg-[#FFF5F7] px-5 py-3 text-center"
          style={{ width: NODE_W, left: cx - NODE_W / 2, top: UCI_Y }}
          onMouseEnter={() => setTooltip(uciTooltip)}
          onMouseLeave={() => setTooltip(null)}
        >
          <p className="text-[10px] font-semibold text-[#A71D3A]/70 mb-0.5">
            UCI{uci.type ? ` · ${uci.type.toUpperCase()}` : ''}
          </p>
          <p className="text-sm font-bold text-slate-800 leading-snug">{nullableText(uci.name)}</p>
          {uci.country && <p className="text-xs text-slate-400 mt-1">{uci.country}</p>}
        </div>

        {/* ── GROUP node (solid maroon) ─────────────────────────── */}
        <div
          className="absolute rounded-2xl px-5 py-4 text-center"
          style={{
            width: NODE_W,
            left: cx - NODE_W / 2,
            top: GROUP_Y,
            background: 'linear-gradient(135deg, #A71D3A 0%, #6B1428 100%)',
          }}
          onMouseEnter={() => setTooltip(groupTooltip)}
          onMouseLeave={() => setTooltip(null)}
        >
          <p className="text-[11px] font-mono text-white/70 mb-1">{group.groupId}</p>
          <p className="text-sm font-bold text-white leading-snug">{nullableText(group.name)}</p>
        </div>

        {/* ── Member enterprise nodes ───────────────────────────── */}
        {members.map((m, i) => (
          <div
            key={i}
            onClick={() => onMemberClick?.(m.enterpriseId)}
            onMouseEnter={() => setTooltip(memberTooltip(m))}
            onMouseLeave={() => setTooltip(null)}
            className={`absolute rounded-xl border border-slate-200 px-3 py-2.5 text-center bg-white transition-all ${
              onMemberClick ? 'cursor-pointer hover:shadow-md hover:border-[#A71D3A]/50' : ''}`}
            style={{ width: MEMBER_W, left: membersStartX + i * (MEMBER_W + H_GAP), top: MEMBER_Y }}
          >
            <p className={`text-[10px] font-mono font-semibold ${m.isHead ? 'text-[#A71D3A]' : 'text-slate-400'}`}>
              ENT-{m.enterpriseId}{m.isHead ? ' ★' : ''}
            </p>
            <p className="text-xs font-semibold text-slate-700 leading-snug mt-0.5 line-clamp-2">
              {m.name ?? '—'}
            </p>
            {m.estCount > 0 && (
              <p className="text-[10px] text-slate-400 mt-0.5">{m.estCount} units</p>
            )}
          </div>
        ))}

        {/* ── Hint text ─────────────────────────────────────────── */}
        {n > 0 && (
          <p
            className="absolute text-xs text-slate-400 text-center"
            style={{ width: containerW, left: 0, top: HINT_Y }}
          >
            {hint}
          </p>
        )}
      </div>
      </div>
    </div>
  );
}

function MemberCard({ member, onClick, establishmentsLabel, groupHeadLabel }: {
  member: EnterpriseGroupMember;
  onClick?: () => void;
  establishmentsLabel: string;
  groupHeadLabel: string;
}) {
  const subtitleParts = [`ENT-${member.ENTERPRISE_ID}`];
  if (member.ESTABLISHMENT_COUNT > 0) subtitleParts.push(`${member.ESTABLISHMENT_COUNT} ${establishmentsLabel}`);
  if (member.SECTOR_ID) subtitleParts.push(member.SECTOR_ID);
  const subtitle = subtitleParts.join(' · ');

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
        onClick ? 'cursor-pointer hover:bg-slate-50' : ''
      } ${member.IS_GROUP_HEAD ? 'border-[#A71D3A]/30 bg-[#A71D3A]/5' : 'border-slate-200 bg-white'}`}
      onClick={onClick}
    >
      {/* Orbit icon — maroon bg for head enterprise, gray for others */}
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
        member.IS_GROUP_HEAD ? 'bg-[#A71D3A]' : 'bg-slate-100'
      }`}>
        <Orbit className={`h-5 w-5 ${member.IS_GROUP_HEAD ? 'text-white' : 'text-slate-400'}`} />
      </div>

      <div className="min-w-0 flex-1">
        {/* Name + GROUP HEAD badge on same line */}
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-slate-800 leading-snug">
            {nullableText(member.NAME_ENU)}
          </p>
          {member.IS_GROUP_HEAD && (
            <span className="inline-flex items-center rounded-md bg-[#A71D3A] px-2 py-0.5 text-[10px] font-bold text-white">
              {groupHeadLabel}
            </span>
          )}
        </div>
        {/* ENT-ID + Arabic name as subtitle */}
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>

      {/* Right: diagonal arrow only */}
      {onClick && <ArrowUpRight className="h-4 w-4 text-slate-400 shrink-0" />}
    </div>
  );
}

interface EnterpriseGroupDetailPageProps {
  groupId: number;
}

export function EnterpriseGroupDetailPage({ groupId }: EnterpriseGroupDetailPageProps) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const { t } = useTranslation();
  const { canEdit } = usePermission('enterprise_groups');

  const { data, isLoading, isError, refetch } = useGetEnterpriseGroupByIdQuery(groupId);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-80 w-full rounded-lg" />
              <Skeleton className="h-36 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (isError || !data?.data) {
    return (
      <PageContainer>
        <ErrorState onRetry={refetch} />
      </PageContainer>
    );
  }

  const { group, memberEnterprises, controlStructure } = data.data;

  // Derived values for Ownership & control section
  const headMember = memberEnterprises.find((m) => m.IS_GROUP_HEAD);
  const groupHeadId = headMember ? `ENT-${headMember.ENTERPRISE_ID}` : '—';
  const resident = group.UCI_COUNTRY === 'Qatar'
    ? t('enterpriseGroupDetail.resident', { defaultValue: 'Resident' })
    : group.UCI_COUNTRY
      ? t('enterpriseGroupDetail.nonResident', { defaultValue: 'Non-resident' })
      : '—';
  const foreignControlled = group.TYPE === 'Foreign-controlled'
    ? t('common.yes', { defaultValue: 'Yes' })
    : t('common.no', { defaultValue: 'No' });

  // Lifecycle events derived from group dates
  const lifecycleEvents: { label: string; date: string }[] = [];
  if (group.GROUP_START_DATE) {
    lifecycleEvents.push({
      label: t('enterpriseGroupDetail.groupFormed', { defaultValue: 'Group formed' }),
      date: formatDate(group.GROUP_START_DATE),
    });
  }

  return (
    <PageContainer>
      {/* Back link + hero header card — wrapped together so PageContainer gap-4 doesn't push them apart */}
      <div>
        <button
          onClick={() => router.push('/enterprise-groups')}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4"
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          {t('enterpriseGroupDetail.backLink', { defaultValue: 'Enterprise Groups' })}
        </button>

        {/* Hero header card: maroon top + white stats bar */}
        <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm mb-4">
        {/* Maroon band — badges + name only */}
        <div
          className="px-6 py-5 text-white"
          style={{ background: 'linear-gradient(135deg, #A71D3A 0%, #6B1428 100%)' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              {/* Badges row: GROUP_ID pill + status + type badges */}
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold font-mono text-white" style={{ background: '#C73050' }}>
                  <GitFork className="h-3 w-3" />
                  {group.GROUP_ID}
                </span>
                <StatusBadge status={group.STATUS} className="rounded-md" />
                {group.TYPE && group.TYPE !== 'Domestic' && (
                  <Badge className="rounded-md bg-white/15 text-white border border-white/30 text-[10px] font-semibold gap-1">
                    <Network className="h-3 w-3" />
                    {group.TYPE}
                  </Badge>
                )}
                {group.HOLDING_COMPANY_FLG === 'Yes' && (
                  <Badge className="rounded-md bg-white/15 text-white border border-white/30 text-[10px] font-semibold">
                    {t('enterpriseGroupDetail.holdingCompanyBadge', { defaultValue: 'Holding company' })}
                  </Badge>
                )}
              </div>
              {/* Names */}
              {group.NAME_ENU && (
                <p className="text-2xl font-bold text-white leading-tight">{group.NAME_ENU}</p>
              )}
              {group.NAME_ARA && (
                <p className="text-sm mt-0.5" style={{ color: 'rgba(255,190,200,0.80)' }}>
                  {group.NAME_ARA}
                </p>
              )}
            </div>

            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEdit(true)}
                className="shrink-0 bg-white border-white/60 text-[#A71D3A] hover:bg-white/90 gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" />
                {t('actions.edit', { defaultValue: 'Edit' })}
              </Button>
            )}
          </div>
        </div>

        {/* White stats bar — outside the maroon band */}
        <div className="bg-white px-6 py-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-3 border-t border-slate-100">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">{t('enterpriseGroupDetail.controllingInstitution', { defaultValue: 'Controlling institution (UCI)' })}</p>
            <p className="text-sm font-semibold text-slate-800">{nullableText(group.UCI_NAME)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">{t('enterpriseGroupDetail.uciType', { defaultValue: 'UCI type' })}</p>
            <p className="text-sm font-semibold text-slate-800">{nullableText(group.UCI_TYPE)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">{t('enterpriseGroupDetail.uciCountry', { defaultValue: 'UCI country' })}</p>
            <p className="text-sm font-semibold text-slate-800">{nullableText(group.UCI_COUNTRY)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">{t('enterpriseGroupDetail.principalActivity', { defaultValue: 'Principal activity' })}</p>
            <p className="text-sm font-semibold text-slate-800">
              {group.ISIC_CODE
                ? `${group.ISIC_CODE}${group.ISIC_DESCRIPTION ? ' · ' + group.ISIC_DESCRIPTION : ''}`
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">{t('enterpriseGroupDetail.enterprises', { defaultValue: 'Enterprises' })}</p>
            <p className="text-sm font-semibold text-slate-800">{group.ENTERPRISE_COUNT}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">{t('enterpriseGroupDetail.employees', { defaultValue: 'Employees' })}</p>
            <p className="text-sm font-semibold text-slate-800">{group.EMPLOYEE_COUNT.toLocaleString()}</p>
          </div>
        </div>
        </div>{/* end hero header card */}
      </div>{/* end back link + header wrapper */}

      {/* Control structure graph — full width */}
      <SectionCard
        title={t('enterpriseGroupDetail.controlStructure', { defaultValue: 'Control Structure' })}
        icon={<GitFork className="h-4 w-4" />}
      >
        <div className="overflow-x-auto">
          <ControlTree
            uci={controlStructure.uci}
            group={{ ...controlStructure.group, type: group.TYPE, enterpriseCount: group.ENTERPRISE_COUNT }}
            members={controlStructure.members.map((m) => ({
              ...m,
              estCount: memberEnterprises.find((e) => e.ENTERPRISE_ID === m.enterpriseId)?.ESTABLISHMENT_COUNT ?? 0,
            }))}
            onMemberClick={(enterpriseId) => router.push(`/enterprises/${enterpriseId}`)}
            hint={t('enterpriseGroupDetail.hoverHint', { defaultValue: 'Hover a node for details · click an enterprise to open it' })}
          />
        </div>
      </SectionCard>

      {/* Body: left main (2/3) + right sidebar (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left — main column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Member enterprises */}
          <SectionCard
            title={t('enterpriseGroupDetail.memberEnterprises', { defaultValue: 'Member enterprises' })}
            icon={<Orbit className="h-4 w-4" />}
            badge={
              <span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold px-1.5">
                {memberEnterprises.length}
              </span>
            }
          >
            {memberEnterprises.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">
                {t('enterpriseGroupDetail.noMemberEnterprises', { defaultValue: 'No member enterprises.' })}
              </p>
            ) : (
              <div className="space-y-2">
                {memberEnterprises.map((m) => (
                  <MemberCard
                    key={m.ID}
                    member={m}
                    onClick={() => router.push(`/enterprises/${m.ENTERPRISE_ID}`)}
                    establishmentsLabel={t('enterpriseGroupDetail.establishments', { defaultValue: 'establishments' })}
                    groupHeadLabel={t('enterpriseGroupDetail.groupHead', { defaultValue: 'GROUP HEAD' })}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          {/* Ownership & control */}
          <SectionCard
            title={t('enterpriseGroupDetail.ownershipControl', { defaultValue: 'Ownership & control' })}
            icon={<ShieldCheck className="h-4 w-4" />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
              {[
                { label: t('enterpriseGroupDetail.groupHeadEnterprise', { defaultValue: 'Group head enterprise' }), value: groupHeadId },
                { label: t('enterpriseGroupDetail.resident', { defaultValue: 'Resident' }), value: resident },
                { label: t('enterpriseGroupDetail.foreignControlled', { defaultValue: 'Foreign-controlled' }), value: foreignControlled },
                { label: t('enterpriseGroupDetail.type', { defaultValue: 'Type' }), value: group.TYPE || '—' },
                { label: t('enterpriseGroupDetail.holdingCompany', { defaultValue: 'Holding company' }), value: nullableText(group.HOLDING_COMPANY_FLG) },
                { label: t('enterpriseGroupDetail.uciType', { defaultValue: 'UCI type' }), value: nullableText(group.UCI_TYPE) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-slate-800">{value}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Overview panel */}
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <Info className="h-4 w-4 shrink-0" style={{ color: MAROON }} />
              <h2 className="text-sm font-semibold text-slate-800">
                {t('enterpriseGroupDetail.overview', { defaultValue: 'Overview' })}
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {[
                {
                  label: t('enterpriseGroupDetail.status', { defaultValue: 'Status' }),
                  value: <StatusBadge status={group.STATUS} className="rounded-md" />,
                },
                { label: t('enterpriseGroupDetail.type', { defaultValue: 'Type' }),           value: group.TYPE || '—' },
                { label: t('enterpriseGroupDetail.groupStart', { defaultValue: 'Group start' }),    value: formatDate(group.GROUP_START_DATE) },
                { label: t('enterpriseGroupDetail.enterprises', { defaultValue: 'Enterprises' }),    value: group.ENTERPRISE_COUNT },
                { label: t('enterpriseGroupDetail.allEstablishments', { defaultValue: 'Establishments' }), value: group.ESTABLISHMENT_COUNT },
                { label: t('enterpriseGroupDetail.employees', { defaultValue: 'Employees' }),      value: group.EMPLOYEE_COUNT.toLocaleString() },
                { label: t('enterpriseGroupDetail.sector', { defaultValue: 'Sector' }),         value: nullableText(group.SECTOR) },
                { label: t('enterpriseGroupDetail.dataSources', { defaultValue: 'Data sources' }),   value: nullableText(group.DATA_SOURCES) },
                { label: t('enterpriseGroupDetail.holdingCompany', { defaultValue: 'Holding company' }), value: nullableText(group.HOLDING_COMPANY_FLG) },
                {
                  label: t('enterpriseGroupDetail.isicCode', { defaultValue: 'ISIC code' }),
                  value: group.ISIC_CODE ? (
                    <span className="font-mono text-xs">{group.ISIC_CODE}</span>
                  ) : '—',
                },
                { label: t('enterpriseGroupDetail.uciId', { defaultValue: 'UCI ID' }),   value: nullableText(group.UCI_ID) },
                { label: t('enterpriseGroupDetail.created', { defaultValue: 'Created' }),  value: formatDate(group.CREATED_AT) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-4 py-2.5 gap-2">
                  <span className="text-xs text-slate-500 shrink-0">{label}</span>
                  <span className="text-xs font-semibold text-slate-800 text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lifecycle events */}
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <Activity className="h-4 w-4 shrink-0" style={{ color: MAROON }} />
              <h2 className="text-sm font-semibold text-slate-800">
                {t('enterpriseGroupDetail.lifecycleEvents', { defaultValue: 'Lifecycle events' })}
              </h2>
              <span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold px-1.5">
                {lifecycleEvents.length}
              </span>
            </div>
            <div className="p-4">
              {lifecycleEvents.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-3">
                  {t('enterpriseGroupDetail.noEvents', { defaultValue: 'No events recorded.' })}
                </p>
              ) : (
                <div className="space-y-3">
                  {lifecycleEvents.map((ev, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span
                        className="mt-1.5 h-2 w-2 rounded-full shrink-0"
                        style={{ background: MAROON }}
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{ev.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{ev.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {canEdit && (
        <EditEnterpriseGroupModal
          group={group}
          currentMembers={memberEnterprises}
          open={showEdit}
          onClose={() => setShowEdit(false)}
        />
      )}
    </PageContainer>
  );
}
