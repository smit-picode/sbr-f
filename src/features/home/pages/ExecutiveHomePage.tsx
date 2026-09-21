'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, ClipboardList, Landmark, Layers, TrendingUp } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppSelector, usePermission } from '@/hooks';
import { formatDate } from '@/utils/format';
import { EChart, columns, donut, hbars, hbarsStacked, pareto, qatarMap, registerQatarMap, trend } from '@/lib/charts';
import { useGetExecutiveSummaryQuery } from '../api/homeApi';
import { ExecStatCard } from '../components/ExecStatCard';
import { SegmentedToggle } from '../components/SegmentedToggle';
import { SECTOR_COLOR } from '../data/chartColors';
import {
  SOURCE_COLOR,
  SURVEY_KPIS,
  SURVEY_RESPONSE_BY_ACTIVITY,
  SURVEY_RESPONSE_BY_SURVEY,
} from '../data/executiveDashboardDummy';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type GrowthMode = 'total' | 'source' | 'sector';
type ResponseMode = 'survey' | 'activity';

function firstNameOf(email: string | undefined): string {
  if (!email) return 'Executive';
  const local = email.split('@')[0] ?? '';
  const first = local.split(/[._-]/)[0] || local;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-[13.5px] font-bold text-slate-800">{title}</h2>
      {sub && <p className="mt-0.5 text-[11px] text-slate-400">{sub}</p>}
    </div>
  );
}

export function ExecutiveHomePage() {
  const { t } = useTranslation();

  // KPI cards link into the matching list page, but only for a viewer who may open it — the
  // reference gates its cards the same way rather than routing to a page that would refuse them.
  const { canView: canViewEstablishments } = usePermission('establishments');
  const { canView: canViewEnterprises } = usePermission('enterprises');
  const user = useAppSelector((s) => s.auth.user);
  const [mapReady, setMapReady] = useState(false);
  const [growthMode, setGrowthMode] = useState<GrowthMode>('total');
  const [responseMode, setResponseMode] = useState<ResponseMode>('survey');

  useEffect(() => {
    registerQatarMap()
      .then(() => setMapReady(true))
      .catch(() => setMapReady(false));
  }, []);

  // Every section on this page now comes from sbr-backend's TEMPORARY raw-SQL
  // /home/executive-summary endpoint — see that controller's own comment for why it's temporary
  // (standing in until a real summary procedure exists). Three queries (size class,
  // register-size-by-month, growth %) come from the database side; the rest were written here
  // directly against the same tables/columns, since no queries were supplied for them yet.
  const { data: summaryRes, isLoading: summaryLoading } = useGetExecutiveSummaryQuery();
  const summary = summaryRes?.data;

  const firstName = firstNameOf(user?.email);
  const asOf = useMemo(() => formatDate(new Date().toISOString()), []);

  // "Total" is real (sbr-backend's REGISTER_GROWTH_BY_MONTH_SQL); "By regulator"/"By sector" have
  // no backend source yet (see executiveDashboardDummy.ts's own note) so they render illustrative
  // dummy history instead — the toggle itself matches the SBR-design reference exactly.
  const registerGrowthByMonth = summary?.registerGrowthByMonth ?? [];
  const registerGrowthBySource = summary?.registerGrowthBySource ?? [];
  const registerGrowthBySector = summary?.registerGrowthBySector ?? [];
  const growthOption = useMemo(() => {
    if (growthMode === 'total') {
      return trend({
        categories: registerGrowthByMonth.map((g) => `${MONTH_LABELS[g.month - 1] ?? g.month} ${g.year}`),
        series: [{ name: t('home.exec.establishments', { defaultValue: 'Establishments' }), data: registerGrowthByMonth.map((g) => g.count) }],
        yMin: 0,
      });
    }
    const rows = growthMode === 'source' ? registerGrowthBySource : registerGrowthBySector;
    const colorMap = growthMode === 'source' ? SOURCE_COLOR : SECTOR_COLOR;

    // One category per month present in the data, in the order the query returned them.
    const monthKeys: string[] = [];
    rows.forEach((r) => {
      const key = `${r.year}-${r.month}`;
      if (!monthKeys.includes(key)) monthKeys.push(key);
    });

    // Series ordered by their size in the latest month, so the legend leads with the biggest.
    // A regulator or sector that existed earlier but has no row in the latest month is appended
    // rather than dropped, otherwise its earlier points would vanish from the chart entirely.
    const latest = monthKeys[monthKeys.length - 1];
    const latestCounts: Record<string, number> = {};
    rows.filter((r) => `${r.year}-${r.month}` === latest).forEach((r) => {
      latestCounts[r.dimension ?? '—'] = r.count;
    });
    const keys = Object.keys(latestCounts).sort((a, b) => (latestCounts[b] || 0) - (latestCounts[a] || 0));
    rows.forEach((r) => {
      const key = r.dimension ?? '—';
      if (!keys.includes(key)) keys.push(key);
    });

    const counts = new Map(rows.map((r) => [`${r.dimension ?? '—'}|${r.year}-${r.month}`, r.count]));

    return trend({
      categories: monthKeys.map((key) => {
        const [year, month] = key.split('-').map(Number);
        return `${MONTH_LABELS[month - 1] ?? month} ${year}`;
      }),
      series: keys.map((k) => ({
        name: k === '—' ? t('sector.unknown', { defaultValue: 'Unknown' }) : k,
        color: colorMap[k] || '#94A3B8',
        data: monthKeys.map((mk) => counts.get(`${k}|${mk}`) ?? null),
      })),
      yMin: 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [growthMode, registerGrowthByMonth, registerGrowthBySource, registerGrowthBySector, t]);

  const sizeClass = summary?.sizeClass ?? [];
  const sizeClassOption = useMemo(
    () =>
      columns({
        categories: sizeClass.map((s) => s.category ?? t('home.exec.sizeUnrecorded', { defaultValue: 'Unrecorded' })),
        series: [{ name: t('home.exec.establishments', { defaultValue: 'Establishments' }), data: sizeClass.map((s) => s.count) }],
        gradient: true,
        labels: true,
        right: 26,
        xFontSize: 10,
        greyIndex: sizeClass.findIndex((s) => s.category == null),
      }),
    [sizeClass, t]
  );

  const sectorLabel = (sector: string | null) => sector ?? t('sector.unknown', { defaultValue: 'Unknown' });
  const sectorColorOf = (sector: string | null) => SECTOR_COLOR[sector ?? '—'] ?? '#94A3B8';

  const sectorBreakdown = summary?.sectorBreakdown ?? [];
  const sectorDonutOption = useMemo(
    () =>
      donut({
        items: sectorBreakdown.map((s) => ({ name: sectorLabel(s.sector), value: s.count, color: sectorColorOf(s.sector) })),
        totalLabel: t('home.exec.establishments', { defaultValue: 'Establishments' }),
        legendWidth: 96,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sectorBreakdown, t]
  );

  const employmentByActivity = summary?.employmentByActivity ?? [];
  const paretoOption = useMemo(
    () =>
      pareto({
        items: employmentByActivity.map((e) => ({ name: e.section, value: e.employees })),
        valueLabel: t('home.exec.employees', { defaultValue: 'Employees' }),
        cumLabel: t('home.exec.cumShare', { defaultValue: 'Cumulative share' }),
        rotate: 30,
        labelWidth: 96,
      }),
    [employmentByActivity, t]
  );

  const sourceSectorBreakdown = summary?.sourceSectorBreakdown ?? [];
  const contributionOption = useMemo(() => {
    const sources = [...new Set(sourceSectorBreakdown.map((s) => s.source ?? '—'))];
    const sectors = [...new Set(sourceSectorBreakdown.map((s) => s.sector))];
    return hbarsStacked({
      categories: sources,
      series: sectors.map((sec) => ({
        name: sectorLabel(sec),
        color: sectorColorOf(sec),
        data: sources.map((src) => sourceSectorBreakdown.find((s) => (s.source ?? '—') === src && s.sector === sec)?.count ?? 0),
      })),
      barWidth: 14,
      labelWidth: 70,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceSectorBreakdown, t]);

  const municipalityBreakdown = summary?.municipalityBreakdown ?? [];
  const mapOption = useMemo(
    () =>
      qatarMap({
        byMunicipality: Object.fromEntries(municipalityBreakdown.map((m) => [m.municipality, m.count])),
        unitLabel: t('home.exec.establishments', { defaultValue: 'establishments' }).toLowerCase(),
      }),
    [municipalityBreakdown, t]
  );

  // No survey data exists anywhere yet (confirmed by the database side) — this whole section is
  // illustrative dummy data, kept only so the page still matches the SBR-design reference.
  const surveyResponseOption = useMemo(() => {
    if (responseMode === 'survey') {
      return hbars({
        items: SURVEY_RESPONSE_BY_SURVEY.map((s) => ({
          name: s.name,
          value: s.ratePct,
          color: s.ratePct >= 90 ? '#3FB185' : s.ratePct >= 80 ? '#BF9F5F' : '#DF7878',
          sub: `${s.sampledUnits.toLocaleString()} ${t('survey.sampledUnits', { defaultValue: 'sampled units' }).toLowerCase()}`,
        })),
        share: false,
        unit: '%',
        max: 100,
        barWidth: 13,
        labelWidth: 78,
        refLines: [{ value: 90, label: `${t('home.exec.target', { defaultValue: 'target' })} 90%`, color: '#A29374' }],
      });
    }
    return hbars({
      items: SURVEY_RESPONSE_BY_ACTIVITY.map((s) => ({
        name: s.name,
        value: s.ratePct,
        color: s.ratePct >= 90 ? '#3FB185' : s.ratePct >= 80 ? '#BF9F5F' : '#DF7878',
        sub: `${s.answered}/${s.base} ${t('survey.sampledUnitsShort', { defaultValue: 'responses' })}`,
      })),
      share: false,
      unit: '%',
      max: 100,
      barWidth: 10,
      labelWidth: 118,
      refLines: [{ value: 90, label: `${t('home.exec.target', { defaultValue: 'target' })} 90%`, color: '#A29374' }],
    });
  }, [responseMode, t]);

  const top3Employment = employmentByActivity.slice(0, 3);
  const totalEmployment = employmentByActivity.reduce((s, e) => s + e.employees, 0);
  const top3Pct = totalEmployment === 0 ? 0 : Math.round((top3Employment.reduce((s, e) => s + e.employees, 0) / totalEmployment) * 100);
  const unknownSize = sizeClass.find((s) => s.category == null)?.count ?? 0;
  const totalSize = summary?.totalEstablishmentCount ?? sizeClass.reduce((s, c) => s + c.count, 0);
  const activeEstablishmentCount = summary?.activeEstablishmentCount ?? 0;
  const growthPct = summary?.growthPct;
  const growthLabel = growthPct == null ? '—' : `${growthPct > 0 ? '+' : ''}${growthPct}%`;

  return (
    <PageContainer>
      <PageHeader
        title={t('home.exec.greeting', { defaultValue: 'Welcome' }) + ', ' + firstName}
        description={t('home.exec.subtitle', { defaultValue: 'Management view of the register — composition, growth, and survey coverage.' })}
        chips={
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold text-white">
            <Landmark className="h-3 w-3" />
            {t('home.exec.badge', { defaultValue: 'Executive' })}
          </span>
        }
        actions={
          <div className="text-end">
            <div className="text-[11px] text-white/70">{t('home.exec.asOf', { defaultValue: 'As of' })}</div>
            <div className="text-[13px] font-semibold text-white">{asOf}</div>
          </div>
        }
      />

      {/* headline KPI band — first three wired to the real endpoint; Survey samples is dummy
          (no survey data exists yet), kept only to match the SBR-design reference. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ExecStatCard
          icon={Building2}
          value={summaryLoading ? '—' : activeEstablishmentCount.toLocaleString()}
          label={t('home.exec.activeEst', { defaultValue: 'Active establishments' })}
          sub={t('home.exec.totalInFrame2', { defaultValue: '{{active}} is active from {{total}} total in the live frame', active: activeEstablishmentCount, total: totalSize })}
          href={canViewEstablishments ? '/establishments?estStatus=Active' : undefined}
        />
        <ExecStatCard
          icon={Layers}
          value={summaryLoading ? '—' : (summary?.enterpriseCount ?? 0).toLocaleString()}
          label={t('home.mgr.tEnterprises', { defaultValue: 'Enterprises' })}
          sub={t('home.exec.entGroups2', {
            defaultValue: '{{active}} is active ent. groups from total {{total}}',
            active: summary?.activeEnterpriseGroupCount ?? 0,
            total: summary?.enterpriseGroupCount ?? 0,
          })}
          href={canViewEnterprises ? '/enterprises?status=Active' : undefined}
        />
        <ExecStatCard
          icon={TrendingUp}
          value={summaryLoading ? '—' : growthLabel}
          label={t('home.exec.growthNew', { defaultValue: 'Frame growth' })}
          sub={t('home.exec.growthSub5', {
            defaultValue: 'newly registered establishments, last 3 months',
          })}
        />
        <ExecStatCard
          icon={ClipboardList}
          value={SURVEY_KPIS.samples.toLocaleString()}
          label={t('home.exec.samples', { defaultValue: 'Survey Samples (PLACEHOLDER)' })}
          sub={t('home.exec.avgResponse', { defaultValue: '{{pct}}% avg. response', pct: SURVEY_KPIS.avgResponsePct })}
        />
      </div>

      {/* growth trend + sector donut */}
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-5 shadow-card lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-[13.5px] font-bold text-slate-800">{t('home.exec.growth2', { defaultValue: 'Register size across frozen frames' })}</h2>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {growthMode === 'total'
                  ? t('home.exec.growth2Sub2', { defaultValue: 'Each point is a published frame; the last is the live register.' })
                  : t('home.exec.growthBreakdownSub2', { defaultValue: 'Active establishments at each month end, split by the selected dimension.' })}
              </p>
            </div>
            <SegmentedToggle<GrowthMode>
              value={growthMode}
              onChange={setGrowthMode}
              options={[
                { value: 'total', label: t('home.exec.viewTotal', { defaultValue: 'Total' }) },
                { value: 'source', label: t('home.exec.viewBySource', { defaultValue: 'By regulator' }) },
                { value: 'sector', label: t('home.exec.viewBySector', { defaultValue: 'By sector' }) },
              ]}
            />
          </div>
          {summaryLoading ? <Skeleton className="h-[224px] w-full rounded-lg" /> : <EChart option={growthOption} height={224} />}
        </div>
        <div className="rounded-lg bg-white p-5 shadow-card">
          <SectionHead title={t('home.mgr.estBySector', { defaultValue: 'Establishments by sector' })} sub={t('home.exec.shareOfFrame', { defaultValue: 'Share of the live frame' })} />
          {summaryLoading ? <Skeleton className="h-[224px] w-full rounded-lg" /> : <EChart option={sectorDonutOption} height={224} />}
        </div>
      </div>

      {/* map + size class + survey response (dummy — see executiveDashboardDummy.ts) */}
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-5 shadow-card">
          <SectionHead title={t('home.exec.map', { defaultValue: 'Where the establishments are' })} sub={t('home.exec.mapSub', { defaultValue: 'Establishments by municipality, from the primary address' })} />
          {mapReady && !summaryLoading ? <EChart option={mapOption} height={300} /> : <Skeleton className="h-[300px] w-full rounded-lg" />}
        </div>
        <div className="rounded-lg bg-white p-5 shadow-card">
          <SectionHead title={t('home.exec.sizeClass', { defaultValue: 'Establishments by size class' })} sub={t('home.exec.sizeClassSub', { defaultValue: 'NPC size classes — how the frame is stratified for sampling' })} />
          {summaryLoading ? (
            <Skeleton className="h-[244px] w-full rounded-lg" />
          ) : (
            <>
              <EChart option={sizeClassOption} height={244} />
              <p className="mt-1 text-[11px] text-slate-400">
                {t('home.exec.sizeNote', { defaultValue: '{{unknown}} of {{total}} units have no recorded size category.', unknown: unknownSize, total: totalSize })}
              </p>
            </>
          )}
        </div>
        <div className="rounded-lg bg-white p-5 shadow-card">
          <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[13.5px] font-bold text-slate-800">{t('home.exec.surveyResponse', { defaultValue: 'Survey response rates (PLACEHOLDER)' })}</h2>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {responseMode === 'survey'
                  ? t('home.exec.surveyResponseSub', { defaultValue: 'Across all periods of each survey' })
                  : t('home.exec.responseByActivitySub', { defaultValue: 'By economic activity section' })}
              </p>
            </div>
            <SegmentedToggle<ResponseMode>
              value={responseMode}
              onChange={setResponseMode}
              options={[
                { value: 'survey', label: t('home.exec.viewBySurvey', { defaultValue: 'By survey' }) },
                { value: 'activity', label: t('home.exec.viewByActivity', { defaultValue: 'By activity' }) },
              ]}
            />
          </div>
          <EChart option={surveyResponseOption} height={responseMode === 'survey' ? SURVEY_RESPONSE_BY_SURVEY.length * 34 + 44 : SURVEY_RESPONSE_BY_ACTIVITY.length * 30 + 44} />
        </div>
      </div>

      {/* employment concentration + source contribution */}
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-5 shadow-card lg:col-span-2">
          <SectionHead title={t('home.exec.concentration', { defaultValue: 'Where the jobs are' })} sub={t('home.exec.concentrationSub', { defaultValue: 'Recorded employment by economic activity, largest first, with cumulative share' })} />
          {summaryLoading ? (
            <Skeleton className="h-[268px] w-full rounded-lg" />
          ) : (
            <>
              <EChart option={paretoOption} height={268} />
              <p className="mt-1 text-[11px] text-slate-500">{t('home.exec.concentrationNote', { defaultValue: 'Three activity sections account for {{pct}}% of all recorded employment.', pct: top3Pct })}</p>
            </>
          )}
        </div>
        <div className="rounded-lg bg-white p-5 shadow-card">
          <SectionHead title={t('home.exec.contribution', { defaultValue: 'Who the register is assembled from' })} sub={t('home.exec.contributionSub', { defaultValue: 'Establishments by registration source, split by ownership sector' })} />
          {summaryLoading ? <Skeleton className="h-[220px] w-full rounded-lg" /> : <EChart option={contributionOption} height={Math.max(220, [...new Set(sourceSectorBreakdown.map((s) => s.source ?? '—'))].length * 34 + 60)} />}
        </div>
      </div>
    </PageContainer>
  );
}
