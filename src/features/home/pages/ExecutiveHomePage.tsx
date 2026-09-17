'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Landmark, Layers, TrendingUp, ClipboardList } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppSelector } from '@/hooks';
import { formatDate } from '@/utils/format';
import { EChart, columns, donut, hbars, hbarsStacked, pareto, qatarMap, registerQatarMap, trend } from '@/lib/charts';
import { ExecStatCard } from '../components/ExecStatCard';
import { SegmentedToggle } from '../components/SegmentedToggle';
import {
  BY_MUNICIPALITY,
  EMPLOYMENT_BY_ACTIVITY,
  EXEC_KPIS,
  REGISTER_GROWTH,
  SECTOR_BREAKDOWN,
  SECTOR_COLOR,
  SIZE_CLASSES,
  SOURCE_COLOR,
  SOURCE_SECTOR_BREAKDOWN,
  SURVEY_RESPONSE_BY_ACTIVITY,
  SURVEY_RESPONSE_BY_SURVEY,
} from '../data/executiveDashboardData';

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
  const user = useAppSelector((s) => s.auth.user);
  const [growthMode, setGrowthMode] = useState<GrowthMode>('total');
  const [responseMode, setResponseMode] = useState<ResponseMode>('survey');
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    registerQatarMap()
      .then(() => setMapReady(true))
      .catch(() => setMapReady(false));
  }, []);

  const firstName = firstNameOf(user?.email);
  const asOf = useMemo(() => formatDate(new Date().toISOString()), []);

  const growthCategories = REGISTER_GROWTH.map((g) => g.label);
  const growthOption = useMemo(() => {
    if (growthMode === 'total') {
      return trend({
        categories: growthCategories,
        series: [{ name: t('home.exec.establishments', { defaultValue: 'Establishments' }), data: REGISTER_GROWTH.map((g) => g.total) }],
        yMin: 0,
      });
    }
    const field = growthMode === 'source' ? 'bySource' : 'bySector';
    const colorMap = growthMode === 'source' ? SOURCE_COLOR : SECTOR_COLOR;
    const last = REGISTER_GROWTH[REGISTER_GROWTH.length - 1][field] as Record<string, number>;
    const keys = Object.keys(last).sort((a, b) => (last[b] || 0) - (last[a] || 0));
    return trend({
      categories: growthCategories,
      series: keys.map((k) => ({
        name: k,
        color: colorMap[k] || '#94A3B8',
        data: REGISTER_GROWTH.map((g) => (g[field] as Record<string, number>)[k] ?? null),
      })),
      yMin: 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [growthMode]);

  const sectorDonutOption = useMemo(
    () =>
      donut({
        items: SECTOR_BREAKDOWN.map((s) => ({ name: s.key === '—' ? t('sector.unknown', { defaultValue: 'Unknown' }) : s.key, value: s.count, color: SECTOR_COLOR[s.key] })),
        totalLabel: t('home.exec.establishments', { defaultValue: 'Establishments' }),
        legendWidth: 96,
      }),
    [t]
  );

  const sizeClassOption = useMemo(
    () =>
      columns({
        categories: SIZE_CLASSES.map((s) => `${t(`size.${s.key.toLowerCase()}`, { defaultValue: s.key })}\n${s.range}`),
        series: [{ name: t('home.exec.establishments', { defaultValue: 'Establishments' }), data: SIZE_CLASSES.map((s) => s.count) }],
        gradient: true,
        labels: true,
        right: 26,
        xFontSize: 10,
        greyIndex: SIZE_CLASSES.length - 1,
      }),
    [t]
  );

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

  const paretoOption = useMemo(
    () =>
      pareto({
        items: EMPLOYMENT_BY_ACTIVITY.map((e) => ({ name: e.name, value: e.employees })),
        valueLabel: t('home.exec.employees', { defaultValue: 'Employees' }),
        cumLabel: t('home.exec.cumShare', { defaultValue: 'Cumulative share' }),
        rotate: 30,
        labelWidth: 96,
      }),
    [t]
  );

  const contributionOption = useMemo(() => {
    const sectorKeys = SECTOR_BREAKDOWN.map((s) => s.key);
    return hbarsStacked({
      categories: SOURCE_SECTOR_BREAKDOWN.map((s) => s.source),
      series: sectorKeys.map((sec) => ({
        name: sec === '—' ? t('sector.unknown', { defaultValue: 'Unknown' }) : sec,
        color: SECTOR_COLOR[sec],
        data: SOURCE_SECTOR_BREAKDOWN.map((s) => (s.bySector as Record<string, number>)[sec] ?? 0),
      })),
      barWidth: 14,
      labelWidth: 70,
    });
  }, [t]);

  const mapOption = useMemo(() => qatarMap({ byMunicipality: BY_MUNICIPALITY, unitLabel: t('home.exec.establishments', { defaultValue: 'establishments' }).toLowerCase() }), [t]);

  const top3Employment = EMPLOYMENT_BY_ACTIVITY.slice().sort((a, b) => b.employees - a.employees).slice(0, 3);
  const totalEmployment = EMPLOYMENT_BY_ACTIVITY.reduce((s, e) => s + e.employees, 0);
  const top3Pct = Math.round((top3Employment.reduce((s, e) => s + e.employees, 0) / (totalEmployment || 1)) * 100);
  const unknownSize = SIZE_CLASSES.find((s) => s.key === 'Unknown')?.count ?? 0;
  const totalSize = SIZE_CLASSES.reduce((s, c) => s + c.count, 0);

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

      {/* headline KPI band */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ExecStatCard
          icon={Building2}
          value={EXEC_KPIS.activeEstablishments.toLocaleString()}
          label={t('home.exec.activeEst', { defaultValue: 'Active establishments' })}
          sub={t('home.exec.totalInFrame', { defaultValue: '{{count}} total in the live frame', count: EXEC_KPIS.totalInFrame })}
        />
        <ExecStatCard
          icon={Layers}
          value={EXEC_KPIS.enterprises.toLocaleString()}
          label={t('home.mgr.tEnterprises', { defaultValue: 'Enterprises' })}
          sub={t('home.exec.entGroups', { defaultValue: '{{count}} ent. groups', count: EXEC_KPIS.enterpriseGroups })}
        />
        <ExecStatCard
          icon={TrendingUp}
          value={`+${EXEC_KPIS.frameGrowthYtdPct}%`}
          label={t('home.exec.growth', { defaultValue: 'Frame growth (YTD)' })}
          sub={t('home.exec.growthSub', { defaultValue: 'change in establishments since the Dec 2025 frame' })}
        />
        <ExecStatCard
          icon={ClipboardList}
          value={EXEC_KPIS.surveySamples.toLocaleString()}
          label={t('home.exec.samples', { defaultValue: 'Survey samples' })}
          sub={t('home.exec.avgResponse', { defaultValue: '{{pct}}% avg. response', pct: EXEC_KPIS.avgResponsePct })}
        />
      </div>

      {/* growth trend + sector donut */}
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-5 shadow-card lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-[13.5px] font-bold text-slate-800">{t('home.exec.growth2', { defaultValue: 'Register size across frozen frames' })}</h2>
              <p className="mt-0.5 text-[11px] text-slate-400">{t('home.exec.growth2Sub', { defaultValue: 'Each point is a published frame; the last is the live register.' })}</p>
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
          <EChart option={growthOption} height={224} />
        </div>
        <div className="rounded-lg bg-white p-5 shadow-card">
          <SectionHead title={t('home.mgr.estBySector', { defaultValue: 'Establishments by sector' })} sub={t('home.exec.shareOfFrame', { defaultValue: 'Share of the live frame' })} />
          <EChart option={sectorDonutOption} height={224} />
        </div>
      </div>

      {/* map + size class + survey response */}
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-5 shadow-card">
          <SectionHead title={t('home.exec.map', { defaultValue: 'Where the establishments are' })} sub={t('home.exec.mapSub', { defaultValue: 'Establishments by municipality, from the primary address' })} />
          {mapReady ? <EChart option={mapOption} height={300} /> : <Skeleton className="h-[300px] w-full rounded-lg" />}
        </div>
        <div className="rounded-lg bg-white p-5 shadow-card">
          <SectionHead title={t('home.exec.sizeClass', { defaultValue: 'Establishments by size class' })} sub={t('home.exec.sizeClassSub', { defaultValue: 'NPC size classes — how the frame is stratified for sampling' })} />
          <EChart option={sizeClassOption} height={244} />
          <p className="mt-1 text-[11px] text-slate-400">
            {t('home.exec.sizeNote', { defaultValue: '{{unknown}} of {{total}} units have no usable headcount, so they sit outside every size class. A recorded zero counts as unrecorded.', unknown: unknownSize, total: totalSize })}
          </p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-card">
          <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[13.5px] font-bold text-slate-800">{t('home.exec.surveyResponse', { defaultValue: 'Survey response rates' })}</h2>
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
          <EChart option={paretoOption} height={268} />
          <p className="mt-1 text-[11px] text-slate-500">{t('home.exec.concentrationNote', { defaultValue: 'Three activity sections account for {{pct}}% of all recorded employment.', pct: top3Pct })}</p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-card">
          <SectionHead title={t('home.exec.contribution', { defaultValue: 'Who the register is assembled from' })} sub={t('home.exec.contributionSub', { defaultValue: 'Establishments by registration source, split by ownership sector' })} />
          <EChart option={contributionOption} height={SOURCE_SECTOR_BREAKDOWN.length * 34 + 60} />
        </div>
      </div>
    </PageContainer>
  );
}
