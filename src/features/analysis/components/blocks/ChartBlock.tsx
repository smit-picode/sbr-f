'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { useTranslation } from 'react-i18next';
import type { AnalysisAggregateResult } from '@/types';
import { useLanguage } from '@/i18n';
import { EChart, donut, qatarMap, registerQatarMap, type EChartOptionInput } from '@/lib/charts';
import { QATAR_MUNICIPALITY_NAME_AR } from '@/features/home/data/qatarMunicipalities';
import { useAnalysisResult } from '../../api/analysisService';
import { barOption, colorFor, deltaOption, lineOption, sunburstOption, treemapOption } from '../../charts/options';
import { cellValue, isAdditive, toCategorySeries, toTree } from '../../charts/transform';
import { ANALYSIS_BAR_ROW_HEIGHT, ANALYSIS_BAR_SCROLL_HEIGHT } from '../../constants';
import { requestForBlock } from '../../engine/resolve';
import { frameName, measureLabel, valueLabel } from '../../utils/labels';
import { BlockEmpty, BlockError, BlockSkeleton } from './BlockState';
import type { BlockViewProps } from './types';

// Horizontal bars get a fixed row pitch, so long category lists grow the chart instead of squashing it.
function rankedChartHeight(block: BlockViewProps['block'], data: AnalysisAggregateResult): number | null {
  if (block.type !== 'bar' && block.type !== 'delta') return null;
  const categories = new Set(data.rows.map((r) => r.keys[0])).size;
  const grouped = block.type === 'bar' && !block.display.stacked;
  const series = grouped ? (data.dimensions.length > 1 ? new Set(data.rows.map((r) => r.keys[1])).size : data.compareTo ? 2 : 1) : 1;
  const pitch = Math.min(ANALYSIS_BAR_ROW_HEIGHT + (series - 1) * 10, 64);
  return Math.max(200, categories * pitch + 60);
}

interface ClickParams {
  name?: string;
  data?: { keys?: (string | null)[]; value?: number | null } | null;
  value?: number | null;
  event?: { event?: MouseEvent };
}

export function ChartBlock({ block, query, masked, height, mode, onPoint }: BlockViewProps) {
  const { t } = useTranslation();
  const { isArabic } = useLanguage();
  const req = useMemo(() => requestForBlock(block, query), [block, query]);
  const { data, isLoading, isFetching, isError } = useAnalysisResult<AnalysisAggregateResult>(req);
  const [mapReady, setMapReady] = useState(false);
  const animate = mode !== 'print';

  useEffect(() => {
    if (block.type === 'map') registerQatarMap().then(() => setMapReady(true)).catch(() => setMapReady(false));
  }, [block.type]);

  // Label → key lookup for charts whose click params only carry the display name (donut, map).
  const nameToKey = useRef(new Map<string, string | null>());
  const onPointRef = useRef(onPoint);
  onPointRef.current = onPoint;
  const dimsRef = useRef<string[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  const option = useMemo<EChartOptionInput | null>(() => {
    if (!data || !data.rows.length) return null;
    dimsRef.current = data.dimensions;
    nameToKey.current = new Map();
    const d0 = data.dimensions[0];
    switch (block.type) {
      case 'bar':
      case 'column': {
        const cs = toCategorySeries(data, block, t, masked);
        return barOption({ ...cs, horizontal: block.type === 'bar', stacked: block.display.stacked, showValues: block.display.showValues, animate });
      }
      case 'line': {
        const cs = toCategorySeries(data, block, t, masked);
        return lineOption({ categories: cs.categories, series: cs.series, percent: cs.percent, showValues: block.display.showValues, animate });
      }
      case 'donut': {
        const items = data.rows.map((r, i) => {
          const name = valueLabel(t, d0, r.keys[0], true);
          nameToKey.current.set(name, r.keys[0]);
          return { name, value: cellValue(r, 0, masked) ?? 0, color: colorFor(r.keys[0], i) };
        });
        const opt = donut({ items, totalLabel: measureLabel(t, data.measures[0], block.query.entity), compact: true });
        return opt;
      }
      case 'treemap':
        return treemapOption({ nodes: toTree(data, t, masked), percent: false, total: data.total.values[0] ?? 0, animate });
      case 'sunburst':
        return sunburstOption({ nodes: toTree(data, t, masked), total: data.total.values[0] ?? 0, animate });
      case 'delta': {
        const items = data.rows.filter((r) => !(masked && r.flag)).map((r) => ({ key: r.keys[0], label: valueLabel(t, d0, r.keys[0], true), curr: cellValue(r, 0, masked) ?? 0, prev: r.prev?.[0] ?? 0 }));
        return deltaOption({ items, percent: block.display.percent !== 'none', animate, fromLabel: frameName(t, data.compareTo), toLabel: frameName(t, data.frame) });
      }
      case 'map': {
        if (!mapReady) return null;
        const by: Record<string, number> = {};
        for (const r of data.rows) if (r.keys[0]) by[r.keys[0]] = cellValue(r, 0, masked) ?? 0;
        const base = qatarMap({
          byMunicipality: by,
          unitLabel: measureLabel(t, data.measures[0], block.query.entity).toLowerCase(),
          nameMap: isArabic ? QATAR_MUNICIPALITY_NAME_AR : undefined,
        });
        return { ...base, animation: animate };
      }
      default:
        return null;
    }
  }, [data, block, t, masked, mapReady, isArabic, animate]);

  const events = useMemo(
    () => ({
      click: (raw: unknown) => {
        const p = raw as ClickParams;
        const handler = onPointRef.current;
        if (!handler) return;
        let keys = p.data?.keys;
        if (!keys && p.name != null) {
          keys = nameToKey.current.has(p.name) ? [nameToKey.current.get(p.name) ?? null] : [p.name];
        }
        if (!keys) return;
        // The point menu replaces the hover tooltip, which would otherwise sit on top of it.
        const el = wrapRef.current?.querySelector('[_echarts_instance_]') as HTMLElement | null;
        if (el) echarts.getInstanceByDom(el)?.dispatchAction({ type: 'hideTip' });
        const ev = p.event?.event;
        const value = typeof p.value === 'number' ? p.value : typeof p.data?.value === 'number' ? p.data.value : null;
        handler({ keys, dims: dimsRef.current.slice(0, keys.length), clientX: ev?.clientX ?? 0, clientY: ev?.clientY ?? 0, value });
      },
    }),
    []
  );

  if (isError) return <BlockError height={height} />;
  if (isLoading || (block.type === 'map' && !mapReady)) return <BlockSkeleton height={height} />;
  if (!data || !data.rows.length || !option) return <BlockEmpty height={height} />;
  if (block.type === 'map' && data.dimensions[0] !== 'municipality') {
    return <BlockEmpty height={height} message={t('analysis.empty.mapNeedsMunicipality', { defaultValue: 'The map groups by municipality — pick Municipality as the dimension.' })} />;
  }
  if (block.type === 'delta' && !data.compareTo) {
    return <BlockEmpty height={height} message={t('analysis.empty.needsCompare', { defaultValue: 'Choose a frame to compare with.' })} />;
  }
  const hasPercentNote = block.display.percent !== 'none' && !isAdditive(data) && block.type !== 'delta';
  const chartHeight = rankedChartHeight(block, data) ?? height;
  const scrolls = mode !== 'print' && chartHeight > ANALYSIS_BAR_SCROLL_HEIGHT;

  return (
    <div ref={wrapRef} className={`relative transition-opacity ${isFetching ? 'opacity-60' : ''}`} data-block-chart={block.id}>
      <div className={scrolls ? 'overflow-y-auto' : undefined} style={scrolls ? { maxHeight: ANALYSIS_BAR_SCROLL_HEIGHT } : undefined}>
      <EChart
        // Label formatters are closures the chart wrapper can't diff, so a language switch remounts.
        key={`${block.type}-${mode}-${isArabic ? 'ar' : 'en'}`}
        option={option}
        height={chartHeight}
        onEvents={mode === 'print' ? undefined : events}
        renderer={mode === 'print' ? 'svg' : 'canvas'}
        className={onPoint && mode !== 'print' ? 'cursor-pointer' : undefined}
      />
      </div>
      {hasPercentNote && (
        <p className="mt-1 text-[10.5px] text-slate-400">{t('analysis.percentNotAdditive', { defaultValue: 'Percentages apply to counts and sums only.' })}</p>
      )}
    </div>
  );
}
