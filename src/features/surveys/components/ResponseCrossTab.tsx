'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CHART_COLOR, EChart, bubbleGrid, bubbleSizeFor } from '@/lib/charts';
import { responseByActivityAndSize } from '../utils/aggregate';
import {
  ALL_SURVEYS,
  CROSS_TAB_HIGH_COLOR,
  CROSS_TAB_LOW_COLOR,
  CROSS_TAB_MID_COLOR,
  CROSS_TAB_SCALE_MIN,
  RESPONSE_TARGET_PCT,
  SURVEYS,
} from '../constants';
import type { SampleRow } from '../types';

const MAX_BUBBLE = 32;
const LEGEND_RAMP_WIDTH = 190;

// Bubbles, not a heatmap: area carries the uneven cell bases so a two-unit rate can't shout like a seventy-unit one.
export function ResponseCrossTab({ surveyId, rows }: { surveyId: string; rows: SampleRow[] }) {
  const { t } = useTranslation();
  const x = useMemo(() => responseByActivityAndSize(rows), [rows]);

  const view = useMemo(() => {
    if (!x.cells.length) return null;
    const secLabel = (k: string) => (k === '—' ? t('surveySamples.isic.sunknown') : `${k} · ${t(`surveySamples.isic.s${k}`)}`);
    const secFull = (k: string) => (k === '—' ? t('surveySamples.isic.unknown') : t(`surveySamples.isic.${k}`));
    const bandLabel = (k: string) => t(`surveySamples.size.${k}`);
    const ofN = (n: number) => t('surveySamples.ofN', { n });

    const rows = x.sections.map((sc) => ({ key: sc.section, label: secLabel(sc.section), sub: `${sc.rate}% ${ofN(sc.base)}` }));
    const cols = x.bands.map((bd) => ({ key: bd.band, label: bandLabel(bd.band), sub: `${bd.rate}% ${ofN(bd.base)}` }));
    const cells = x.cells.map((c) => ({
      row: c.section,
      col: c.band,
      size: c.base,
      value: c.rate,
      // Only a dependable base earns a printed rate; a thin one still shows as a (small) bubble.
      label: c.reliable ? `${Math.round(c.rate)}%` : '',
      tip:
        `<b>${secFull(c.section)}</b> · ${bandLabel(c.band)}` +
        `<br/>${t('surveySamples.responseRate')}: <b>${c.rate}%</b>` +
        `<br/>${c.answered} / ${c.base} ${t('surveySamples.sampledUnitsShort')}` +
        `<br/><span style="opacity:.75">${t('surveySamples.responded')} ${c.responded} · ${t('surveySamples.partial')} ${c.partial} · ` +
        `${t('surveySamples.nonResponse')} ${c.nonResponse} · ${t('surveySamples.pending')} ${c.pending}</span>` +
        (c.reliable ? '' : `<br/><span style="opacity:.75">${t('surveySamples.thinBase')}</span>`),
    }));
    const worst = x.cells.filter((c) => c.reliable).sort((a, b) => a.rate - b.rate)[0];
    const maxBase = x.cells.reduce((m, c) => Math.max(m, c.base), 1);
    const sizeStops = [Math.max(2, Math.round(maxBase * 0.08)), Math.round(maxBase * 0.4), maxBase]
      .filter((v, i, a) => a.indexOf(v) === i);
    return {
      rowsCount: rows.length,
      option: bubbleGrid({
        rows, cols, cells,
        midpoint: RESPONSE_TARGET_PCT, min: CROSS_TAB_SCALE_MIN, max: 100,
        lowColor: CROSS_TAB_LOW_COLOR, midColor: CROSS_TAB_MID_COLOR, highColor: CROSS_TAB_HIGH_COLOR,
        labelWidth: 168, maxBubble: MAX_BUBBLE,
      }),
      sizeStops: sizeStops.map((v) => ({ v, d: Math.round(bubbleSizeFor(v, maxBase, MAX_BUBBLE)) })),
      worstNote: worst
        ? t('surveySamples.crossNote', { a: secFull(worst.section), s: bandLabel(worst.band), r: worst.rate, b: worst.base })
        : null,
    };
  }, [x, t]);

  if (!view) return null;
  const surveyName = surveyId === ALL_SURVEYS ? null : SURVEYS.find((s) => s.id === surveyId)?.name;

  return (
    <div className="rounded-xl bg-white p-4 shadow-card">
      <div className="text-[12px] font-bold text-slate-700">
        {surveyName ? `${t('surveySamples.crossTitle')} · ${surveyName}` : t('surveySamples.crossTitle')}
      </div>
      <p className="mb-3 text-[11.5px] text-slate-500">{t('surveySamples.crossLead')}</p>

      {/* Legend: the size encoding drawn with the chart's own sizing maths, and the colour ramp with the target marked. */}
      <div dir="ltr" className="mb-3 flex flex-wrap items-end gap-x-7 gap-y-3">
        <div className="flex items-end gap-2.5">
          <span className="pb-1 text-[11px] font-semibold text-slate-600">{t('surveySamples.legSize')}</span>
          <div className="flex items-end gap-2">
            {view.sizeStops.map((s) => (
              <div key={s.v} className="flex flex-col items-center gap-1">
                <span className="rounded-full bg-slate-300" style={{ width: s.d, height: s.d }} />
                <span className="text-[10.5px] tabular-nums text-slate-500">{s.v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-slate-600">{t('surveySamples.legColour')}</span>
          <div className="relative" style={{ width: LEGEND_RAMP_WIDTH }}>
            <div
              className="h-2.5 rounded-full"
              style={{ background: `linear-gradient(90deg,${CROSS_TAB_LOW_COLOR},${CROSS_TAB_MID_COLOR} 50%,${CROSS_TAB_HIGH_COLOR})` }}
            />
            <div className="absolute -top-0.5 h-3.5 w-[2px] rounded" style={{ left: '50%', background: CHART_COLOR.night }} />
          </div>
          <div dir="ltr" className="relative text-[10.5px] text-slate-500" style={{ width: LEGEND_RAMP_WIDTH }}>
            <span>≤{CROSS_TAB_SCALE_MIN}%</span>
            <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-semibold text-slate-600">
              {t('surveySamples.target')} <bdi>{RESPONSE_TARGET_PCT}%</bdi>
            </span>
            <span className="absolute right-0">100%</span>
          </div>
        </div>
      </div>

      <EChart height={view.rowsCount * 38 + 78} option={view.option} />
      <p className="mt-1 text-[11px] text-slate-400">{t('surveySamples.crossPrinted', { n: x.minBase })}</p>
      {view.worstNote && <p className="mt-0.5 text-[11.5px] font-medium text-slate-600">{view.worstNote}</p>}
    </div>
  );
}
