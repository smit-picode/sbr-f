import { CHART_COLOR } from '@/lib/charts';
import type { GdpMeasure, ResponseStatus, SizeBand, Survey, SurveyId, SurveyQuestion } from '../types';

// Select value meaning "no survey filter" — not a real survey id.
export const ALL_SURVEYS = '__all__';
export const ALL_STATUSES = '__all__';

// Responded + partial as a share of the sample; the target line every rate is read against.
export const RESPONSE_TARGET_PCT = 90;
// Cross-tab cells with fewer sampled units than this still show a bubble but no printed rate.
export const CROSS_TAB_MIN_BASE = 8;
// Cross-tab colour scale: at or below this rate reads fully "low".
export const CROSS_TAB_SCALE_MIN = 80;
export const SAMPLE_DETAIL_PAGE_SIZE = 20;
export const ISIC_TOP_N = 6;

export const SURVEYS: Survey[] = [
  { id: 'AES', name: 'Annual Economic Survey', short: 'AES', freq: 'annual', color: CHART_COLOR.adaam },
  { id: 'QES', name: 'Quarterly Economic Survey', short: 'QES', freq: 'quarterly', color: '#1A3A52' },
  { id: 'FDI_A', name: 'Foreign Direct Investment — Annual', short: 'FDI Annual', freq: 'annual', color: '#2B7A9E' },
  { id: 'FDI_Q', name: 'Foreign Direct Investment — Quarterly', short: 'FDI Quarterly', freq: 'quarterly', color: '#B5742B' },
];

// Answer columns of each survey's V_SVY_* view, in question order, with the label and unit shown.
export const SURVEY_QUESTIONS: Record<SurveyId, SurveyQuestion[]> = {
  AES: [
    { code: 'Q1', column: 'TOTAL_TURNOVER', label: 'Total turnover (QAR)', unit: 'QAR' },
    { code: 'Q2', column: 'EMPLOYEES_EOP', label: 'Employees (end of period)', unit: 'persons' },
    { code: 'Q3', column: 'TOTAL_WAGES_SALARIES', label: 'Total wages & salaries (QAR)', unit: 'QAR' },
    { code: 'Q4', column: 'INTERMEDIATE_CONSUMPTION', label: 'Intermediate consumption (QAR)', unit: 'QAR' },
    { code: 'Q5', column: 'GFCF', label: 'Gross fixed capital formation (QAR)', unit: 'QAR' },
    { code: 'Q6', column: 'MAIN_ACTIVITY_ISIC', label: 'Main economic activity (ISIC)', unit: 'code' },
  ],
  QES: [
    { code: 'Q1', column: 'QUARTERLY_TURNOVER', label: 'Quarterly turnover (QAR)', unit: 'QAR' },
    { code: 'Q2', column: 'EMPLOYEES_EOQ', label: 'Employees (end of quarter)', unit: 'persons' },
    { code: 'Q3', column: 'WAGES_SALARIES', label: 'Wages & salaries (QAR)', unit: 'QAR' },
    { code: 'Q4', column: 'OPERATING_EXPENSES', label: 'Operating expenses (QAR)', unit: 'QAR' },
  ],
  FDI_A: [
    { code: 'Q1', column: 'FOREIGN_EQUITY_STAKE_PCT', label: 'Foreign equity stake (%)', unit: '%' },
    { code: 'Q2', column: 'ULTIMATE_INVESTING_COUNTRY', label: 'Ultimate investing country', unit: 'text' },
    { code: 'Q3', column: 'FDI_POSITION_INWARD', label: 'FDI position — inward (QAR)', unit: 'QAR' },
    { code: 'Q4', column: 'REINVESTED_EARNINGS', label: 'Reinvested earnings (QAR)', unit: 'QAR' },
    { code: 'Q5', column: 'INTRA_COMPANY_LOANS', label: 'Intra-company loans (QAR)', unit: 'QAR' },
  ],
  FDI_Q: [
    { code: 'Q1', column: 'EQUITY_FLOWS_QUARTER', label: 'Equity flows this quarter (QAR)', unit: 'QAR' },
    { code: 'Q2', column: 'REINVESTED_EARNINGS', label: 'Reinvested earnings (QAR)', unit: 'QAR' },
    { code: 'Q3', column: 'DEBT_INSTRUMENTS', label: 'Debt instruments (QAR)', unit: 'QAR' },
  ],
};

// Statuses whose rows carry answers; the views leave every answer column empty otherwise.
export const ANSWERED_STATUSES: ResponseStatus[] = ['Responded', 'Partial'];

export const RESPONSE_STATUSES: ResponseStatus[] = ['Responded', 'Partial', 'Non-response', 'Pending'];

// i18n key suffix per status (surveySamples.<key>).
export const RESPONSE_STATUS_KEY: Record<ResponseStatus, string> = {
  Responded: 'responded',
  Partial: 'partial',
  'Non-response': 'nonResponse',
  Pending: 'pending',
};

export const RESPONSE_STATUS_COLORS: Record<ResponseStatus, { bg: string; fg: string }> = {
  Responded: { bg: '#ECFDF5', fg: CHART_COLOR.posText },
  Partial: { bg: '#FBF3D6', fg: CHART_COLOR.warnText },
  'Non-response': { bg: '#FDECEC', fg: CHART_COLOR.negText },
  Pending: { bg: '#F3F4F6', fg: '#6B7280' },
};

// Same distinct per-regulator hues as the Executive Home growth chart.
export const SURVEY_SOURCE_COLOR: Record<string, string> = {
  MOCI: CHART_COLOR.dune,
  QFC: CHART_COLOR.info,
  QFZ: CHART_COLOR.neg,
  QSTP: CHART_COLOR.night,
  MOM_FARM: CHART_COLOR.pos,
};

export const FALLBACK_COLOR = '#9CA3AF';

// Cross-tab colour ramp: low rate -> neutral at the target -> high rate.
export const CROSS_TAB_LOW_COLOR = '#893F46';
export const CROSS_TAB_MID_COLOR = '#E7E5E4';
export const CROSS_TAB_HIGH_COLOR = CHART_COLOR.posText;

export const RATE_GOOD_COLOR = '#059669';
export const RATE_FAIR_COLOR = '#BF9F5F';
export const RATE_POOR_COLOR = '#DF7878';

// NPC size classes by recorded headcount; a zero or missing headcount has no class.
export const SIZE_BANDS: { key: SizeBand; min: number; max: number }[] = [
  { key: 'micro', min: 1, max: 10 },
  { key: 'small', min: 11, max: 50 },
  { key: 'medium', min: 51, max: 250 },
  { key: 'large', min: 251, max: Infinity },
];

// ISIC Rev 4 sections as ranges of 2-digit divisions.
export const ISIC_SECTIONS: [string, number, number][] = [
  ['A', 1, 3], ['B', 5, 9], ['C', 10, 33], ['D', 35, 35], ['E', 36, 39], ['F', 41, 43],
  ['G', 45, 47], ['H', 49, 53], ['I', 55, 56], ['J', 58, 63], ['K', 64, 66], ['L', 68, 68],
  ['M', 69, 75], ['N', 77, 82], ['O', 84, 84], ['P', 85, 85], ['Q', 86, 88], ['R', 90, 93],
  ['S', 94, 96], ['T', 97, 98], ['U', 99, 99],
];

// Contribution-to-GDP measure toggle, in display order, with each option's i18n key suffix.
export const GDP_MEASURES: { key: GdpMeasure; labelKey: string }[] = [
  { key: 'valueAdded', labelKey: 'gdpVa' },
  { key: 'production', labelKey: 'gdpProd' },
  { key: 'intermediate', labelKey: 'gdpIc' },
];

// ?from= value telling the survey response page it was opened from an establishment's detail page.
export const RESPONSE_FROM_ESTABLISHMENT = 'establishment';
