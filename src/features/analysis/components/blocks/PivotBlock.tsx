'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { AnalysisAggregateResult, AnalysisResultRow } from '@/types';
import { cn } from '@/lib/utils';
import { useAnalysisResult } from '../../api/analysisService';
import { isAdditive } from '../../charts/transform';
import { ANALYSIS_DISCLOSURE, ANALYSIS_FIELDS, ANALYSIS_FRAME_DIMENSION, ANALYSIS_OTHER_KEY } from '../../constants';
import { requestForBlock } from '../../engine/resolve';
import { ANALYSIS_FRAME_CHRONO } from '../../mock/frames';
import { fieldLabel, formatDelta, formatValue, frameName, measureLabel, valueLabel } from '../../utils/labels';
import { BlockEmpty, BlockError, BlockSkeleton } from './BlockState';
import type { AnalysisPointEvent, BlockViewProps } from './types';

const HATCH = 'repeating-linear-gradient(135deg, color-mix(in srgb, var(--color-warn) 22%, transparent) 0 3px, transparent 3px 7px)';

function orderKeys(rows: AnalysisResultRow[], axis: number, field: string): (string | null)[] {
  const seen: (string | null)[] = [];
  const totals = new Map<string | null, number>();
  for (const r of rows) {
    if (!totals.has(r.keys[axis])) seen.push(r.keys[axis]);
    totals.set(r.keys[axis], (totals.get(r.keys[axis]) ?? 0) + (r.values[0] ?? 0));
  }
  if (axis === 0) return seen;
  const order = ANALYSIS_FIELDS[field]?.order;
  return seen.sort((a, b) => {
    if (a === ANALYSIS_OTHER_KEY || a == null) return 1;
    if (b === ANALYSIS_OTHER_KEY || b == null) return -1;
    if (field === ANALYSIS_FRAME_DIMENSION) return ANALYSIS_FRAME_CHRONO.indexOf(a) - ANALYSIS_FRAME_CHRONO.indexOf(b);
    if (order) return order.indexOf(a) - order.indexOf(b);
    if (field === 'reg_year') return a.localeCompare(b);
    return (totals.get(b) ?? 0) - (totals.get(a) ?? 0);
  });
}

interface CellProps {
  row?: AnalysisResultRow;
  value: number | null;
  masked: boolean;
  percent: boolean;
  heat?: number;
  onClick?: (e: React.MouseEvent) => void;
  strong?: boolean;
}

function Cell({ row, value, masked, percent, heat, onClick, strong }: CellProps) {
  const { t } = useTranslation();
  const flag = row?.flag;
  const hidden = masked && !!flag;
  const title = flag
    ? flag === 'secondary'
      ? t('analysis.disclosure.secondaryTip', { defaultValue: 'Suppressed so a confidential neighbour cannot be recovered from the totals' })
      : flag === 'dominance'
        ? t('analysis.disclosure.dominanceTip', { defaultValue: 'One unit dominates this total — confidential' })
        : t('analysis.disclosure.minTip', { defaultValue: 'Fewer than {{n}} units — confidential', n: ANALYSIS_DISCLOSURE.minCell })
    : undefined;
  const bg = heat != null && !hidden ? `color-mix(in srgb, var(--color-adaam) ${Math.round(6 + heat * 74)}%, transparent)` : undefined;
  return (
    <td
      onClick={onClick}
      title={title}
      className={cn(
        'px-3 py-1.5 text-end tabular-nums whitespace-nowrap border-b border-slate-100',
        strong ? 'font-bold text-slate-900' : 'text-slate-700',
        heat != null && heat > 0.55 && !hidden && 'text-white font-semibold',
        onClick && 'cursor-pointer hover:outline hover:outline-2 hover:-outline-offset-2 hover:outline-adaam/50'
      )}
      style={flag && !hidden ? { backgroundImage: HATCH } : bg ? { backgroundColor: bg } : undefined}
    >
      {hidden ? <span className="text-slate-400 font-semibold">x</span> : value == null ? <span className="text-slate-300">—</span> : formatValue(value, { percent })}
    </td>
  );
}

export function PivotBlock({ block, query, masked, height, mode, onPoint }: BlockViewProps) {
  const { t } = useTranslation();
  const req = useMemo(() => requestForBlock(block, query), [block, query]);
  const { data, isLoading, isFetching, isError } = useAnalysisResult<AnalysisAggregateResult>(req);
  const heat = block.type === 'heatmap';

  const model = useMemo(() => {
    if (!data || !data.rows.length) return null;
    const [d0, d1] = data.dimensions;
    const rowKeys = orderKeys(data.rows, 0, d0);
    const colKeys = d1 ? orderKeys(data.rows, 1, d1) : [];
    const byKey = new Map(data.rows.map((r) => [r.keys.join('\u0001'), r]));
    return { d0, d1, rowKeys, colKeys, byKey };
  }, [data]);

  if (isError) return <BlockError height={height} />;
  if (isLoading) return <BlockSkeleton height={height} variant="table" />;
  if (!data || !model) return <BlockEmpty height={height} />;

  const { d0, d1, rowKeys, colKeys, byKey } = model;
  const additive = isAdditive(data);
  const pctMode = additive ? block.display.percent : 'none';
  const pct = pctMode !== 'none';
  const showTotals = block.display.showTotals && additive;
  const point = (keys: (string | null)[], v: number | null) => (e: React.MouseEvent) => {
    if (!onPoint) return;
    const ev: AnalysisPointEvent = { keys, dims: data.dimensions.slice(0, keys.length), clientX: e.clientX, clientY: e.clientY, value: v };
    onPoint(ev);
  };
  const clickable = !!onPoint && mode !== 'print';
  const scroll = mode === 'print' ? '' : 'max-h-[440px] overflow-auto';
  const thCls = 'px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 bg-white sticky top-0 z-[1] border-b border-slate-200 whitespace-nowrap';

  // ---- one dimension: categories × measures (+ comparison) ----
  if (!d1) {
    const compare = !!data.compareTo;
    const total0 = data.total.values[0] ?? 0;
    return (
      <div className={cn(scroll, 'transition-opacity', isFetching && 'opacity-60')}>
        <table className="w-full text-[12.5px]">
          <thead>
            <tr>
              <th className={cn(thCls, 'text-start')}>{fieldLabel(t, d0)}</th>
              {data.measures.map((m) => <th key={m.id} className={cn(thCls, 'text-end')}>{measureLabel(t, m, block.query.entity)}</th>)}
              {pct && <th className={cn(thCls, 'text-end')}>%</th>}
              {compare && <th className={cn(thCls, 'text-end')}>{frameName(t, data.compareTo)}</th>}
              {compare && <th className={cn(thCls, 'text-end')}>Δ %</th>}
            </tr>
          </thead>
          <tbody>
            {rowKeys.map((rk) => {
              const r = byKey.get([rk].join('\u0001'));
              if (!r) return null;
              const d = formatDelta(r.values[0], r.prev?.[0] ?? null);
              return (
                <tr key={String(rk)} className="hover:bg-slate-50/70">
                  <td className="px-3 py-1.5 text-slate-700 border-b border-slate-100 max-w-[260px] truncate" title={valueLabel(t, d0, rk)}>{valueLabel(t, d0, rk)}</td>
                  {data.measures.map((m, mi) => (
                    <Cell key={m.id} row={r} value={r.values[mi]} masked={masked} percent={false} onClick={clickable ? point([rk], r.values[mi]) : undefined} />
                  ))}
                  {pct && <Cell row={r} value={total0 ? ((r.values[0] ?? 0) / total0) * 100 : null} masked={masked} percent />}
                  {compare && <Cell row={r} value={r.prev?.[0] ?? null} masked={masked} percent={false} />}
                  {compare && (
                    <td className={cn('px-3 py-1.5 text-end tabular-nums border-b border-slate-100 font-semibold', (d.pct ?? 0) > 0 ? 'text-pos-text' : (d.pct ?? 0) < 0 ? 'text-neg-text' : 'text-slate-400')}>
                      {masked && r.flag ? <span className="text-slate-400">x</span> : d.pct == null ? '—' : `${d.pct >= 0 ? '+' : ''}${d.pct.toFixed(1)}%`}
                    </td>
                  )}
                </tr>
              );
            })}
            {block.display.showTotals && (
              <tr className="bg-slate-50">
                <td className="px-3 py-2 font-bold text-slate-900">{t('analysis.total', { defaultValue: 'Total' })}</td>
                {data.measures.map((m, mi) => <Cell key={m.id} value={data.total.values[mi]} masked={false} percent={false} strong />)}
                {pct && <Cell value={100} masked={false} percent strong />}
                {compare && <Cell value={data.total.prev?.[0] ?? null} masked={false} percent={false} strong />}
                {compare && (() => {
                  const d = formatDelta(data.total.values[0], data.total.prev?.[0] ?? null);
                  return <td className={cn('px-3 py-2 text-end font-bold tabular-nums', (d.pct ?? 0) >= 0 ? 'text-pos-text' : 'text-neg-text')}>{d.pct == null ? '—' : `${d.pct >= 0 ? '+' : ''}${d.pct.toFixed(1)}%`}</td>;
                })()}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  // ---- two dimensions: cross-tab of the first measure ----
  const raw = (rk: string | null, ck: string | null) => byKey.get([rk, ck].join('\u0001'));
  const rowSum = new Map<string | null, number>();
  const colSum = new Map<string | null, number>();
  let grand = 0;
  for (const rk of rowKeys) for (const ck of colKeys) {
    const v = raw(rk, ck)?.values[0] ?? 0;
    rowSum.set(rk, (rowSum.get(rk) ?? 0) + v);
    colSum.set(ck, (colSum.get(ck) ?? 0) + v);
    grand += v;
  }
  const shown = (rk: string | null, ck: string | null): number | null => {
    const v = raw(rk, ck)?.values[0];
    if (v == null) return null;
    if (pctMode === 'total') return grand ? (v / grand) * 100 : null;
    if (pctMode === 'row') return rowSum.get(rk) ? (v / rowSum.get(rk)!) * 100 : null;
    if (pctMode === 'column') return colSum.get(ck) ? (v / colSum.get(ck)!) * 100 : null;
    return v;
  };
  let max = 0;
  if (heat) for (const rk of rowKeys) for (const ck of colKeys) { const s = shown(rk, ck); if (s != null && s > max) max = s; }

  return (
    <div className={cn(scroll, 'transition-opacity', isFetching && 'opacity-60')}>
      <table className="w-full text-[12.5px]">
        <thead>
          <tr>
            <th className={cn(thCls, 'text-start sticky start-0 z-[2]')}>
              <span className="text-slate-700 normal-case tracking-normal">{fieldLabel(t, d0)}</span>
              <span className="text-slate-300 mx-1">╲</span>
              <span className="normal-case tracking-normal">{fieldLabel(t, d1)}</span>
            </th>
            {colKeys.map((ck) => <th key={String(ck)} className={cn(thCls, 'text-end normal-case tracking-normal max-w-[120px] truncate')} title={valueLabel(t, d1, ck)}>{valueLabel(t, d1, ck, true)}</th>)}
            {showTotals && <th className={cn(thCls, 'text-end')}>{t('analysis.total', { defaultValue: 'Total' })}</th>}
          </tr>
        </thead>
        <tbody>
          {rowKeys.map((rk) => (
            <tr key={String(rk)}>
              <td className="px-3 py-1.5 text-slate-700 border-b border-slate-100 sticky start-0 bg-white max-w-[240px] truncate" title={valueLabel(t, d0, rk)}>{valueLabel(t, d0, rk, true)}</td>
              {colKeys.map((ck) => {
                const r = raw(rk, ck);
                const v = shown(rk, ck);
                return (
                  <Cell
                    key={String(ck)}
                    row={r}
                    value={r ? v : null}
                    masked={masked}
                    percent={pct}
                    // Square-root scale: a few very large cells would otherwise wash every other cell out.
                    heat={heat && v != null && max ? Math.sqrt(v / max) : undefined}
                    onClick={clickable && r ? point([rk, ck], r.values[0]) : undefined}
                  />
                );
              })}
              {showTotals && <Cell value={pctMode === 'row' ? 100 : pctMode === 'total' ? (grand ? ((rowSum.get(rk) ?? 0) / grand) * 100 : null) : pctMode === 'column' ? null : rowSum.get(rk) ?? 0} masked={false} percent={pct} strong />}
            </tr>
          ))}
          {showTotals && (
            <tr className="bg-slate-50">
              <td className="px-3 py-2 font-bold text-slate-900 sticky start-0 bg-slate-50">{t('analysis.total', { defaultValue: 'Total' })}</td>
              {colKeys.map((ck) => (
                <Cell key={String(ck)} value={pctMode === 'column' ? 100 : pctMode === 'total' ? (grand ? ((colSum.get(ck) ?? 0) / grand) * 100 : null) : pctMode === 'row' ? null : colSum.get(ck) ?? 0} masked={false} percent={pct} strong />
              ))}
              <Cell value={pct ? (pctMode === 'total' ? 100 : null) : grand} masked={false} percent={pct} strong />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
