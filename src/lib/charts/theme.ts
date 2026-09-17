// Full bundle rather than the modular echarts/core build — this is an internal dashboard, not a
// bundle-size-sensitive public page, and the full build guarantees every chart type/component
// used here (map, visualMap, pie, bar, line) is registered without hand-picking imports.
import * as echarts from 'echarts';

// Mirrors src/app/globals.css's @theme color tokens as plain hex — ECharts options are plain
// JS objects evaluated well before any CSS custom property could be read, so these can't just
// reference var(--color-adaam) the way className-based UI does. Keep in sync by hand; there are
// few enough of these that a build-time sync step would be more machinery than the drift risk
// deserves.
export const CHART_COLOR = {
  adaam: '#A29374',
  adaamDeep: '#87795D',
  dune: '#A29374',
  duneLight: '#C0AC86',
  duneDeep: '#87795D',
  duneDark: '#776848',
  duneTint: '#F4F0E8',
  pos: '#3FB185',
  posText: '#047857',
  neg: '#DF7878',
  negText: '#B23B3B',
  warn: '#BF9F5F',
  warnText: '#A67C1B',
  info: '#2A6B8A',
  ink: '#111827',
  night: '#0E1A2B',
};

// Ordered categorical palette, used when a series doesn't specify its own color.
export const CHART_PALETTE = [
  CHART_COLOR.adaam,
  CHART_COLOR.dune,
  CHART_COLOR.info,
  CHART_COLOR.pos,
  CHART_COLOR.neg,
  CHART_COLOR.duneLight,
  CHART_COLOR.night,
];

// Neutral grays, matching Tailwind's slate scale at the shades the reference chart kit used.
const G = { 200: '#E2E8F0', 300: '#CBD5E1', 400: '#94A3B8', 500: '#64748B', 700: '#334155', 900: '#0F172A', line: '#F1F5F9' };
export { G as CHART_GRAY };

const FONT = "'Plus Jakarta Sans', 'Cairo', -apple-system, 'Segoe UI', Arial, sans-serif";

export function hexA(hex: string, alpha: number): string {
  if (!hex || hex[0] !== '#') return hex;
  const n = parseInt(hex.slice(1, 7), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export function vGrad(hex: string, top = 0.28, bottom = 0.02) {
  return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: hexA(hex, top) },
    { offset: 1, color: hexA(hex, bottom) },
  ]);
}

export function fmtNum(v: unknown): string {
  return v == null || Number.isNaN(v as number) ? '—' : Number(v).toLocaleString();
}

export function pct(part: number, total: number): number {
  return total ? Math.round((part / total) * 100) : 0;
}

let themeRegistered = false;
// Registers the 'sbr' ECharts theme once — safe to call from every chart-bearing component;
// only the first call actually does anything (registerTheme itself isn't idempotent-safe to
// call twice with intent, but calling it twice with the same object is harmless — this guard
// just avoids the redundant work on every re-render).
export function ensureChartTheme(): void {
  if (themeRegistered) return;
  themeRegistered = true;
  echarts.registerTheme('sbr', {
    color: CHART_PALETTE,
    textStyle: { fontFamily: FONT, color: G[500] },
    legend: { textStyle: { color: G[700], fontSize: 11.5 }, itemWidth: 9, itemHeight: 9, icon: 'circle', itemGap: 14 },
    tooltip: {
      backgroundColor: CHART_COLOR.night,
      borderWidth: 0,
      textStyle: { color: '#fff', fontSize: 12 },
      padding: [8, 12],
      extraCssText: 'border-radius:12px;box-shadow:0 10px 30px rgba(3,15,31,.28);',
    },
    categoryAxis: { axisLine: { lineStyle: { color: G[200] } }, axisTick: { show: false }, axisLabel: { color: G[500], fontSize: 11 }, splitLine: { show: false } },
    valueAxis: { axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: G[400], fontSize: 10.5 }, splitLine: { lineStyle: { color: G.line } } },
  });
}

export const CHART_ANIMATION = { animationDuration: 800, animationEasing: 'cubicOut' as const, animationDurationUpdate: 400 };
export const TOOLTIP_AXIS = { trigger: 'axis' as const, axisPointer: { type: 'line' as const, lineStyle: { color: G[300], type: 'dashed' as const } } };
