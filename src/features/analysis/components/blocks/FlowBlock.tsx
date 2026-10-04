'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { AnalysisFlowResult } from '@/types';
import { cn } from '@/lib/utils';
import { EChart } from '@/lib/charts';
import { CHART_COLOR } from '@/lib/charts/theme';
import { useAnalysisResult } from '../../api/analysisService';
import { colorFor, sankeyOption, waterfallOption } from '../../charts/options';
import { ANALYSIS_OTHER_KEY, FLOW_CEASED, FLOW_NEW, FLOW_OUTSIDE } from '../../constants';
import { ANALYSIS_OTHER_COLOR } from '../../constants/palette';
import { requestForBlock } from '../../engine/resolve';
import { formatValue, frameName, valueLabel } from '../../utils/labels';
import { BlockEmpty, BlockError, BlockSkeleton } from './BlockState';
import type { BlockViewProps } from './types';

const SANKEY_CATEGORIES = 8;

export function FlowBlock({ block, query, height, mode }: BlockViewProps) {
  const { t, i18n } = useTranslation();
  const req = useMemo(() => requestForBlock(block, query), [block, query]);
  const { data, isLoading, isFetching, isError } = useAnalysisResult<AnalysisFlowResult>(req);
  const animate = mode !== 'print';
  const dim = query.dimensions[0];

  const option = useMemo(() => {
    if (!data) return null;
    if (block.type === 'waterfall') {
      const steps = [
        { label: frameName(t, data.compareTo), value: data.start, kind: 'total' as const },
        { label: t('analysis.flow.births', { defaultValue: 'Births' }), value: data.births, kind: 'up' as const },
        { label: t('analysis.flow.deaths', { defaultValue: 'Deaths' }), value: data.deaths, kind: 'down' as const },
        ...(data.movedIn ? [{ label: t('analysis.flow.movedIn', { defaultValue: 'Moved in' }), value: data.movedIn, kind: 'up' as const }] : []),
        ...(data.movedOut ? [{ label: t('analysis.flow.movedOut', { defaultValue: 'Moved out' }), value: data.movedOut, kind: 'down' as const }] : []),
        { label: frameName(t, data.frame), value: data.end, kind: 'total' as const },
      ];
      return waterfallOption({ steps, animate });
    }
    if (!dim) return null;
    // Keep the busiest categories on each side; fold the rest into "Other".
    const weight = new Map<string | null, number>();
    for (const l of data.links) {
      weight.set(l.from, (weight.get(l.from) ?? 0) + l.value);
      weight.set(l.to, (weight.get(l.to) ?? 0) + l.value);
    }
    const special = new Set<string | null>([FLOW_NEW, FLOW_CEASED, FLOW_OUTSIDE]);
    const ranked = [...weight.entries()].filter(([k]) => !special.has(k)).sort((a, b) => b[1] - a[1]).map(([k]) => k);
    const keep = new Set(ranked.slice(0, SANKEY_CATEGORIES));
    const fold = (k: string | null) => (special.has(k) || keep.has(k) ? k : ANALYSIS_OTHER_KEY);
    const colorIdx = new Map(ranked.map((k, i) => [k, i]));
    const color = (k: string | null) =>
      k === FLOW_NEW ? CHART_COLOR.pos : k === FLOW_CEASED ? CHART_COLOR.neg : k === FLOW_OUTSIDE || k === ANALYSIS_OTHER_KEY ? ANALYSIS_OTHER_COLOR : colorFor(k, colorIdx.get(k) ?? 0);
    const merged = new Map<string, { from: string | null; to: string | null; value: number }>();
    for (const l of data.links) {
      const a = fold(l.from);
      const b = fold(l.to);
      const id = `${a}|${b}`;
      const m = merged.get(id);
      if (m) m.value += l.value;
      else merged.set(id, { from: a, to: b, value: l.value });
    }
    const links = [...merged.values()].sort((a, b) => b.value - a.value).slice(0, 48).map((l) => ({
      from: String(l.from),
      to: String(l.to),
      fromLabel: valueLabel(t, dim, l.from, true),
      toLabel: valueLabel(t, dim, l.to, true),
      value: l.value,
      fromColor: color(l.from),
      toColor: color(l.to),
    }));
    return sankeyOption({ links, fromTitle: frameName(t, data.compareTo), toTitle: frameName(t, data.frame), animate });
  }, [data, block.type, dim, t, animate]);

  if (isError) return <BlockError height={height} />;
  if (isLoading || !data) return <BlockSkeleton height={height} />;
  if (!option || (block.type === 'sankey' && !data.links.length)) return <BlockEmpty height={height} message={t('analysis.empty.noMovement', { defaultValue: 'No units moved between these frames.' })} />;

  const net = data.end - data.start;
  return (
    <div className={cn('transition-opacity', isFetching && 'opacity-60')} data-block-chart={block.id}>
      <EChart key={`${block.type}-${mode}-${i18n.language}`} option={option} height={height} renderer={mode === 'print' ? 'svg' : 'canvas'} />
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-slate-500">
        <span>
          {t('analysis.flow.net', { defaultValue: 'Net change' })}{' '}
          <b className={net >= 0 ? 'text-pos-text' : 'text-neg-text'}>{`${net >= 0 ? '+' : ''}${formatValue(net)}`}</b>
          {data.start ? <span className="text-slate-400">{` (${net >= 0 ? '+' : ''}${((net / data.start) * 100).toFixed(1)}%)`}</span> : null}
        </span>
        {block.type === 'sankey' && (
          <span>{t('analysis.flow.unchanged', { defaultValue: '{{n}} units kept the same category (not drawn)', n: formatValue(data.unchanged) })}</span>
        )}
      </div>
    </div>
  );
}
