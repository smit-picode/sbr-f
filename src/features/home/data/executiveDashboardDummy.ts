// Dummy data for the two Executive Home sections that have NO backend data source at all yet
// (confirmed by the database side — "survey samples and survey response rates will be removed as we
// dont have this data yet") and for the register-growth chart's "By regulator" / "By sector"
// breakdown views, which sbr-backend's temporary query only computes as a single Total series
// (no per-regulator/per-sector monthly history exists to query). Kept clearly separate from the
// real data in ../api/homeApi.ts so it is obvious what to delete once real sources exist.

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

// Response rate by ISIC activity section, lowest first — flags where to direct survey follow-up.
export const SURVEY_RESPONSE_BY_ACTIVITY = [
  { name: 'Construction', ratePct: 74.2, answered: 89, base: 120 },
  { name: 'Accommodation & food', ratePct: 78.6, answered: 66, base: 84 },
  { name: 'Transport & storage', ratePct: 81.3, answered: 39, base: 48 },
  { name: 'Wholesale & retail', ratePct: 83.9, answered: 187, base: 223 },
  { name: 'Manufacturing', ratePct: 86.1, answered: 62, base: 72 },
  { name: 'Admin & support', ratePct: 88.4, answered: 214, base: 242 },
  { name: 'Professional & tech', ratePct: 90.5, answered: 48, base: 53 },
];

export const SOURCE_COLOR: Record<string, string> = {
  MOCI: '#A29374',
  QFC: '#1A3A52',
  QFZ: '#22637F',
  QSTP: '#87795D',
  MOM_FARM: '#196E49',
};

// Illustrative register-size history by regulator / by sector — the real /home/executive-summary
// endpoint only returns a single Total monthly series (see sbr-backend's
// REGISTER_GROWTH_BY_MONTH_SQL), so these two breakdown views have no real source yet. Months
// intentionally mirror the SBR-design reference (Dec 2025 → Live) rather than the real endpoint's
// Aug/Sep 2026 window, since this is a wholly separate illustrative series, not a slice of it.
export const REGISTER_GROWTH_BREAKDOWN = [
  { label: 'Dec 2025', bySource: { MOCI: 130, MOM_FARM: 22, QFC: 16, QFZ: 16, QSTP: 14 }, bySector: { Private: 174, 'Mixed-Government': 14, '—': 6, 'Mixed-Private': 4 } },
  { label: 'Mar 2026', bySource: { MOCI: 137, MOM_FARM: 23, QFC: 17, QFZ: 16, QSTP: 13 }, bySector: { Private: 181, 'Mixed-Government': 15, '—': 6, 'Mixed-Private': 4 } },
  { label: 'May 2026', bySource: { MOCI: 144, MOM_FARM: 25, QFC: 18, QFZ: 17, QSTP: 12 }, bySector: { Private: 190, 'Mixed-Government': 15, '—': 6, 'Mixed-Private': 5 } },
  { label: 'Live', bySource: { MOCI: 152, MOM_FARM: 26, QFC: 19, QFZ: 19, QSTP: 14 }, bySector: { Private: 203, 'Mixed-Government': 16, '—': 6, 'Mixed-Private': 5 } },
];
