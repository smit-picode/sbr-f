import { CHART_COLOR, CHART_GRAY, hexA } from '@/lib/charts/theme';

// Theme colours (green/red reserved for gains/losses); separate file so the analysis worker never bundles ECharts.
export const ANALYSIS_PALETTE: string[] = [
  CHART_COLOR.adaam, CHART_COLOR.info, CHART_COLOR.duneLight, hexA(CHART_COLOR.info, 0.6), CHART_COLOR.duneDark, hexA(CHART_COLOR.info, 0.35),
  CHART_COLOR.night, CHART_COLOR.warn, CHART_COLOR.adaamDeep, hexA(CHART_COLOR.adaam, 0.45), hexA(CHART_COLOR.night, 0.6), CHART_GRAY[400],
];
export const ANALYSIS_OTHER_COLOR = CHART_GRAY[300];
