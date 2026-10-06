// Chart option builders — ports of SBR-design's app/charts.jsx trend/donut/columns/hbars/pareto/
// qatarMap, trimmed to what the Executive Home dashboard actually uses. Pages describe data
// shapes; these turn that into ECharts option objects (grid, tooltip, series, ...).
import * as echarts from 'echarts';
import type { EChartOption, EChartOptionInput } from './EChart';
import { CHART_COLOR, CHART_GRAY as G, CHART_PALETTE, fmtNum, hexA, pct, vGrad } from './theme';

const C = CHART_COLOR;

// A wrapping legend grows by one row per overflow; chart grids reserve that height so it never covers the plot.
const LEGEND_ROW_HEIGHT = 24;
function legendRows(names: string[], width: number): number {
  const available = Math.max(1, width - 8);
  let rows = 1;
  let used = 0;
  for (const name of names) {
    const itemWidth = 9 + 5 + name.length * 6.6 + 14;
    if (used > 0 && used + itemWidth > available) {
      rows += 1;
      used = itemWidth;
    } else {
      used += itemWidth;
    }
  }
  return rows;
}

// ---------- trend ----------
export interface TrendSeries {
  name: string;
  data: (number | null)[];
  color?: string;
  area?: boolean;
  dashed?: boolean;
  endLabel?: boolean;
}
export interface TrendOptions {
  categories: string[];
  series: TrendSeries[];
  yMin?: number;
  yMax?: number;
  unit?: string;
  format?: (v: number) => string;
}

export function trend(o: TrendOptions): EChartOptionInput {
  const legend = o.series.length > 1;
  // A single reading has nothing to connect a line/area to, so it rendered as a bare dot. A
  // leading, blank-labeled category holding that same reading gives it a flat line/area instead
  // — it never asserts an earlier reading actually existed, since the blank category carries no
  // date and the segment stays perfectly flat.
  const singlePoint = o.categories.length === 1;
  const categories = singlePoint ? ['', ...o.categories] : o.categories;
  const seriesInput = singlePoint ? o.series.map((s) => ({ ...s, data: [s.data[0] ?? null, ...s.data] })) : o.series;
  const last = categories.length - 1;
  // With several series every line gets its own end pill, stacked in a right-hand gutter.
  const sideLabels = legend;

  const series = seriesInput.map((s, si) => {
    const col = s.color || CHART_PALETTE[si % CHART_PALETTE.length];
    const pill = {
      formatter: (x: { value: number }) => (o.format || fmtNum)(x.value),
      color: '#fff',
      backgroundColor: col,
      borderRadius: 10,
      padding: [3, 7],
      fontSize: 11,
      fontWeight: 700,
    };
    const data = s.data.map((v, i) => {
      if (i !== last || s.endLabel === false) return v;
      if (sideLabels) return { value: v, symbolSize: 9 };
      return { value: v, symbolSize: 9, label: { ...pill, show: true, position: 'top', distance: 8 } };
    });
    const st: Record<string, unknown> = {
      name: s.name,
      type: 'line',
      data,
      smooth: 0.35,
      symbol: 'circle',
      symbolSize: 5,
      showSymbol: true,
      itemStyle: { color: col, borderColor: '#fff', borderWidth: 1.5 },
      lineStyle: { width: s.dashed ? 2 : 2.5, color: col, type: s.dashed ? 'dashed' : 'solid' },
      emphasis: { focus: 'series', scale: 1.6 },
      z: 3 - si,
      // Matches SBR-design's reference trend() — nudges apart end labels that would overlap.
      labelLayout: { hideOverlap: false, moveOverlap: 'shiftY' },
    };
    // Only the top (first, i.e. largest) series keeps a visible end-label pill — with several
    // series the rest of the pills read as visual noise once the lines themselves are colour-coded
    // by the legend, and every value (not just the top one) is already on the shared axis tooltip
    // on hover, so nothing is actually lost by not drawing them at rest.
    if (sideLabels && si === 0 && s.endLabel !== false) {
      st.endLabel = { ...pill, show: true, distance: 16, formatter: (x: { value: number }) => (o.format || fmtNum)(x.value) };
      st.labelLine = { show: true, length2: 0, lineStyle: { color: col, width: 1 } };
    }
    if (s.area !== false && si === 0) st.areaStyle = { color: vGrad(col) };
    return st;
  });
  const build = ((width: number): EChartOption => {
    const legendExtra = legend ? (legendRows(o.series.map((s) => s.name), width) - 1) * LEGEND_ROW_HEIGHT : 0;
    return {
      // Extra top clearance beyond the usual legend allowance — the last point always carries a
      // pill-shaped end label placed above it, and when that point sits near the axis max (a
      // single-point series is the extreme case) the pill had too little room and got clipped
      // against the chart's own top edge.
      // A wider right edge with several series leaves room for the side end-label column.
      grid: { left: 42, right: sideLabels ? 68 : 22, top: (legend ? 46 : 34) + legendExtra, bottom: 26 },
      legend: legend ? { top: 0, left: 0 } : undefined,
      tooltip: { trigger: 'axis', axisPointer: { type: 'line', lineStyle: { color: G[300], type: 'dashed' } }, valueFormatter: (v: unknown) => `${(o.format || fmtNum)(v as number)}${o.unit || ''}` },
      xAxis: { type: 'category', data: categories, boundaryGap: false, axisLabel: { margin: 10 } },
      yAxis: { type: 'value', min: o.yMin, max: o.yMax, splitNumber: 4, axisLabel: { formatter: (v: number) => fmtNum(v) }, scale: o.yMin == null },
      series,
    };
  }) as EChartOptionInput & { optionKey?: string };
  build.optionKey = JSON.stringify([o.categories, o.series, o.yMin, o.yMax, o.unit]);
  return build;
}

// ---------- donut ----------
export interface DonutItem { name: string; value: number; color?: string; }
export interface DonutOptions {
  items: DonutItem[];
  totalLabel?: string;
  legendWidth?: number;
  // SBR-design's compact legend: name + count, no share, and the name column sized to the longest name.
  compact?: boolean;
}

export function donut(o: DonutOptions): EChartOptionInput {
  const total = o.items.reduce((s, i) => s + (i.value || 0), 0);
  const center = { value: fmtNum(total), label: o.totalLabel || '' };

  function legendCfg(side: boolean, nameW: number) {
    const rich = {
      v: { color: G[900], fontSize: 11.5, fontWeight: 700, padding: [0, 0, 0, 10] },
      p: { color: G[400], fontSize: 10.5, padding: [0, 0, 0, 6] },
      n: { color: G[700], fontSize: 11.5, width: nameW, overflow: 'truncate' },
    };
    const maxChars = Math.max(4, Math.floor((nameW - 2) / 6.35));
    const fmt = (name: string) => {
      const it = o.items.find((i) => i.name === name);
      if (!it) return name;
      const shown = name.length > maxChars ? `${name.slice(0, maxChars - 1)}…` : name;
      return `{n|${shown}}{v|${fmtNum(it.value)}}{p|${pct(it.value, total)}%}`;
    };
    const fmtCompact = (name: string) => {
      const it = o.items.find((i) => i.name === name);
      if (!it) return name;
      const shown = name.length > maxChars ? `${name.slice(0, maxChars - 1)}…` : name;
      return `{n|${shown}}{v|${fmtNum(it.value)}}`;
    };
    const formatter = o.compact ? fmtCompact : fmt;
    if (!side) return { bottom: 0, left: 'center', formatter, textStyle: { rich } };
    return { orient: 'vertical', right: 6, top: 'middle', itemGap: o.items.length > 5 ? 6 : 8, formatter, textStyle: { rich } };
  }

  // Font size is capped by both text width and a fraction of the hole's own radius — smaller wins.
  function centreLabel(cx: number | string, cy: number | string, innerRadiusPx?: number) {
    if (center.value == null || center.value === '') return undefined;
    const text = String(center.value);

    // ~0.62em is a safe average advance width for bold digits/commas at this font.
    const widthBudget = innerRadiusPx != null ? innerRadiusPx * 2 * 0.7 : 90;
    const widthCap = Math.floor(widthBudget / (text.length * 0.62));

    // 0.42 of the radius keeps the number (and the caption below it) clear of the hole's edge.
    const radiusCap = innerRadiusPx != null ? Math.round(innerRadiusPx * 0.42) : 22;

    const size = Math.max(9, Math.min(22, widthCap, radiusCap));
    const yNum = typeof cy === 'number' ? Math.round(cy + size * 0.11) : cy;
    const els: Record<string, unknown>[] = [
      { type: 'text', x: cx, y: yNum, silent: true, z: 20, style: { text, align: 'center', verticalAlign: 'middle', fontSize: size, fontWeight: 800, fill: G[900] } },
    ];
    if (center.label) {
      const capY = typeof yNum === 'number' ? Math.round(yNum + size * 0.5 + 3) : yNum;
      // The caption sits off-centre, where a circle is narrower, so it needs its own fit check.
      const label = String(center.label);
      let captionSize = 10.5;
      if (typeof cy === 'number' && typeof capY === 'number' && innerRadiusPx != null) {
        // Offset of the caption LINE's own vertical centre (not just its top edge) from cy.
        const capCenterOffset = (capY - cy) + 10.5 * 0.6;
        const chordWidth = 2 * Math.sqrt(Math.max(0, innerRadiusPx ** 2 - capCenterOffset ** 2)) * 0.85;
        // 0.55em/char matches this file's own legend-text convention (see legendCfg's maxChars).
        captionSize = Math.max(6, Math.min(10.5, Math.floor(chordWidth / (label.length * 0.55))));
      }
      els.push({ type: 'text', x: cx, y: capY, silent: true, z: 20, style: { text: label, align: 'center', verticalAlign: 'top', fontSize: captionSize, fill: G[400] } });
    }
    return els;
  }

  function base(side: boolean, ringCx: number | string, ringCy: number | string, rOuter: (number | string)[], nameW: number): EChartOption {
    return {
      tooltip: { trigger: 'item', formatter: (x: { marker: string; name: string; value: number }) => `${x.marker} <b>${x.name}</b><br/>${fmtNum(x.value)} · ${pct(x.value, total)}%` },
      legend: legendCfg(side, nameW),
      graphic: centreLabel(ringCx, ringCy, typeof rOuter[0] === 'number' ? rOuter[0] : undefined),
      series: [{
        type: 'pie',
        radius: rOuter,
        center: [ringCx, ringCy],
        avoidLabelOverlap: false,
        itemStyle: { borderColor: '#fff', borderWidth: 2.5, borderRadius: 5 },
        label: { show: false },
        labelLine: { show: false },
        emphasis: { scale: true, scaleSize: 7, itemStyle: { shadowBlur: 14, shadowColor: 'rgba(3,15,31,.18)' } },
        data: o.items.map((i, k) => ({ name: i.name, value: i.value, itemStyle: { color: i.color || CHART_PALETTE[k % CHART_PALETTE.length] } })),
      }],
    };
  }

  const build = ((w: number, h: number) => {
    if (!w || !h) return base(true, '50%', '50%', ['58%', '80%'], o.legendWidth || 88);
    const longest = o.items.reduce((m, i) => Math.max(m, i.name.length), 0);
    const valueW = String(fmtNum(Math.max(0, ...o.items.map((i) => i.value || 0)))).length * 7 + 6;
    let nameW = o.compact ? Math.min(longest * 6.4 + 4, 132) : o.legendWidth || 88;
    const entryExtra = o.compact ? 20 + 10 + valueW : 20 + 10 + 40 + 6 + 26;
    let ringSpace = w - (nameW + entryExtra + 12);
    // Compact legends squeeze the name column before giving up and dropping the legend underneath.
    if (o.compact && ringSpace < 104) {
      nameW = Math.max(58, nameW - (104 - ringSpace));
      ringSpace = w - (nameW + entryExtra + 12);
    }
    if (ringSpace < 96) {
      const entryW = nameW + entryExtra + 10;
      const perRow = Math.max(1, Math.floor(w / entryW));
      const rows = Math.ceil(o.items.length / perRow);
      // A wrapped legend row renders ~25px tall (text + itemGap); budget that plus a fixed gap so the ring never touches it.
      const legendH = rows * 25;
      const ringLegendGap = 12;
      const avail = h - legendH - ringLegendGap;
      const r = Math.max(20, Math.min(w, avail) / 2 - 5);
      return base(false, Math.round(w / 2), Math.round(avail / 2), [Math.round(r * 0.62), Math.round(r)], nameW);
    }
    const r = Math.max(24, Math.min(ringSpace, h) / 2 - 6);
    return base(true, Math.round(ringSpace / 2), Math.round(h / 2), [Math.round(r * 0.75), Math.round(r)], nameW);
  }) as EChartOptionInput & { optionKey?: string };
  build.optionKey = JSON.stringify(o.compact ? [o.items, o.totalLabel, o.legendWidth, true] : [o.items, o.totalLabel, o.legendWidth]);
  return build;
}

// ---------- columns (vertical bars) ----------
export interface ColumnsSeries { name: string; data: number[]; color?: string; }
export interface ColumnsOptions {
  categories: string[];
  series: ColumnsSeries[];
  gradient?: boolean;
  labels?: boolean;
  right?: number;
  xFontSize?: number;
  greyIndex?: number;
}

export function columns(o: ColumnsOptions): EChartOption {
  const n = o.series.length;
  const series = o.series.map((s, si) => {
    const col = s.color || CHART_PALETTE[si % CHART_PALETTE.length];
    return {
      name: s.name,
      type: 'bar',
      barMaxWidth: 40,
      data: s.data.map((v, i) => ({ value: v, itemStyle: i === o.greyIndex ? { color: '#D1D5DB' } : undefined })),
      itemStyle: { color: o.gradient ? vGrad(col, 1, 0.55) : col, borderRadius: [6, 6, 0, 0] },
      label: o.labels ? { show: true, position: 'top', color: G[700], fontSize: 11, fontWeight: 700, formatter: (x: { value: number }) => fmtNum(x.value) } : undefined,
    };
  });
  return {
    grid: { left: 40, right: o.right || 12, top: n > 1 ? 36 : 24, bottom: 26 },
    legend: n > 1 ? { top: 0, left: 0 } : undefined,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(3,15,31,.04)' } },
      formatter: (ps: { name: string; marker: string; seriesName: string; value: number }[]) =>
        [`<b>${ps[0].name}</b>`, ...ps.map((p) => `${p.marker} ${p.seriesName}: <b>${fmtNum(p.value)}</b>`)].join('<br/>'),
    },
    xAxis: { type: 'category', data: o.categories, axisLabel: { interval: 0, fontSize: o.xFontSize || 11, hideOverlap: false } },
    yAxis: { type: 'value', splitNumber: 4, axisLabel: { formatter: (v: number) => fmtNum(v) } },
    series,
  };
}

// ---------- spark (compact trend line; hollow points mark values that are not reported) ----------
export interface SparkOptions {
  data: number[];
  categories: string[];
  color?: string;
  unit?: string;
  format?: (v: number) => string;
  solid?: boolean[];
}

export function spark(o: SparkOptions): EChartOption {
  const col = o.color || C.adaam;
  const last = o.data.length - 1;
  const data = o.data.map((v, i) => {
    if (o.solid) {
      return {
        value: v,
        symbolSize: o.solid[i] ? 7 : 6,
        itemStyle: o.solid[i] ? { color: col, borderColor: '#fff', borderWidth: 1.5 } : { color: '#fff', borderColor: col, borderWidth: 1.5 },
      };
    }
    return i === last ? { value: v, symbolSize: 6, itemStyle: { color: col, borderColor: '#fff', borderWidth: 1.5 } } : v;
  });
  return {
    grid: { left: 3, right: 3, top: 4, bottom: 3 },
    xAxis: { type: 'category', show: false, boundaryGap: false, data: o.categories },
    yAxis: { type: 'value', show: false, scale: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'none' }, valueFormatter: (v: unknown) => `${(o.format || fmtNum)(v as number)}${o.unit || ''}` },
    series: [{
      type: 'line', data, smooth: 0.4, showSymbol: !!o.solid, symbol: 'circle', symbolSize: 0,
      lineStyle: { width: 2, color: col }, areaStyle: { color: vGrad(col, 0.3, 0) }, itemStyle: { color: col },
    }],
  };
}

// ---------- targetColumns: SBR-design's columns() with stacking, a target line, y max and unit ----------
export interface TargetColumnsOptions {
  categories: string[];
  series: ColumnsSeries[];
  stacked?: boolean;
  gradient?: boolean;
  labels?: boolean;
  yMax?: number;
  unit?: string;
  refLines?: { value: number; label: string; color?: string }[];
}

export function targetColumns(o: TargetColumnsOptions): EChartOption {
  const n = o.series.length;
  const series: Record<string, unknown>[] = o.series.map((s, si) => {
    const col = s.color || CHART_PALETTE[si % CHART_PALETTE.length];
    const lastOrSingle = !o.stacked || si === n - 1;
    return {
      name: s.name,
      type: 'bar',
      stack: o.stacked ? 'a' : undefined,
      barMaxWidth: 28,
      data: s.data,
      itemStyle: { color: o.gradient ? vGrad(col, 1, 0.55) : col, borderRadius: lastOrSingle ? [6, 6, 0, 0] : 0 },
      label: o.labels && lastOrSingle
        ? {
            show: true, position: 'top', color: G[700], fontSize: 11, fontWeight: 700,
            formatter: (x: { value: number; dataIndex: number }) =>
              fmtNum(o.stacked ? o.series.reduce((sum, q) => sum + (q.data[x.dataIndex] || 0), 0) : x.value),
          }
        : undefined,
      emphasis: { focus: o.stacked ? 'series' : 'none' },
    };
  });
  if (o.refLines && series[0]) {
    series[0].markLine = {
      silent: true,
      symbol: 'none',
      data: o.refLines.map((r) => ({ yAxis: r.value, lineStyle: { color: r.color || G[400], type: 'dashed', width: 1.2 }, label: { formatter: r.label, position: 'insideEndTop', color: r.color || G[500], fontSize: 10, fontWeight: 700 } })),
    };
  }
  return {
    grid: { left: 40, right: 12, top: n > 1 ? 36 : 24, bottom: 26 },
    legend: n > 1 ? { top: 0, left: 0 } : undefined,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(3,15,31,.04)' } },
      formatter: (ps: { name: string; marker: string; seriesName: string; value: number }[]) =>
        [`<b>${ps[0].name}</b>`, ...ps.map((p) => `${p.marker} ${p.seriesName}: <b>${fmtNum(p.value)}${o.unit || ''}</b>`)].join('<br/>'),
    },
    xAxis: { type: 'category', data: o.categories, axisLabel: { interval: 0, fontSize: 11, hideOverlap: false } },
    yAxis: { type: 'value', max: o.yMax, splitNumber: 4, axisLabel: { formatter: (v: number) => fmtNum(v) } },
    series,
  };
}

// ---------- gauge (ring 0..max) ----------
export interface GaugeOptions {
  value: number;
  max?: number;
  color?: string;
  width?: number;
  valueSize?: number;
  format?: (v: number) => string;
}

export function gauge(o: GaugeOptions): EChartOption {
  const color = o.color || C.adaam;
  const width = o.width || 12;
  return {
    tooltip: { show: false },
    series: [{
      type: 'gauge',
      startAngle: 90,
      endAngle: -270,
      min: 0,
      max: o.max || 100,
      radius: '96%',
      center: ['50%', '50%'],
      progress: { show: true, roundCap: true, width, itemStyle: { color, shadowBlur: 8, shadowColor: hexA(color, 0.25) } },
      axisLine: { roundCap: true, lineStyle: { width, color: [[1, G.line]] } },
      pointer: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      title: { show: false },
      detail: {
        valueAnimation: true, offsetCenter: [0, 0], fontSize: o.valueSize || 26, fontWeight: 800, color: G[900],
        formatter: (v: number) => (o.format ? o.format(v) : String(Math.round(v * 10) / 10)),
      },
      data: [{ value: o.value, name: '' }],
    }],
  };
}

// ---------- bubbleGrid (two categorical axes; bubble area = base, colour = rate) ----------

// Diameter for a bubble of a given base; exported so a legend drawn outside the chart uses the same maths.
export function bubbleSizeFor(base: number, max: number, maxBubble = 34): number {
  return 8 + Math.sqrt((base || 0) / (max || 1)) * maxBubble;
}

export interface BubbleAxisItem { key: string; label: string; sub?: string; }
export interface BubbleCell { row: string; col: string; size: number; value: number; label?: string; tip?: string; }
export interface BubbleGridOptions {
  rows: BubbleAxisItem[];
  cols: BubbleAxisItem[];
  cells: BubbleCell[];
  midpoint?: number;
  min?: number;
  max?: number;
  lowColor?: string;
  midColor?: string;
  highColor?: string;
  labelWidth?: number;
  maxBubble?: number;
}

export function bubbleGrid(o: BubbleGridOptions): EChartOption {
  const ri: Record<string, number> = {};
  const ci: Record<string, number> = {};
  o.rows.forEach((r, i) => { ri[r.key] = i; });
  o.cols.forEach((c, i) => { ci[c.key] = i; });
  const maxSize = Math.max(1, ...o.cells.map((c) => c.size || 0));
  const mid = o.midpoint ?? 90;
  const lo = o.min ?? mid - 10;
  const hi = o.max ?? 100;
  const maxBubble = o.maxBubble || 34;
  const bubbleSize = (base: number) => bubbleSizeFor(base, maxSize, maxBubble);
  const data = o.cells
    .filter((c) => ci[c.col] != null && ri[c.row] != null)
    .map((c) => {
      const lbl = c.label || '';
      // The fill is dark at both poles and pale mid-scale, so the printed rate flips to white near the poles.
      const t2 = Math.min(1, Math.abs((c.value ?? mid) - mid) / ((hi - lo) / 2));
      const fits = !!lbl && bubbleSize(c.size) >= 4 + lbl.length * 6.2;
      return { value: [ci[c.col], ri[c.row], c.size, c.value], tip: c.tip, lbl: fits ? lbl : '', label: { show: fits, color: t2 > 0.55 ? '#fff' : G[700] } };
    });
  return {
    grid: { left: 8, right: 16, top: 10, bottom: 14, containLabel: true },
    tooltip: { trigger: 'item', formatter: (p: { data?: { tip?: string } }) => p.data?.tip || '' },
    xAxis: {
      type: 'category',
      position: 'top',
      data: o.cols.map((c) => (c.sub ? `${c.label}\n${c.sub}` : c.label)),
      axisLine: { show: true, lineStyle: { color: G.line } },
      axisTick: { show: false },
      axisLabel: { color: G[700], fontSize: 11, lineHeight: 15 },
      splitLine: { show: true, lineStyle: { color: G.line } },
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: o.rows.map((r) => (r.sub ? `${r.label}\n${r.sub}` : r.label)),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: G[700], fontSize: 11, lineHeight: 15, width: o.labelWidth || 150, overflow: 'truncate' },
      splitLine: { show: true, lineStyle: { color: G.line } },
    },
    visualMap: {
      type: 'continuous', min: lo, max: hi, dimension: 3, calculable: false, show: false,
      inRange: { color: [o.lowColor || '#B23B3B', o.midColor || '#E7E5E4', o.highColor || '#047857'] },
    },
    series: [{
      type: 'scatter',
      data,
      symbolSize: (v: number[]) => bubbleSize(v[2]),
      itemStyle: { borderColor: '#fff', borderWidth: 1.5 },
      label: { show: true, formatter: (p: { data: { lbl?: string } }) => p.data.lbl || '', fontSize: 10, fontWeight: 700 },
      emphasis: { scale: 1.15, itemStyle: { shadowBlur: 12, shadowColor: 'rgba(3,15,31,.25)' } },
    }],
  };
}

// ---------- hbars (horizontal bars) ----------
export interface HBarItem { name: string; value: number; color?: string; sub?: string; }
export interface HBarsSingleOptions {
  items: HBarItem[];
  unit?: string;
  max?: number;
  barWidth?: number;
  labelWidth?: number;
  share?: boolean;
  refLines?: { value: number; label: string; color?: string }[];
  // false hides the value axis (labels and ticks), as SBR-design's compact distribution panels do.
  axis?: boolean;
}

export function hbars(o: HBarsSingleOptions): EChartOption {
  const cats = o.items.map((i) => i.name);
  const total = o.items.reduce((s, i) => s + (i.value || 0), 0);
  const series: Record<string, unknown>[] = [{
    type: 'bar',
    barWidth: o.barWidth || 14,
    data: o.items.map((i) => ({ value: i.value, name: i.name, itemStyle: { color: i.color || C.adaam, borderRadius: [0, 7, 7, 0] }, sub: i.sub })),
    showBackground: true,
    backgroundStyle: { color: G.line, borderRadius: 7 },
    label: {
      show: true,
      position: 'right',
      color: G[700],
      fontSize: 11,
      fontWeight: 700,
      distance: 8,
      formatter: (x: { value: number }) => {
        const v = `${fmtNum(x.value)}${o.unit || ''}`;
        return o.share === false ? v : `${v}  {s|${pct(x.value, total)}%}`;
      },
      rich: { s: { color: G[400], fontSize: 10.5, fontWeight: 400 } },
    },
    emphasis: { itemStyle: { color: C.dune } },
  }];
  if (o.refLines) {
    series[0].markLine = {
      silent: true,
      symbol: 'none',
      data: o.refLines.map((r) => ({ xAxis: r.value, lineStyle: { color: r.color || G[400], type: 'dashed', width: 1.2 }, label: { formatter: r.label, position: 'start', color: r.color || G[500], fontSize: 10, fontWeight: 700 } })),
    };
  }
  return {
    grid: { left: 8, right: o.share === false ? 40 : 64, top: o.refLines ? 20 : 6, bottom: 6, containLabel: true },
    tooltip: {
      trigger: 'item',
      formatter: (x: { name: string; value: number; data?: { sub?: string } }) =>
        `<b>${x.name}</b><br/>${fmtNum(x.value)}${o.unit || ''}${o.share === false ? '' : ` · ${pct(x.value, total)}%`}${x.data?.sub ? `<br/><span style="opacity:.75">${x.data.sub}</span>` : ''}`,
    },
    xAxis: o.axis === false
      ? { type: 'value', show: false, splitLine: { lineStyle: { color: G.line } }, axisLabel: { show: false }, max: o.max }
      : { type: 'value', splitLine: { lineStyle: { color: G.line } }, axisLabel: { formatter: (v: number) => fmtNum(v) }, max: o.max },
    yAxis: { type: 'category', data: cats, inverse: true, axisLine: { show: false }, axisLabel: { color: G[700], fontSize: 11.5, width: o.labelWidth || 96, overflow: 'truncate' } },
    series,
  };
}

export interface HBarsStackedOptions {
  categories: string[];
  series: { name: string; data: number[]; color?: string }[];
  barWidth?: number;
  labelWidth?: number;
}

export function hbarsStacked(o: HBarsStackedOptions): EChartOptionInput {
  const series = o.series.map((s, si, arr) => ({
    name: s.name,
    type: 'bar',
    stack: 'a',
    barWidth: o.barWidth || 14,
    data: s.data,
    itemStyle: { color: s.color || CHART_PALETTE[si], borderRadius: si === arr.length - 1 ? [0, 7, 7, 0] : 0 },
    label: si === arr.length - 1
      ? { show: true, position: 'right', color: G[700], fontSize: 11, fontWeight: 700, distance: 8, formatter: (x: { dataIndex: number }) => fmtNum(arr.reduce((sum, q) => sum + (q.data[x.dataIndex] || 0), 0)) }
      : undefined,
    emphasis: { focus: 'series' },
  }));
  const build = ((width: number): EChartOption => ({
    grid: { left: 8, right: 64, top: 30 + (legendRows(o.series.map((q) => q.name), width) - 1) * LEGEND_ROW_HEIGHT, bottom: 6, containLabel: true },
    legend: { top: 0, left: 0 },
    tooltip: { trigger: 'item', formatter: (x: { name: string; marker: string; seriesName: string; value: number }) => `<b>${x.name}</b><br/>${x.marker} ${x.seriesName}: ${fmtNum(x.value)}` },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: G.line } }, axisLabel: { formatter: (v: number) => fmtNum(v) } },
    yAxis: { type: 'category', data: o.categories, inverse: true, axisLine: { show: false }, axisLabel: { color: G[700], fontSize: 11.5, width: o.labelWidth || 70, overflow: 'truncate' } },
    series,
  })) as EChartOptionInput & { optionKey?: string };
  build.optionKey = JSON.stringify([o.categories, o.series, o.barWidth, o.labelWidth]);
  return build;
}

// ---------- pareto ----------
export interface ParetoItem { name: string; value: number; color?: string; }
export interface ParetoOptions {
  items: ParetoItem[];
  valueLabel?: string;
  cumLabel?: string;
  rotate?: number;
  labelWidth?: number;
}

export function pareto(o: ParetoOptions): EChartOption {
  const items = [...o.items].sort((a, b) => b.value - a.value);
  const total = items.reduce((acc, i) => acc + i.value, 0) || 1;
  let run = 0;
  const cum = items.map((i) => { run += i.value; return Math.round((run / total) * 1000) / 10; });
  return {
    grid: { left: 46, right: 46, top: 34, bottom: o.rotate ? 76 : 30 },
    legend: { top: 0, left: 0 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(3,15,31,.04)' } },
      formatter: (ps: { dataIndex: number }[]) => {
        const i = ps[0].dataIndex;
        return `<b>${items[i].name}</b><br/>${o.valueLabel || 'Value'}: <b>${fmtNum(items[i].value)}</b><br/>${o.cumLabel || 'Cumulative'}: <b>${cum[i]}%</b>`;
      },
    },
    xAxis: { type: 'category', data: items.map((i) => i.name), axisLabel: { interval: 0, rotate: o.rotate ?? 30, fontSize: 10, hideOverlap: false, width: o.labelWidth || 90, overflow: 'truncate' } },
    yAxis: [
      { type: 'value', axisLabel: { formatter: (v: number) => fmtNum(v) }, splitLine: { lineStyle: { color: G.line } } },
      { type: 'value', max: 100, min: 0, axisLabel: { formatter: '{value}%', color: G[400] }, splitLine: { show: false } },
    ],
    series: [
      { name: o.valueLabel || 'Value', type: 'bar', barMaxWidth: 26, data: items.map((i) => ({ value: i.value, itemStyle: { color: vGrad(i.color || C.adaam, 1, 0.5), borderRadius: [5, 5, 0, 0] } })) },
      {
        name: o.cumLabel || 'Cumulative share',
        type: 'line',
        yAxisIndex: 1,
        data: cum,
        smooth: 0.25,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { color: C.dune, width: 2.5 },
        itemStyle: { color: C.dune, borderColor: '#fff', borderWidth: 1.5 },
        markLine: { silent: true, symbol: 'none', data: [{ yAxis: 80, lineStyle: { color: G[300], type: 'dashed', width: 1 }, label: { formatter: '80%', color: G[400], fontSize: 10, position: 'insideEndTop' } }] },
      },
    ],
  };
}

// ---------- Qatar municipality map ----------
let qatarGeoRegistered = false;
export interface QatarMapOptions {
  byMunicipality: Record<string, number>;
  unitLabel?: string;
  unitLabelOne?: string;
  color?: string;
  // GeoJSON shapeName -> localized display name. The join to the GeoJSON always stays on the raw
  // shapeName (that data has no Arabic names), so this only swaps what's shown, never what's matched.
  nameMap?: Record<string, string>;
}

// Registers the 'qatar' map once the GeoJSON (fetched from /data/qatar-municipalities.geo.json)
// is available. Callers await this before rendering — ECharts throws if you reference an
// unregistered map name.
export async function registerQatarMap(): Promise<void> {
  if (qatarGeoRegistered) return;
  const res = await fetch('/data/qatar-municipalities.geo.json');
  const geo = await res.json();
  echarts.registerMap('qatar', geo);
  qatarGeoRegistered = true;
}

export function qatarMap(o: QatarMapOptions): EChartOption {
  const col = o.color || C.adaam;
  // Every registered region gets an explicit entry (0 where the backend reported none) — a
  // municipality left out of `data` entirely isn't colored by visualMap's own 0-value shade at
  // all: it falls back to the chart's default series color, which is this same `col` at full
  // opacity — identical to what visualMap paints at the MAXIMUM value. That made a
  // 0-establishment municipality look indistinguishable from the single highest one.
  const registeredNames: string[] = echarts.getMap('qatar')?.geoJson?.features?.map((f: { properties?: { shapeName?: string } }) => f.properties?.shapeName) ?? [];
  const names: string[] = registeredNames.length ? registeredNames : Object.keys(o.byMunicipality);
  const data = names.map((n: string) => ({ name: n, value: o.byMunicipality[n] || 0 }));
  const max = Math.max(...data.map((d) => d.value), 1);
  return {
    tooltip: {
      trigger: 'item',
      formatter: (x: { value: number; name: string }) => {
        const v = x.value == null || Number.isNaN(x.value) ? 0 : x.value;
        const noun = v === 1 && o.unitLabelOne ? o.unitLabelOne : (o.unitLabel || '');
        return `<b>${o.nameMap?.[x.name] ?? x.name}</b><br/>${fmtNum(v)} ${noun}`;
      },
    },
    // itemWidth=thickness, itemHeight=length pre-rotation (echarts rotates 90° for horizontal) — do not swap.
    visualMap: {
      min: 0,
      max,
      left: 0,
      bottom: 0,
      orient: 'horizontal',
      itemWidth: 10,
      itemHeight: 90,
      text: [fmtNum(max), '0'],
      textStyle: { color: G[400], fontSize: 10 },
      calculable: false,
      inRange: { color: [hexA(col, 0.08), hexA(col, 0.45), col] },
      outOfRange: { color: hexA(col, 0.05) },
    },
    // Shrunk + shifted up so the map's southern tip doesn't overlap the visualMap legend at bottom:0.
    geo: {
      map: 'qatar',
      nameProperty: 'shapeName',
      roam: false,
      layoutCenter: ['50%', '42%'],
      layoutSize: '82%',
      aspectScale: 0.92,
      itemStyle: { areaColor: hexA(col, 0.06), borderColor: '#fff', borderWidth: 1.4 },
      label: {
        show: true,
        fontSize: 9.5,
        color: G[500],
        textBorderColor: '#fff',
        textBorderWidth: 2,
        formatter: (p: { name: string }) => o.nameMap?.[p.name] ?? p.name,
      },
      // 'inherit' holds each region's own value shade on hover; without it ECharts paints its default highlight.
      emphasis: { label: { show: true, color: G[900], fontWeight: 700 }, itemStyle: { areaColor: 'inherit', borderColor: C.dune, borderWidth: 2.2 } },
      select: { disabled: true },
    },
    series: [{ type: 'map', map: 'qatar', geoIndex: 0, data }],
  };
}
