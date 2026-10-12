import * as echarts from 'echarts';

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

export const CHART_PALETTE = [
  CHART_COLOR.adaam,
  CHART_COLOR.dune,
  CHART_COLOR.info,
  CHART_COLOR.pos,
  CHART_COLOR.neg,
  CHART_COLOR.duneLight,
  CHART_COLOR.night,
];

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

// Whole-number shares that always add up to 100, so a legend's percentages match its total.
export function sharesTo100(values: number[]): number[] {
  const total = values.reduce((a, b) => a + b, 0);
  if (total <= 0 || values.some((v) => v < 0)) return values.map((v) => pct(v, total));
  const exact = values.map((v) => (v / total) * 100);
  const floors = exact.map(Math.floor);
  let left = 100 - floors.reduce((a, b) => a + b, 0);
  const order = exact.map((e, i) => ({ i, r: e - floors[i] })).sort((a, b) => b.r - a.r);
  for (const { i } of order) { if (left-- <= 0) break; floors[i] += 1; }
  return floors;
}

let themeRegistered = false;
// Registers the 'sbr' ECharts theme once
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
