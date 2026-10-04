import type { EChartOption } from '@/lib/charts';
import { CHART_COLOR, CHART_GRAY, fmtNum, hexA, vGrad } from '@/lib/charts/theme';
import { ANALYSIS_OTHER_KEY } from '../constants';
import { ANALYSIS_OTHER_COLOR, ANALYSIS_PALETTE } from '../constants/palette';
import { formatValue } from '../utils/labels';

// Every data item carries `keys` so a click maps back to a cross-filter / drill / records action.

export interface ChartCategory { key: string | null; label: string }
export interface ChartSeries { key: string | null; name: string; data: (number | null)[]; color?: string }

const G = CHART_GRAY;
const TOOLTIP_BASE = { confine: true };

export function colorFor(key: string | null, index: number): string {
  if (key === ANALYSIS_OTHER_KEY || key == null) return ANALYSIS_OTHER_COLOR;
  return ANALYSIS_PALETTE[index % ANALYSIS_PALETTE.length];
}

function fmt(v: number | null | undefined, percent: boolean) {
  return v == null ? '—' : formatValue(v, { percent });
}

interface BarOpts {
  categories: ChartCategory[];
  series: ChartSeries[];
  horizontal: boolean;
  stacked: boolean;
  percent: boolean;
  showValues: boolean;
  animate?: boolean;
  // Two-series compare: series[0] = comparison frame (ghost), series[1] = current
  compare?: boolean;
}

export function barOption(o: BarOpts): EChartOption {
  const multi = o.series.length > 1;
  const labelW = o.horizontal ? Math.min(150, Math.max(60, ...o.categories.map((c) => c.label.length * 6.2))) : 0;
  const series = o.series.map((s, si) => {
    const isGhost = o.compare && si === 0;
    const base = s.color ?? (o.compare || !multi ? CHART_COLOR.adaam : colorFor(s.key, si));
    return {
      name: s.name,
      type: 'bar',
      // Series-level colour keeps the legend swatch in sync with the bars.
      itemStyle: { color: isGhost ? hexA(CHART_COLOR.adaam, 0.28) : base },
      stack: o.stacked && !o.compare ? 'total' : undefined,
      barMaxWidth: o.horizontal ? 16 : 38,
      barGap: o.compare ? '10%' : '20%',
      data: s.data.map((v, i) => {
        const cat = o.categories[i];
        const catColor = !multi && cat.key === ANALYSIS_OTHER_KEY ? ANALYSIS_OTHER_COLOR : base;
        return {
          value: v,
          keys: multi && !o.compare ? [cat.key, s.key] : [cat.key],
          itemStyle: {
            color: isGhost ? hexA(CHART_COLOR.adaam, 0.28) : o.horizontal ? catColor : vGrad(catColor, 1, 0.72),
            borderRadius: o.stacked && !o.compare ? 0 : o.horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0],
          },
        };
      }),
      label: o.showValues && (!o.stacked || o.compare) && !isGhost
        ? { show: true, position: o.horizontal ? 'right' : 'top', color: G[700], fontSize: 10.5, fontWeight: 700, formatter: (x: { value: number }) => fmt(x.value, o.percent) }
        : undefined,
      emphasis: { focus: multi ? 'series' : 'none', itemStyle: { color: CHART_COLOR.adaamDeep } },
    };
  });
  const catAxis = {
    type: 'category',
    data: o.categories.map((c) => c.label),
    inverse: o.horizontal,
    axisLine: { show: !o.horizontal, lineStyle: { color: G[200] } },
    axisLabel: o.horizontal
      ? { color: G[700], fontSize: 11, width: labelW, overflow: 'truncate' }
      : { color: G[500], fontSize: 10.5, interval: 0, rotate: o.categories.length > 7 ? 30 : 0, width: 90, overflow: 'truncate' },
  };
  const valAxis = {
    type: 'value',
    max: o.percent && o.stacked && !o.compare ? 100 : undefined,
    splitNumber: 4,
    splitLine: { lineStyle: { color: G.line } },
    axisLabel: { color: G[400], fontSize: 10, formatter: (v: number) => (o.percent ? `${v}%` : formatValue(v, { compact: true })) },
  };
  return {
    animation: o.animate !== false,
    grid: { left: 8, right: o.horizontal ? 56 : 12, top: multi ? 34 : 14, bottom: 8, containLabel: true },
    legend: multi ? { top: 0, left: 0, type: 'scroll' } : undefined,
    tooltip: {
      ...TOOLTIP_BASE,
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: hexA(CHART_COLOR.night, 0.04) } },
      formatter: (ps: { name: string; marker: string; seriesName: string; value: number | null }[]) =>
        [`<b>${ps[0]?.name ?? ''}</b>`, ...ps.map((p) => `${p.marker} ${multi ? `${p.seriesName}: ` : ''}<b>${fmt(p.value, o.percent)}</b>`)].join('<br/>'),
    },
    xAxis: o.horizontal ? valAxis : catAxis,
    yAxis: o.horizontal ? catAxis : valAxis,
    series,
  };
}

export function lineOption(o: { categories: ChartCategory[]; series: ChartSeries[]; percent: boolean; showValues: boolean; animate?: boolean }): EChartOption {
  const multi = o.series.length > 1;
  return {
    animation: o.animate !== false,
    grid: { left: 8, right: multi ? 16 : 24, top: multi ? 36 : 20, bottom: 8, containLabel: true },
    legend: multi ? { top: 0, left: 0, type: 'scroll' } : undefined,
    tooltip: {
      ...TOOLTIP_BASE,
      trigger: 'axis',
      axisPointer: { type: 'line', lineStyle: { color: G[300], type: 'dashed' } },
      formatter: (ps: { name: string; marker: string; seriesName: string; value: number | null }[]) =>
        [`<b>${ps[0]?.name ?? ''}</b>`, ...ps.map((p) => `${p.marker} ${multi ? `${p.seriesName}: ` : ''}<b>${fmt(p.value, o.percent)}</b>`)].join('<br/>'),
    },
    xAxis: { type: 'category', boundaryGap: o.categories.length <= 6, data: o.categories.map((c) => c.label), axisLabel: { color: G[500], fontSize: 10.5 } },
    yAxis: { type: 'value', scale: true, splitLine: { lineStyle: { color: G.line } }, axisLabel: { color: G[400], fontSize: 10, formatter: (v: number) => (o.percent ? `${v}%` : formatValue(v, { compact: true })) } },
    series: o.series.map((s, si) => {
      const col = s.color ?? (multi ? colorFor(s.key, si) : CHART_COLOR.adaam);
      return {
        name: s.name,
        type: 'line',
        smooth: 0.25,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { width: 2.6, color: col },
        itemStyle: { color: col, borderColor: '#fff', borderWidth: 2 },
        areaStyle: multi ? undefined : { color: vGrad(col, 0.26, 0.02) },
        label: o.showValues && !multi ? { show: true, position: 'top', color: G[700], fontSize: 10.5, fontWeight: 700, formatter: (x: { value: number }) => fmt(x.value, o.percent) } : undefined,
        data: s.data.map((v, i) => ({ value: v, keys: [o.categories[i].key, s.key] })),
      };
    }),
  };
}

interface TreeNode { key: string | null; name: string; value: number; children?: TreeNode[]; keys: (string | null)[] }

export function treemapOption(o: { nodes: TreeNode[]; percent: boolean; total: number; animate?: boolean }): EChartOption {
  const colored = o.nodes.map((n, i) => ({ ...n, itemStyle: { color: colorFor(n.key, i) } }));
  return {
    animation: o.animate !== false,
    tooltip: {
      ...TOOLTIP_BASE,
      formatter: (x: { name: string; value: number; treePathInfo?: { name: string }[] }) => {
        const path = (x.treePathInfo ?? []).slice(1).map((p) => p.name).join(' › ');
        return `<b>${path || x.name}</b><br/>${fmtNum(x.value)} · ${o.total ? ((x.value / o.total) * 100).toFixed(1) : 0}%`;
      },
    },
    series: [{
      type: 'treemap',
      roam: false,
      nodeClick: false,
      breadcrumb: { show: false },
      width: '100%',
      height: '100%',
      top: 0,
      left: 0,
      squareRatio: 0.8,
      label: { show: true, fontSize: 11, fontWeight: 600, color: 'white', overflow: 'truncate', formatter: (x: { name: string; value: number }) => `${x.name}\n{v|${formatValue(x.value, { compact: true })}}`, rich: { v: { fontSize: 10, color: hexA('#FFFFFF', 0.8), fontWeight: 400 } } },
      upperLabel: { show: true, height: 20, color: '#fff', fontSize: 11, fontWeight: 700 },
      itemStyle: { borderColor: '#fff', borderWidth: 2, gapWidth: 2, borderRadius: 4 },
      levels: [
        { itemStyle: { borderWidth: 0, gapWidth: 3 } },
        { itemStyle: { gapWidth: 1, borderColorSaturation: 0.6 }, colorSaturation: [0.35, 0.55] },
      ],
      data: colored,
    }],
  };
}

export function sunburstOption(o: { nodes: TreeNode[]; total: number; animate?: boolean }): EChartOption {
  const colored = o.nodes.map((n, i) => ({
    ...n,
    itemStyle: { color: colorFor(n.key, i) },
    children: n.children?.map((c, j) => ({ ...c, itemStyle: { color: hexA(colorFor(n.key, i), 0.45 + 0.5 * (1 - j / Math.max(1, (n.children?.length ?? 1)))) } })),
  }));
  return {
    animation: o.animate !== false,
    tooltip: {
      ...TOOLTIP_BASE,
      formatter: (x: { name: string; value: number; treePathInfo?: { name: string }[] }) => {
        const path = (x.treePathInfo ?? []).slice(1).map((p) => p.name).join(' › ');
        return `<b>${path || x.name}</b><br/>${fmtNum(x.value)} · ${o.total ? ((x.value / o.total) * 100).toFixed(1) : 0}%`;
      },
    },
    series: [{
      type: 'sunburst',
      radius: ['14%', '94%'],
      nodeClick: false,
      sort: undefined,
      itemStyle: { borderColor: '#fff', borderWidth: 1.5, borderRadius: 3 },
      label: { rotate: 'radial', fontSize: 10, color: '#fff', minAngle: 12, overflow: 'truncate', width: 70 },
      levels: [{}, { r0: '14%', r: '56%', label: { fontSize: 10.5, fontWeight: 700 } }, { r0: '56%', r: '94%', label: { fontSize: 9.5, align: 'right' } }],
      data: colored,
    }],
  };
}

export function deltaOption(o: { items: { key: string | null; label: string; curr: number; prev: number }[]; percent: boolean; animate?: boolean; fromLabel: string; toLabel: string }): EChartOption {
  const rows = o.items.map((it) => {
    const abs = it.curr - it.prev;
    const pct = it.prev ? (abs / it.prev) * 100 : null;
    return { ...it, abs, pct, v: o.percent ? pct ?? 0 : abs };
  }).sort((a, b) => Math.abs(b.v) - Math.abs(a.v));
  const labelW = Math.min(150, Math.max(60, ...rows.map((r) => r.label.length * 6.2)));
  return {
    animation: o.animate !== false,
    grid: { left: 8, right: 70, top: 10, bottom: 8, containLabel: true },
    tooltip: {
      ...TOOLTIP_BASE,
      trigger: 'item',
      formatter: (x: { data: { row: (typeof rows)[number] } }) => {
        const r = x.data.row;
        return `<b>${r.label}</b><br/>${o.fromLabel}: ${fmtNum(r.prev)}<br/>${o.toLabel}: ${fmtNum(r.curr)}<br/>Δ <b>${r.abs >= 0 ? '+' : ''}${fmtNum(r.abs)}</b>${r.pct != null ? ` (${r.pct >= 0 ? '+' : ''}${r.pct.toFixed(1)}%)` : ''}`;
      },
    },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: G.line } }, axisLabel: { color: G[400], fontSize: 10, formatter: (v: number) => (o.percent ? `${v}%` : formatValue(v, { compact: true })) } },
    yAxis: { type: 'category', inverse: true, data: rows.map((r) => r.label), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: G[700], fontSize: 11, width: labelW, overflow: 'truncate' } },
    series: [{
      type: 'bar',
      barMaxWidth: 14,
      data: rows.map((r) => ({
        value: Math.round(r.v * 10) / 10,
        keys: [r.key],
        row: r,
        itemStyle: { color: r.v >= 0 ? CHART_COLOR.pos : CHART_COLOR.neg, borderRadius: r.v >= 0 ? [0, 6, 6, 0] : [6, 0, 0, 6] },
        label: { show: true, position: r.v >= 0 ? 'right' : 'left', color: r.v >= 0 ? CHART_COLOR.posText : CHART_COLOR.negText, fontSize: 10.5, fontWeight: 700, formatter: () => (o.percent ? `${r.v >= 0 ? '+' : ''}${r.v.toFixed(1)}%` : `${r.abs >= 0 ? '+' : ''}${fmtNum(r.abs)}`) },
      })),
      markLine: { silent: true, symbol: 'none', data: [{ xAxis: 0 }], lineStyle: { color: G[300], type: 'solid' }, label: { show: false } },
    }],
  };
}

export function waterfallOption(o: { steps: { label: string; value: number; kind: 'total' | 'up' | 'down' }[]; animate?: boolean }): EChartOption {
  const base: number[] = [];
  const vis: { value: number; itemStyle: { color: string; borderRadius: number[] } }[] = [];
  let running = 0;
  for (const s of o.steps) {
    if (s.kind === 'total') {
      base.push(0);
      running = s.value;
      vis.push({ value: s.value, itemStyle: { color: CHART_COLOR.adaam, borderRadius: [6, 6, 0, 0] } });
    } else if (s.kind === 'up') {
      base.push(running);
      running += s.value;
      vis.push({ value: s.value, itemStyle: { color: CHART_COLOR.pos, borderRadius: [4, 4, 0, 0] } });
    } else {
      running -= s.value;
      base.push(running);
      vis.push({ value: s.value, itemStyle: { color: CHART_COLOR.neg, borderRadius: [0, 0, 4, 4] } });
    }
  }
  const lo = Math.min(...o.steps.filter((s) => s.kind === 'total').map((s) => s.value));
  const floor = Math.max(0, Math.floor((lo * 0.9) / 1000) * 1000);
  return {
    animation: o.animate !== false,
    grid: { left: 8, right: 12, top: 26, bottom: 8, containLabel: true },
    tooltip: {
      ...TOOLTIP_BASE,
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: hexA(CHART_COLOR.night, 0.04) } },
      formatter: (ps: { name: string; seriesIndex: number; value: number; dataIndex: number }[]) => {
        const p = ps.find((x) => x.seriesIndex === 1);
        if (!p) return '';
        const s = o.steps[p.dataIndex];
        const sign = s.kind === 'up' ? '+' : s.kind === 'down' ? '−' : '';
        return `<b>${p.name}</b><br/>${sign}${fmtNum(p.value)}`;
      },
    },
    xAxis: { type: 'category', data: o.steps.map((s) => s.label), axisLabel: { color: G[500], fontSize: 10.5, interval: 0 } },
    yAxis: { type: 'value', min: floor, splitLine: { lineStyle: { color: G.line } }, axisLabel: { color: G[400], fontSize: 10, formatter: (v: number) => formatValue(v, { compact: true }) } },
    series: [
      { type: 'bar', stack: 'w', silent: true, itemStyle: { color: 'transparent' }, data: base.map((b, i) => (o.steps[i].kind === 'total' ? floor : b)), barMaxWidth: 46 },
      {
        type: 'bar',
        stack: 'w',
        barMaxWidth: 46,
        data: vis.map((v, i) => (o.steps[i].kind === 'total' ? { ...v, value: v.value - floor } : v)),
        label: {
          show: true,
          position: 'top',
          fontSize: 10.5,
          fontWeight: 700,
          color: G[700],
          formatter: (x: { dataIndex: number }) => {
            const s = o.steps[x.dataIndex];
            return `${s.kind === 'up' ? '+' : s.kind === 'down' ? '−' : ''}${fmtNum(s.value)}`;
          },
        },
      },
    ],
  };
}

export function sankeyOption(o: {
  links: { from: string; fromLabel: string; to: string; toLabel: string; value: number; fromColor: string; toColor: string }[];
  fromTitle: string;
  toTitle: string;
  animate?: boolean;
}): EChartOption {
  const nodes = new Map<string, { name: string; label: string; color: string }>();
  for (const l of o.links) {
    if (!nodes.has(`a|${l.from}`)) nodes.set(`a|${l.from}`, { name: `a|${l.from}`, label: l.fromLabel, color: l.fromColor });
    if (!nodes.has(`b|${l.to}`)) nodes.set(`b|${l.to}`, { name: `b|${l.to}`, label: l.toLabel, color: l.toColor });
  }
  const labelOf = (n: string) => nodes.get(n)?.label ?? n;
  return {
    animation: o.animate !== false,
    tooltip: {
      ...TOOLTIP_BASE,
      trigger: 'item',
      formatter: (x: { dataType: string; data: { source?: string; target?: string; value?: number; name?: string }; value: number }) =>
        x.dataType === 'edge'
          ? `${labelOf(x.data.source!)} → ${labelOf(x.data.target!)}<br/><b>${fmtNum(x.data.value)}</b>`
          : `<b>${labelOf(x.data.name!)}</b><br/>${fmtNum(x.value)}`,
    },
    graphic: [
      { type: 'text', left: 0, top: 0, style: { text: o.fromTitle, fontSize: 11, fontWeight: 700, fill: G[500] } },
      { type: 'text', right: 0, top: 0, style: { text: o.toTitle, fontSize: 11, fontWeight: 700, fill: G[500], align: 'right' } },
    ],
    series: [{
      type: 'sankey',
      top: 22,
      bottom: 6,
      left: 4,
      right: 110,
      nodeWidth: 12,
      nodeGap: 9,
      layoutIterations: 64,
      draggable: false,
      emphasis: { focus: 'adjacency' },
      label: { color: G[700], fontSize: 11, formatter: (x: { name: string }) => labelOf(x.name) },
      lineStyle: { color: 'gradient', opacity: 0.32, curveness: 0.5 },
      itemStyle: { borderWidth: 0, borderRadius: 3 },
      data: [...nodes.values()].map((n) => ({ name: n.name, itemStyle: { color: n.color }, label: n.name.startsWith('a|') ? { position: 'right' } : undefined })),
      links: o.links.map((l) => ({ source: `a|${l.from}`, target: `b|${l.to}`, value: l.value })),
    }],
  };
}

export type { TreeNode };
