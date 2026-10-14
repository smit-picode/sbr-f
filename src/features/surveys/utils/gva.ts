import { isicSection } from './classify';
import type { GvaAccounts, GvaMeasure, SurveyGvaApi } from '../types';

const QUARTERS_PER_YEAR = 4;
const MEASURES: GvaMeasure[] = ['valueAdded', 'production', 'intermediate'];

export interface GvaView {
  // Latest year with a complete AES return; null when the establishment never returned one.
  referenceYear: number | null;
  establishment: GvaAccounts | null;
  // National totals for the reference year, only when all four quarters are in V_SVY_TOTAL_ECONOMY.
  economy: GvaAccounts | null;
  // Year the economy totals are for: the reference year, else the latest year with all four quarters.
  economyYear: number | null;
  shareOfEconomy: Record<GvaMeasure, number | null>;
  // The establishment's ISIC section with what its sampled units reported that year; null without an ISIC code or any full return.
  activity: { section: string; units: number; accounts: GvaAccounts } | null;
  shareOfActivity: Record<GvaMeasure, number | null>;
  // What the activity's sampled units reported, as a share of the national total.
  activityShareOfEconomy: Record<GvaMeasure, number | null>;
  trendYears: number[];
  trend: Record<GvaMeasure, number[]>;
}

// Figures come straight from the views: production = AES turnover, and value added = production − intermediate consumption.
export function buildGvaView(api: SurveyGvaApi): GvaView {
  const reported = new Map<number, GvaAccounts>();
  api.AES.forEach((r) => {
    if (r.RESPONSE_STATUS !== 'Responded' || r.TOTAL_TURNOVER == null || r.INTERMEDIATE_CONSUMPTION == null) return;
    reported.set(r.SURVEY_YEAR, {
      production: r.TOTAL_TURNOVER,
      intermediate: r.INTERMEDIATE_CONSUMPTION,
      valueAdded: r.TOTAL_TURNOVER - r.INTERMEDIATE_CONSUMPTION,
    });
  });

  const byYear = new Map<number, { quarters: number; totals: GvaAccounts }>();
  api.ECONOMY.forEach((q) => {
    const y = byYear.get(q.SURVEY_YEAR) ?? { quarters: 0, totals: { valueAdded: 0, production: 0, intermediate: 0 } };
    y.quarters++;
    y.totals.valueAdded += q.VALUE_ADDED;
    y.totals.production += q.PRODUCTION;
    y.totals.intermediate += q.INTERMEDIATE_CONSUMPTION;
    byYear.set(q.SURVEY_YEAR, y);
  });

  const trendYears = [...reported.keys()].sort((a, b) => a - b);
  const referenceYear = trendYears.length ? trendYears[trendYears.length - 1] : null;
  const establishment = referenceYear != null ? reported.get(referenceYear) ?? null : null;
  const completeYears = [...byYear.entries()].filter(([, v]) => v.quarters === QUARTERS_PER_YEAR).map(([y]) => y).sort((a, b) => a - b);
  const economyYear = referenceYear != null && completeYears.includes(referenceYear) ? referenceYear : completeYears[completeYears.length - 1] ?? null;
  const economy = economyYear != null ? byYear.get(economyYear)!.totals : null;

  const shareOfEconomy = Object.fromEntries(
    MEASURES.map((m) => [m, establishment && economy && economy[m] ? (establishment[m] / economy[m]) * 100 : null])
  ) as Record<GvaMeasure, number | null>;
  const trend = Object.fromEntries(
    MEASURES.map((m) => [m, trendYears.map((y) => reported.get(y)![m])])
  ) as Record<GvaMeasure, number[]>;

  const section = isicSection(api.ISIC_CODE);
  const inSection = section && referenceYear != null
    ? (api.ACTIVITY ?? []).filter((a) => a.SURVEY_YEAR === referenceYear && isicSection(a.DIVISION) === section)
    : [];
  const activity = section && inSection.length
    ? (() => {
        const production = inSection.reduce((n, a) => n + a.TOTAL_TURNOVER, 0);
        const intermediate = inSection.reduce((n, a) => n + a.INTERMEDIATE_CONSUMPTION, 0);
        return { section, units: inSection.reduce((n, a) => n + a.UNITS, 0), accounts: { production, intermediate, valueAdded: production - intermediate } };
      })()
    : null;
  const shareOfActivity = Object.fromEntries(
    MEASURES.map((m) => [m, establishment && activity && activity.accounts[m] ? (establishment[m] / activity.accounts[m]) * 100 : null])
  ) as Record<GvaMeasure, number | null>;

  const activityShareOfEconomy = Object.fromEntries(
    MEASURES.map((m) => [m, activity && economy && economy[m] ? (activity.accounts[m] / economy[m]) * 100 : null])
  ) as Record<GvaMeasure, number | null>;

  return { referenceYear, establishment, economy, economyYear, shareOfEconomy, activity, shareOfActivity, activityShareOfEconomy, trendYears, trend };
}

// Compact QAR amount (2.43M, 780.0B), as the design prints it.
export function formatMoney(v: number | null): string {
  if (v == null) return '—';
  const a = Math.abs(v);
  if (a >= 1e12) return `${(v / 1e12).toFixed(2)}T`;
  if (a >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return String(Math.round(v));
}

// An establishment's share of the economy runs to millionths
export function formatShare(v: number | null): string {
  if (v == null) return '—';
  if (v >= 1) return `${v.toFixed(2)}%`;
  if (v >= 0.01) return `${v.toFixed(3)}%`;
  return `${Number(v.toPrecision(2))}%`;
}
