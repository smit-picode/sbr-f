// Chart option builders — ports of SBR-design's app/charts.jsx trend/donut/columns/hbars/pareto/
// qatarMap, trimmed to what the Executive Home dashboard actually uses. Pages describe data
// shapes; these turn that into ECharts option objects (grid, tooltip, series, ...).
import * as echarts from 'echarts';
import type { EChartOption, EChartOptionInput } from './EChart';
import { CHART_COLOR, CHART_GRAY as G, CHART_PALETTE, fmtNum, hexA, pct, vGrad } from './theme';

const C = CHART_COLOR;

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

export function trend(o: TrendOptions): EChartOption {
  const legend = o.series.length > 1;
  // A single reading has nothing to connect a line/area to, so it rendered as a bare dot. A
  // leading, blank-labeled category holding that same reading gives it a flat line/area instead
  // — it never asserts an earlier reading actually existed, since the blank category carries no
  // date and the segment stays perfectly flat.
  const singlePoint = o.categories.length === 1;
  const categories = singlePoint ? ['', ...o.categories] : o.categories;
  const seriesInput = singlePoint ? o.series.map((s) => ({ ...s, data: [s.data[0] ?? null, ...s.data] })) : o.series;
  const last = categories.length - 1;
  const series = seriesInput.map((s, si) => {
    const col = s.color || CHART_PALETTE[si % CHART_PALETTE.length];
    const data = s.data.map((v, i) => {
      if (i !== last || s.endLabel === false) return v;
      return {
        value: v,
        symbolSize: 9,
        label: {
          show: true,
          position: 'top',
          distance: 8,
          formatter: (x: { value: number }) => (o.format || fmtNum)(x.value),
          color: '#fff',
          backgroundColor: col,
          borderRadius: 10,
          padding: [3, 7],
          fontSize: 11,
          fontWeight: 700,
        },
      };
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
    };
    if (s.area !== false && si === 0) st.areaStyle = { color: vGrad(col) };
    return st;
  });
  return {
    // Extra top clearance beyond the usual legend allowance — the last point always carries a
    // pill-shaped end label placed above it, and when that point sits near the axis max (a
    // single-point series is the extreme case) the pill had too little room and got clipped
    // against the chart's own top edge.
    grid: { left: 42, right: 22, top: legend ? 46 : 34, bottom: 26 },
    legend: legend ? { top: 0, left: 0 } : undefined,
    tooltip: { trigger: 'axis', axisPointer: { type: 'line', lineStyle: { color: G[300], type: 'dashed' } }, valueFormatter: (v: unknown) => `${(o.format || fmtNum)(v as number)}${o.unit || ''}` },
    xAxis: { type: 'category', data: categories, boundaryGap: false, axisLabel: { margin: 10 } },
    yAxis: { type: 'value', min: o.yMin, max: o.yMax, splitNumber: 4, axisLabel: { formatter: (v: number) => fmtNum(v) }, scale: o.yMin == null },
    series,
  };
}

// ---------- donut ----------
export interface DonutItem { name: string; value: number; color?: string; }
export interface DonutOptions {
  items: DonutItem[];
  totalLabel?: string;
  legendWidth?: number;
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
    if (!side) return { bottom: 0, left: 'center', formatter: fmt, textStyle: { rich } };
    return { orient: 'vertical', right: 6, top: 'middle', itemGap: o.items.length > 5 ? 6 : 8, formatter: fmt, textStyle: { rich } };
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
    const nameW = o.legendWidth || 88;
    const entryExtra = 20 + 10 + 40 + 6 + 26;
    const ringSpace = w - (nameW + entryExtra + 12);
    if (ringSpace < 96) {
      const entryW = nameW + entryExtra + 10;
      const perRow = Math.max(1, Math.floor(w / entryW));
      const rows = Math.ceil(o.items.length / perRow);
      const legendH = rows * 18 + 10;
      const avail = h - legendH;
      const r = Math.max(20, Math.min(w, avail) / 2 - 5);
      return base(false, Math.round(w / 2), Math.round(avail / 2), [Math.round(r * 0.62), Math.round(r)], nameW);
    }
    const r = Math.max(24, Math.min(ringSpace, h) / 2 - 6);
    return base(true, Math.round(ringSpace / 2), Math.round(h / 2), [Math.round(r * 0.75), Math.round(r)], nameW);
  }) as EChartOptionInput & { optionKey?: string };
  build.optionKey = JSON.stringify([o.items, o.totalLabel, o.legendWidth]);
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
    xAxis: { type: 'value', splitLine: { lineStyle: { color: G.line } }, axisLabel: { formatter: (v: number) => fmtNum(v) }, max: o.max },
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

export function hbarsStacked(o: HBarsStackedOptions): EChartOption {
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
  return {
    grid: { left: 8, right: 64, top: 30, bottom: 6, containLabel: true },
    legend: { top: 0, left: 0 },
    tooltip: { trigger: 'item', formatter: (x: { name: string; marker: string; seriesName: string; value: number }) => `<b>${x.name}</b><br/>${x.marker} ${x.seriesName}: ${fmtNum(x.value)}` },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: G.line } }, axisLabel: { formatter: (v: number) => fmtNum(v) } },
    yAxis: { type: 'category', data: o.categories, inverse: true, axisLine: { show: false }, axisLabel: { color: G[700], fontSize: 11.5, width: o.labelWidth || 70, overflow: 'truncate' } },
    series,
  };
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
