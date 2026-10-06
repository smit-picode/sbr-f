'use client';

import { useMemo, useState } from 'react';
import { useRouter } from '@/hooks/useAppRouter';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { SurveySamplesSkeleton } from '@/components/common/SurveySamplesSkeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CHART_COLOR, EChart, targetColumns } from '@/lib/charts';
import { useGetSurveyResponsesQuery, useGetSurveySamplesQuery } from '../api/surveysApi';
import { distinctRows, toSampleRows, toSamples } from '../utils/aggregate';
import { SampleDistributionGrid } from '../components/SampleDistributionGrid';
import { ResponseCrossTab } from '../components/ResponseCrossTab';
import { RateGauge } from '../components/RateGauge';
import {
  ALL_SURVEYS,
  RATE_FAIR_COLOR,
  RATE_GOOD_COLOR,
  RATE_POOR_COLOR,
  RESPONSE_TARGET_PCT,
  SURVEYS,
} from '../constants';
import { rateColor, sampleSlug } from '../utils/classify';
import type { SurveyId, SurveySample } from '../types';

const PENDING_BAR_COLOR = '#D1D5DB';
const shareOf = (part: number, size: number) => (size ? Math.round((part / size) * 1000) / 10 : 0);

function KpiCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-card">
      <div className="text-[22px] font-extrabold text-slate-900">{value}</div>
      <div className="text-[12px] text-slate-500">{label}</div>
    </div>
  );
}

export function SurveySamplesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [surveyFilter, setSurveyFilter] = useState<string>(ALL_SURVEYS);

  const samplesQuery = useGetSurveySamplesQuery();
  const responsesQuery = useGetSurveyResponsesQuery(surveyFilter === ALL_SURVEYS ? {} : { surveyId: surveyFilter as SurveyId });
  // currentData, not data: while a new filter loads, data still holds the previous survey's rows.
  const responseRows = responsesQuery.currentData?.data;

  // Everything below the filter row answers to it: counts, distributions, cross-tab, rate chart and table.
  const samples = useMemo(
    () => toSamples(samplesQuery.data?.data ?? []).filter((s) => surveyFilter === ALL_SURVEYS || s.surveyId === surveyFilter),
    [samplesQuery.data, surveyFilter]
  );
  const rows = useMemo(() => distinctRows(toSampleRows(responseRows ?? [])), [responseRows]);
  const totalSize = samples.reduce((a, s) => a + s.size, 0);
  const totalResponded = samples.reduce((a, s) => a + s.responded, 0);
  // Headline rate counts full responses only, exactly as the reference does.
  const overallRate = shareOf(totalResponded, totalSize);

  const isLoading = samplesQuery.isLoading || (!responseRows && responsesQuery.isFetching);
  const isError = samplesQuery.isError || responsesQuery.isError;

  const openSample = (s: SurveySample) => router.push(`/surveys/${sampleSlug(s.surveyId, s.period)}`);

  const rateOption = useMemo(() => {
    const refLines = [{ value: RESPONSE_TARGET_PCT, label: `${t('surveySamples.target')} ${RESPONSE_TARGET_PCT}%`, color: CHART_COLOR.dune }];
    if (surveyFilter === ALL_SURVEYS) {
      return targetColumns({
        categories: SURVEYS.map((sv) => sv.short),
        series: [{
          name: t('surveySamples.responseRate'),
          color: CHART_COLOR.adaam,
          data: SURVEYS.map((sv) => {
            const own = samples.filter((x) => x.surveyId === sv.id);
            return shareOf(own.reduce((a, x) => a + x.responded, 0), own.reduce((a, x) => a + x.size, 0));
          }),
        }],
        yMax: 100, unit: '%', labels: true, gradient: true, refLines,
      });
    }
    return targetColumns({
      categories: samples.map((s) => s.period),
      stacked: true, unit: '%', yMax: 100, refLines,
      series: [
        { name: t('surveySamples.responded'), color: CHART_COLOR.pos, data: samples.map((s) => shareOf(s.responded, s.size)) },
        { name: t('surveySamples.partial'), color: CHART_COLOR.warn, data: samples.map((s) => shareOf(s.partial, s.size)) },
        { name: t('surveySamples.nonResponse'), color: CHART_COLOR.neg, data: samples.map((s) => shareOf(s.nonResponse, s.size)) },
        { name: t('surveySamples.pending'), color: PENDING_BAR_COLOR, data: samples.map((s) => shareOf(s.pending, s.size)) },
      ],
    });
  }, [samples, surveyFilter, t]);

  // A period column opens that sample; the all-surveys view has one column per survey, not per sample.
  const rateEvents = useMemo(() => ({
    click: (e: unknown) => {
      const sample = samples[(e as { dataIndex: number }).dataIndex];
      if (surveyFilter !== ALL_SURVEYS && sample) openSample(sample);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [samples, surveyFilter]);

  const tableHeaders = [
    t('surveySamples.survey'), t('surveySamples.period'), t('surveySamples.sampleSize'), t('surveySamples.responded'),
    t('surveySamples.partial'), t('surveySamples.nonResponse'), t('surveySamples.pending'), t('surveySamples.responseRate'), '',
  ];

  return (
    <PageContainer>
      <PageHeader title={t('surveySamples.overviewTitle')} description={t('surveySamples.overviewDesc')} />

      <div className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-card">
        <span className="text-[12px] font-semibold text-slate-500">{t('surveySamples.survey')}:</span>
        <Select value={surveyFilter} onValueChange={setSurveyFilter}>
          <SelectTrigger className="w-64 shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SURVEYS}>{t('surveySamples.allSurveys')}</SelectItem>
            {SURVEYS.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <SurveySamplesSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => { samplesQuery.refetch(); responsesQuery.refetch(); }} />
      ) : (
      <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard value={samples.length.toLocaleString()} label={t('surveySamples.samples')} />
        <KpiCard value={totalSize.toLocaleString()} label={t('surveySamples.sampledUnits')} />
        <KpiCard value={rows.length.toLocaleString()} label={t('surveySamples.distinctEst')} />
        <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-card">
          <RateGauge rate={overallRate} size={60} width={6} valueSize={12} />
          <div>
            <div className="text-[12px] font-semibold text-slate-700">{t('surveySamples.responseRate')}</div>
            <div className="text-[11px] text-slate-400">{t('surveySamples.acrossShown')}</div>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 text-[12px] font-bold text-slate-400">{t('surveySamples.totalDistribution')}</div>
        <SampleDistributionGrid rows={rows} />
      </div>

      <ResponseCrossTab surveyId={surveyFilter} rows={rows} />

      <div className="rounded-xl bg-white p-4 shadow-card">
        <div className="text-[12px] font-bold text-slate-700">
          {surveyFilter === ALL_SURVEYS ? t('surveySamples.rateBySurvey') : t('surveySamples.rateByPeriod')}
        </div>
        <p className="mb-1 text-[11px] text-slate-400">{t('surveySamples.rateCtx')}</p>
        <EChart height={200} option={rateOption} onEvents={rateEvents} />
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                {tableHeaders.map((hd, i) => (
                  <th
                    key={i}
                    className={`whitespace-nowrap px-4 py-2.5 text-[11.5px] font-semibold text-slate-400 ${i >= 2 && i <= 6 ? 'text-end' : 'text-start'}`}
                  >
                    {hd}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {samples.map((s) => (
                <tr
                  key={`${s.surveyId}${s.period}`}
                  onClick={() => openSample(s)}
                  className="cursor-pointer border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.survey.color }} />
                      <span className="text-[13px] font-semibold text-slate-800">{s.survey.short}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[12.5px] text-slate-600">{s.period}</td>
                  <td className="px-4 py-2.5 text-end font-semibold tabular-nums text-slate-800">{s.size}</td>
                  <td className="px-4 py-2.5 text-end tabular-nums text-emerald-700">{s.responded}</td>
                  <td className="px-4 py-2.5 text-end tabular-nums text-amber-700">{s.partial}</td>
                  <td className="px-4 py-2.5 text-end tabular-nums text-red-700">{s.nonResponse}</td>
                  <td className="px-4 py-2.5 text-end tabular-nums text-slate-500">{s.pending}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${s.rate}%`, background: rateColor(s.rate, RATE_GOOD_COLOR, RATE_FAIR_COLOR, RATE_POOR_COLOR) }}
                        />
                      </div>
                      <span className="text-[12px] font-bold tabular-nums text-slate-700">{s.rate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-end">
                    <ChevronRight className="h-[15px] w-[15px] text-slate-300 rtl:rotate-180" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}
    </PageContainer>
  );
}
