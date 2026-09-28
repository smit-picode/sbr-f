'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CHART_COLOR, EChart, donut, hbars } from '@/lib/charts';
import { SECTOR_COLOR } from '@/features/home/data/chartColors';
import { distribution, statusDistribution } from '../utils/aggregate';
import { FALLBACK_COLOR, ISIC_TOP_N, RESPONSE_STATUS_COLORS, RESPONSE_STATUS_KEY, SURVEY_SOURCE_COLOR } from '../constants';
import type { SampleRow } from '../types';

const PANEL_HEIGHT = 150;

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-card">
      <div className="mb-2 text-[11px] font-bold text-slate-400">{title}</div>
      {children}
    </div>
  );
}

// The four composition panels shared by the overview and a sample's detail screen.
export function SampleDistributionGrid({ rows }: { rows: SampleRow[] }) {
  const { t } = useTranslation();

  const options = useMemo(() => {
    const bySector = distribution(rows, 'SECTOR_ID');
    const bySource = distribution(rows, 'SOURCE_CODE');
    const byIsic = distribution(rows, 'ISIC_CODE').slice(0, ISIC_TOP_N);
    const byStatus = statusDistribution(rows);
    return {
      sector: donut({
        items: bySector.map((i) => ({ name: i.key, value: i.count, color: SECTOR_COLOR[i.key] ?? FALLBACK_COLOR })),
        compact: true,
      }),
      source: hbars({
        items: bySource.map((i) => ({ name: i.key, value: i.count, color: SURVEY_SOURCE_COLOR[i.key] ?? FALLBACK_COLOR })),
        barWidth: 10,
        labelWidth: 72,
        axis: false,
      }),
      activity: hbars({
        items: byIsic.map((i) => ({ name: i.key, value: i.count, color: CHART_COLOR.adaam })),
        barWidth: 10,
        labelWidth: 44,
        axis: false,
      }),
      status: donut({
        items: byStatus.map((i) => ({
          name: t(`surveySamples.${RESPONSE_STATUS_KEY[i.key]}`, { defaultValue: i.key }),
          value: i.count,
          color: RESPONSE_STATUS_COLORS[i.key].fg,
        })),
        compact: true,
      }),
    };
  }, [rows, t]);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Panel title={t('surveySamples.bySector')}><EChart height={PANEL_HEIGHT} option={options.sector} /></Panel>
      <Panel title={t('surveySamples.bySource')}><EChart height={PANEL_HEIGHT} option={options.source} /></Panel>
      <Panel title={t('surveySamples.byActivity')}><EChart height={PANEL_HEIGHT} option={options.activity} /></Panel>
      <Panel title={t('surveySamples.byStatus')}><EChart height={PANEL_HEIGHT} option={options.status} /></Panel>
    </div>
  );
}
