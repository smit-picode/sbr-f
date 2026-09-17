// Dummy data for the Executive Home dashboard — deliberately frontend-only (no API calls), per
// the request that this page ship with placeholder figures matching the design reference
// exactly, rather than wiring up real aggregation endpoints. Shapes mirror what a real
// "establishments summary" endpoint would return, so swapping this for a live query later is a
// one-file change, not a page rewrite.

export const EXEC_KPIS = {
  activeEstablishments: 222,
  totalInFrame: 230,
  enterprises: 81,
  enterpriseGroups: 3,
  frameGrowthYtdPct: 16.2,
  surveySamples: 16,
  avgResponsePct: 84,
};

// Register size across frozen frames — one point per published frame, the last is the live
// register. bySource/bySector give the breakdown views the toggle switches between.
export const REGISTER_GROWTH = [
  { label: 'Dec 2025', total: 198, bySource: { MOCI: 130, MOM_FARM: 22, QFC: 16, QFZ: 16, QSTP: 14 }, bySector: { Private: 174, 'Mixed-Government': 14, '—': 6, 'Mixed-Private': 4 } },
  { label: 'Mar 2026', total: 206, bySource: { MOCI: 137, MOM_FARM: 23, QFC: 17, QFZ: 16, QSTP: 13 }, bySector: { Private: 181, 'Mixed-Government': 15, '—': 6, 'Mixed-Private': 4 } },
  { label: 'May 2026', total: 216, bySource: { MOCI: 144, MOM_FARM: 25, QFC: 18, QFZ: 17, QSTP: 12 }, bySector: { Private: 190, 'Mixed-Government': 15, '—': 6, 'Mixed-Private': 5 } },
  { label: 'Live', total: 230, bySource: { MOCI: 152, MOM_FARM: 26, QFC: 19, QFZ: 19, QSTP: 14 }, bySector: { Private: 203, 'Mixed-Government': 16, '—': 6, 'Mixed-Private': 5 } },
];

export const SECTOR_COLOR: Record<string, string> = {
  'Private': '#0E1A2B',
  'Mixed-Government': '#A29374',
  '—': '#94A3B8',
  'Mixed-Private': '#2A6B8A',
};

export const SOURCE_COLOR: Record<string, string> = {
  MOCI: '#A29374',
  QFC: '#1A3A52',
  QFZ: '#22637F',
  QSTP: '#87795D',
  MOM_FARM: '#196E49',
};

// Establishments by sector — matches the live (last) point of REGISTER_GROWTH.bySector.
export const SECTOR_BREAKDOWN = [
  { key: 'Private', count: 203 },
  { key: 'Mixed-Government', count: 16 },
  { key: '—', count: 6 },
  { key: 'Mixed-Private', count: 5 },
];

// Establishments by municipality, from the primary address. Doha carries the largest share —
// darkest on the choropleth — tapering out toward the smaller municipalities.
export const BY_MUNICIPALITY: Record<string, number> = {
  'Doha': 91,
  'Al Rayyan': 47,
  'Al Wakra': 28,
  'Al Daayen': 21,
  'Umm Slal': 17,
  'Al Khor and Al Thakhira': 14,
  'Al Sheehaniya': 8,
  'Al Shamal': 4,
};

// NPC size classes — how the frame is stratified for sampling. "Unknown" (no usable headcount)
// is its own bar, not folded into any size band.
export const SIZE_CLASSES = [
  { key: 'Micro', range: '1-10', count: 77 },
  { key: 'Small', range: '11-50', count: 62 },
  { key: 'Medium', range: '51-250', count: 10 },
  { key: 'Large', range: '251+', count: 6 },
  { key: 'Unknown', range: '—', count: 75 },
];

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

// Recorded employment by economic activity (2-digit ISIC section label), largest first — a
// classic Pareto: three sections carry the overwhelming majority of recorded jobs.
export const EMPLOYMENT_BY_ACTIVITY = [
  { name: 'Admin & support', employees: 8140 },
  { name: 'Wholesale & retail', employees: 3980 },
  { name: 'Accommodation & food', employees: 720 },
  { name: 'Construction', employees: 640 },
  { name: 'Other services', employees: 150 },
  { name: 'Real estate', employees: 95 },
  { name: 'Professional & tech', employees: 82 },
  { name: 'Manufacturing', employees: 58 },
  { name: 'Transport & storage', employees: 44 },
  { name: 'Information & comms', employees: 21 },
  { name: 'Health & social work', employees: 14 },
];

// Who the register is assembled from — establishments by registration source, split by
// ownership sector (matches SECTOR_COLOR above so the two charts read as one story).
export const SOURCE_SECTOR_BREAKDOWN = [
  { source: 'MOCI', bySector: { 'Private': 138, 'Mixed-Government': 9, '—': 3, 'Mixed-Private': 2 } },
  { source: 'MOM_FARM', bySector: { 'Private': 24, 'Mixed-Government': 1, '—': 1, 'Mixed-Private': 0 } },
  { source: 'QFC', bySector: { 'Private': 14, 'Mixed-Government': 3, '—': 1, 'Mixed-Private': 1 } },
  { source: 'QFZ', bySector: { 'Private': 16, 'Mixed-Government': 2, '—': 0, 'Mixed-Private': 1 } },
  { source: 'QSTP', bySector: { 'Private': 11, 'Mixed-Government': 1, '—': 1, 'Mixed-Private': 1 } },
];
