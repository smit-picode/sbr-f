import { CHART_COLOR } from '@/lib/charts';

export const SURVEY_KPIS = {
  samples: 16,
  avgResponsePct: 84,
};

export const SURVEY_RESPONSE_BY_SURVEY = [
  { name: 'AES', ratePct: 85.5, sampledUnits: 1240 },
  { name: 'QES', ratePct: 85.2, sampledUnits: 980 },
  { name: 'FDI Annual', ratePct: 85, sampledUnits: 410 },
  { name: 'FDI Quarterly', ratePct: 81.7, sampledUnits: 410 },
];

export const SURVEY_RESPONSE_MIN_BASE = 10;

const ACTIVITY_SECTIONS = [
  { code: 'S', name: 'Other services', answered: 8, base: 13 },
  { code: 'C', name: 'Manufacturing', answered: 35, base: 50 },
  { code: 'I', name: 'Accommodation & food', answered: 71, base: 100 },
  { code: 'F', name: 'Construction', answered: 89, base: 120 },
  { code: 'H', name: 'Transport & storage', answered: 39, base: 48 },
  { code: 'G', name: 'Wholesale & retail', answered: 187, base: 223 },
  { code: 'N', name: 'Admin & support', answered: 214, base: 242 },
  { code: 'M', name: 'Professional & technical', answered: 48, base: 53 },
  { code: 'J', name: 'Information & comms', answered: 9, base: 9 },
  { code: 'L', name: 'Real estate', answered: 6, base: 6 },
  { code: 'Q', name: 'Health & social work', answered: 4, base: 4 },
];

export const SURVEY_RESPONSE_BY_ACTIVITY = ACTIVITY_SECTIONS
  .map((s) => ({ ...s, ratePct: Math.round((s.answered / s.base) * 1000) / 10 }))
  .sort((x, y) => x.ratePct - y.ratePct);

export const SOURCE_COLOR: Record<string, string> = {
  MOCI: CHART_COLOR.dune,
  QFC: CHART_COLOR.info,
  QFZ: CHART_COLOR.neg,
  QSTP: CHART_COLOR.night,
  MOM_FARM: CHART_COLOR.pos,
};

export const REGISTER_GROWTH_BREAKDOWN = [
  { label: 'Dec 2025', bySource: { MOCI: 130, MOM_FARM: 22, QFC: 16, QFZ: 16, QSTP: 14 }, bySector: { Private: 174, 'Mixed-Government': 14, '—': 6, 'Mixed-Private': 4 } },
  { label: 'Mar 2026', bySource: { MOCI: 137, MOM_FARM: 23, QFC: 17, QFZ: 16, QSTP: 13 }, bySector: { Private: 181, 'Mixed-Government': 15, '—': 6, 'Mixed-Private': 4 } },
  { label: 'May 2026', bySource: { MOCI: 144, MOM_FARM: 25, QFC: 18, QFZ: 17, QSTP: 12 }, bySector: { Private: 190, 'Mixed-Government': 15, '—': 6, 'Mixed-Private': 5 } },
  { label: 'Live', bySource: { MOCI: 152, MOM_FARM: 26, QFC: 19, QFZ: 19, QSTP: 14 }, bySector: { Private: 203, 'Mixed-Government': 16, '—': 6, 'Mixed-Private': 5 } },
];
