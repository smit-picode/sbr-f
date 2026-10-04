'use client';

import { useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AnalysisAggregateResult } from '@/types';
import { cn } from '@/lib/utils';
import { useAnalysisResult } from '../../api/analysisService';
import { ANALYSIS_DISCLOSURE } from '../../constants';
import { requestForBlock, trendRequestFor } from '../../engine/resolve';
import { formatDelta, formatValue, frameName, measureLabel } from '../../utils/labels';
import { BlockEmpty, BlockError, BlockSkeleton } from './BlockState';
import type { BlockViewProps } from './types';

function Sparkline({ values, big }: { values: number[]; big: boolean }) {
  const w = big ? 180 : 120;
  const h = big ? 44 : 30;
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (w - 6) + 3, h - 4 - ((v - min) / span) * (h - 10)]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" aria-hidden>
      <defs>
        <linearGradient id="kpi-spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: 'var(--color-adaam)', stopOpacity: 0.28 }} />
          <stop offset="100%" style={{ stopColor: 'var(--color-adaam)', stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <path d={`${d} L${last[0]},${h} L${pts[0][0]},${h} Z`} fill="url(#kpi-spark)" />
      <path d={d} fill="none" className="stroke-adaam" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r={3.2} className="fill-white stroke-adaam-deep" strokeWidth={2} />
    </svg>
  );
}

export function KpiBlock({ block, query, masked, height, mode }: BlockViewProps) {
  const { t } = useTranslation();
  const req = useMemo(() => requestForBlock(block, query), [block, query]);
  const trendReq = useMemo(() => (block.display.sparkline ? trendRequestFor(query) : null), [block.display.sparkline, query]);
  const { data, isLoading, isError } = useAnalysisResult<AnalysisAggregateResult>(req);
  const trend = useAnalysisResult<AnalysisAggregateResult>(trendReq);
  const big = mode === 'present';

  if (isError) return <BlockError height={height} />;
  if (isLoading || !data) return <BlockSkeleton height={height} variant="kpi" />;
  if (!data.total.n) return <BlockEmpty height={120} />;

  const small = (n: number | undefined) => !!n && n < ANALYSIS_DISCLOSURE.minCell;
  const confidential = masked && (small(data.total.n) || small(data.total.prevN));

  return (
    <div className={cn('grid gap-x-6 gap-y-5', mode !== 'screen' ? ['grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4'][data.measures.length - 1] : data.measures.length === 1 ? 'grid-cols-1' : data.measures.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4', data.measures.length === 3 && 'xl:grid-cols-3')}>
      {data.measures.map((m, i) => {
        const v = confidential ? null : data.total.values[i];
        const prev = confidential ? null : data.total.prev?.[i] ?? null;
        const delta = formatDelta(v, prev);
        const up = (delta.abs ?? 0) > 0;
        const flat = delta.abs === 0;
        const series = trend.data?.rows.map((r) => r.values[i] ?? 0) ?? [];
        return (
          <div key={m.id} className={cn('min-w-0', i > 0 && 'sm:border-s sm:border-slate-100 sm:ps-6')}>
            <div className={cn('font-semibold text-slate-500 truncate', big ? 'text-base' : 'text-[12px]')}>{measureLabel(t, m, block.query.entity)}</div>
            <div className="mt-1.5 flex items-end justify-between gap-3">
              <div className={cn('font-extrabold leading-none text-ink tabular-nums', big ? 'text-6xl' : 'text-[34px]')}>
                {confidential ? 'x' : formatValue(v, { compact: (v ?? 0) >= 1e7 })}
              </div>
              {block.display.sparkline && series.length > 1 && <Sparkline values={series} big={big} />}
            </div>
            {data.compareTo && delta.abs != null && (
              <div className="mt-2 flex items-center gap-1.5 text-[11.5px]">
                <span className={cn(
                  'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-bold',
                  flat ? 'bg-slate-100 text-slate-500' : up ? 'bg-pos-tint text-pos-text' : 'bg-neg-tint text-neg-text'
                )}>
                  {flat ? <Minus className="h-3 w-3" /> : up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {delta.pct != null ? `${delta.pct >= 0 ? '+' : ''}${delta.pct.toFixed(1)}%` : '—'}
                </span>
                <span className="text-slate-400 truncate">
                  {`${(delta.abs ?? 0) >= 0 ? '+' : ''}${formatValue(delta.abs)} ${t('analysis.vs', { defaultValue: 'vs' })} ${frameName(t, data.compareTo)}`}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
