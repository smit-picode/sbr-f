'use client';

import { useMemo, useState } from 'react';
import { useRouter } from '@/hooks/useAppRouter';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Check, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { cn } from '@/lib/utils';
import { EChart, spark } from '@/lib/charts';
import { useGetSurveyGdpQuery } from '../api/surveysApi';
import { GDP_MEASURES, RESPONSE_FROM_ESTABLISHMENT } from '../constants';
import { sampleSlug } from '../utils/classify';
import { buildGdpView, formatMoney, formatShare } from '../utils/gdp';
import type { GdpMeasure } from '../types';

const SPARK_HEIGHT = 56;

function Level({ label, sub, value, accent, hint }: { label: string; sub: string; value: number | null; accent?: boolean; hint?: string }) {
  return (
    <div className="min-w-[150px] flex-1">
      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className={cn('mt-1 font-extrabold leading-none', value == null ? 'text-[26px] text-slate-300' : accent ? 'text-[26px] text-adaam' : 'text-[22px] text-slate-900')}>
        {formatMoney(value)}
      </div>
      <div className="mt-1 text-[11px] text-slate-500" title={hint}>{sub}</div>
    </div>
  );
}

function Connector({ pct, label }: { pct: number | null; label: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center justify-center px-1 pt-4">
      <span className="text-[12.5px] font-bold tabular-nums text-dune-deep">{pct == null ? ' ' : formatShare(pct)}</span>
      <div className="flex items-center gap-1 text-slate-300">
        <span className="h-px w-5 bg-current" />
        <ArrowRight className="h-3 w-3 rtl:rotate-180" />
      </div>
      <span className="text-[10px] text-slate-400">{label}</span>
    </div>
  );
}

// The establishment's value added / production / intermediate consumption against the whole economy, from its AES returns.
export function GdpContribution({ sbrId }: { sbrId: number }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [measure, setMeasure] = useState<GdpMeasure>('valueAdded');
  const { data, isLoading, isError, refetch } = useGetSurveyGdpQuery(sbrId);
  const view = useMemo(() => (data?.data ? buildGdpView(data.data) : null), [data]);

  const sectionLabel = (k: string) => `${k} · ${t(`surveySamples.isic.s${k}`)}`;
  const measureLabel = t(`surveySamples.${GDP_MEASURES.find((m) => m.key === measure)?.labelKey}`);
  const openReturn = (year: number) => router.push(`/surveys/${sampleSlug('AES', String(year))}/${sbrId}?from=${RESPONSE_FROM_ESTABLISHMENT}`);

  const trendOption = useMemo(() => {
    if (!view || view.trendYears.length < 2) return null;
    return spark({
      data: view.trend[measure],
      categories: view.trendYears.map(String),
      format: formatMoney,
      unit: ' QAR',
      solid: view.trendYears.map(() => true),
    });
  }, [view, measure]);

  const series = view?.trend[measure] ?? [];
  const changePct = series.length >= 2 && series[0] ? ((series[series.length - 1] / series[0]) - 1) * 100 : 0;

  return (
    <div className="rounded-lg bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#A29374]" />
          <h2 className="text-sm font-semibold text-slate-800">{t('surveySamples.gdpTitle')}</h2>
          {view?.referenceYear != null && (
            <button
              type="button"
              onClick={() => openReturn(view.referenceYear!)}
              title={t('surveySamples.gdpOpenReturn')}
              className="inline-flex items-center gap-1 rounded-full bg-pos-tint px-2 py-0.5 text-[10.5px] font-bold text-pos-text hover:opacity-80"
            >
              <Check className="h-[11px] w-[11px]" />
              {t('surveySamples.gdpChipReported', { y: view.referenceYear })}
            </button>
          )}
        </div>
        {view?.establishment && (
          <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
            {GDP_MEASURES.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMeasure(m.key)}
                className={cn(
                  'h-7 whitespace-nowrap rounded-full px-3 text-[11.5px] font-semibold transition-colors',
                  measure === m.key ? 'bg-dune text-white shadow-soft' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {t(`surveySamples.${m.labelKey}`)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-16 w-full rounded-md" />
            <Skeleton className="h-14 w-full rounded-md" />
          </div>
        ) : isError || !view ? (
          <ErrorState onRetry={refetch} />
        ) : !view.establishment || view.referenceYear == null ? (
          <p className="text-[12.5px] font-medium text-slate-600">{t('surveySamples.gdpNoReturn')}</p>
        ) : (
          <>
            <p className="mb-4 text-[11.5px] text-slate-500">{view.activity ? t('surveySamples.gdpLeadActivity') : t('surveySamples.gdpLeadEconomy')}</p>

            <div className="flex flex-wrap items-start gap-1">
              <Level
                label={t('surveySamples.gdpLevelEst')}
                sub={t('surveySamples.gdpBasisReported', { y: view.referenceYear })}
                value={view.establishment[measure]}
                accent
              />
              <Connector pct={view.activity ? view.shareOfActivity[measure] : view.shareOfEconomy[measure]} label={t('surveySamples.gdpOfLabel')} />
              {view.activity && (
                <>
                  <Level
                    label={sectionLabel(view.activity.section)}
                    sub={t('surveySamples.gdpActivitySub')}
                    hint={t('surveySamples.gdpActivityHint', { n: view.activity.units, y: view.referenceYear })}
                    value={view.activity.accounts[measure]}
                  />
                  <Connector pct={view.activityShareOfEconomy[measure]} label={t('surveySamples.gdpOfLabel')} />
                </>
              )}
              <Level
                label={t('surveySamples.gdpLevelEconomy')}
                sub={!view.economy
                  ? t('surveySamples.gdpNoEconomyYear', { y: view.referenceYear })
                  : view.economyYear !== view.referenceYear
                    ? t('surveySamples.gdpEconomyLatest', { y: view.economyYear })
                    : (measure === 'valueAdded' ? t('surveySamples.gdpIsGdp') : t('surveySamples.gdpInQarPlain'))}
                value={view.economy ? view.economy[measure] : null}
              />
            </div>

            {view.shareOfEconomy[measure] != null && (
              <div className="mt-4 flex flex-wrap items-baseline gap-2 border-t border-slate-100 pt-3">
                <span className="text-[12.5px] text-slate-600">{t('surveySamples.gdpOfEconomyLead')}</span>
                <span className="text-[15px] font-extrabold tabular-nums text-slate-900">{formatShare(view.shareOfEconomy[measure])}</span>
                <span className="text-[12.5px] text-slate-600">{t('surveySamples.gdpOfEconomyTrail')}</span>
              </div>
            )}
            <p className="mt-2 text-[11px] text-slate-400">{t('surveySamples.gdpIdentity')}</p>

            {trendOption && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <div className="text-[11px] text-slate-500">
                    {t('surveySamples.gdpTrend', { m: measureLabel.toLowerCase(), y: view.trendYears[0] })}
                  </div>
                  <div dir="ltr" className={cn('text-[11.5px] font-bold tabular-nums', changePct >= 0 ? 'text-pos-text' : 'text-neg-text')}>
                    {`${changePct >= 0 ? '+' : ''}${changePct.toFixed(0)}%`}
                  </div>
                </div>
                <EChart height={SPARK_HEIGHT} option={trendOption} />
                <div dir="ltr" className="flex justify-between text-[9.5px] text-slate-400">
                  {view.trendYears.map((y) => <span key={y}>{y}</span>)}
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-[10.5px] text-slate-500">
                  <span className="h-[7px] w-[7px] rounded-full bg-adaam" />
                  {t('surveySamples.gdpMarkReported')}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
