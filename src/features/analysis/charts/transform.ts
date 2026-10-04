import type { TFunction } from 'i18next';
import type { AnalysisAggregateResult, AnalysisBlock, AnalysisResultRow } from '@/types';
import { ANALYSIS_FIELDS, ANALYSIS_FRAME_DIMENSION, ANALYSIS_OTHER_KEY } from '../constants';
import { ANALYSIS_FRAME_CHRONO } from '../mock/frames';
import { frameName, measureLabel, valueLabel } from '../utils/labels';
import type { ChartCategory, ChartSeries, TreeNode } from './options';

export function cellValue(r: AnalysisResultRow, i: number, masked: boolean): number | null {
  if (masked && r.flag) return null;
  return r.values[i] ?? null;
}

export function isAdditive(result: AnalysisAggregateResult, i = 0): boolean {
  const agg = result.measures[i]?.agg;
  return agg === 'count' || agg === 'sum';
}

function uniqueOrdered(rows: AnalysisResultRow[], axis: number, field: string): (string | null)[] {
  const totals = new Map<string | null, number>();
  for (const r of rows) totals.set(r.keys[axis], (totals.get(r.keys[axis]) ?? 0) + (r.values[0] ?? 0));
  const keys = [...totals.keys()];
  if (axis === 0) return keys;
  const order = ANALYSIS_FIELDS[field]?.order;
  return keys.sort((a, b) => {
    if (a === ANALYSIS_OTHER_KEY || a == null) return 1;
    if (b === ANALYSIS_OTHER_KEY || b == null) return -1;
    if (field === ANALYSIS_FRAME_DIMENSION) return ANALYSIS_FRAME_CHRONO.indexOf(a) - ANALYSIS_FRAME_CHRONO.indexOf(b);
    if (order) return order.indexOf(a) - order.indexOf(b);
    if (field === 'reg_year') return a.localeCompare(b);
    return (totals.get(b) ?? 0) - (totals.get(a) ?? 0);
  });
}

export interface CategorySeries {
  categories: ChartCategory[];
  series: ChartSeries[];
  percent: boolean;
  compare: boolean;
}

// Shapes an aggregate result into categories × series for bar/column/line charts.
export function toCategorySeries(result: AnalysisAggregateResult, block: AnalysisBlock, t: TFunction, masked: boolean): CategorySeries {
  const dims = result.dimensions;
  const mode = block.display.percent;
  const rows = result.rows.filter((r) => block.type !== 'line' || r.n > 0 || !r.prev);
  const d0 = dims[0];
  const catKeys = uniqueOrdered(rows, 0, d0);
  const categories = catKeys.map((k) => ({ key: k, label: valueLabel(t, d0, k, true) }));
  const byKey = new Map(rows.map((r) => [r.keys.join('\u0001'), r]));

  let series: ChartSeries[];
  const compare = !!result.compareTo && dims.length === 1 && block.type !== 'line';
  if (dims.length >= 2) {
    const d1 = dims[1];
    const sKeys = uniqueOrdered(rows, 1, d1);
    series = sKeys.map((sk) => ({
      key: sk,
      name: valueLabel(t, d1, sk, true),
      data: catKeys.map((ck) => {
        const r = byKey.get([ck, sk].join('\u0001'));
        return r ? cellValue(r, 0, masked) : 0;
      }),
    }));
  } else if (compare) {
    series = [
      { key: '__prev__', name: frameName(t, result.compareTo), data: catKeys.map((ck) => { const r = byKey.get([ck].join('\u0001')); return r && masked && r.flag ? null : r?.prev?.[0] ?? 0; }) },
      { key: '__curr__', name: frameName(t, result.frame), data: catKeys.map((ck) => { const r = byKey.get([ck].join('\u0001')); return r ? cellValue(r, 0, masked) : 0; }) },
    ];
  } else {
    series = result.measures.map((m, mi) => ({
      key: m.id,
      name: measureLabel(t, m, block.query.entity),
      data: catKeys.map((ck) => { const r = byKey.get([ck].join('\u0001')); return r ? cellValue(r, mi, masked) : 0; }),
    }));
  }

  const percent = mode !== 'none' && isAdditive(result);
  if (percent) {
    if (mode === 'total' || (mode === 'column' && series.length === 1) || (mode === 'row' && series.length === 1 && !compare)) {
      series = series.map((s) => {
        const tot = s.data.reduce<number>((a, v) => a + (v ?? 0), 0);
        return { ...s, data: s.data.map((v) => (v == null || !tot ? v : (v / tot) * 100)) };
      });
    } else if (mode === 'row') {
      const sums = categories.map((_, ci) => series.reduce((a, s) => a + (s.data[ci] ?? 0), 0));
      series = series.map((s) => ({ ...s, data: s.data.map((v, ci) => (v == null || !sums[ci] ? v : (v / sums[ci]) * 100)) }));
    } else {
      series = series.map((s) => {
        const tot = s.data.reduce<number>((a, v) => a + (v ?? 0), 0);
        return { ...s, data: s.data.map((v) => (v == null || !tot ? v : (v / tot) * 100)) };
      });
    }
  }
  return { categories, series, percent, compare };
}

export function toTree(result: AnalysisAggregateResult, t: TFunction, masked: boolean): TreeNode[] {
  const [d0, d1] = result.dimensions;
  const top = new Map<string, TreeNode>();
  for (const r of result.rows) {
    const v = cellValue(r, 0, masked);
    if (v == null || v <= 0) continue;
    const k0 = r.keys[0];
    const id = String(k0);
    let node = top.get(id);
    if (!node) {
      node = { key: k0, name: valueLabel(t, d0, k0, true), value: 0, keys: [k0], children: d1 ? [] : undefined };
      top.set(id, node);
    }
    node.value += v;
    if (d1) node.children!.push({ key: r.keys[1], name: valueLabel(t, d1, r.keys[1], true), value: v, keys: [k0, r.keys[1]] });
  }
  return [...top.values()].sort((a, b) => b.value - a.value);
}
