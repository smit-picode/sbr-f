import { ISIC_SECTIONS, SIZE_BANDS } from '../constants';
import type { SizeBand } from '../types';

// ISIC code -> Rev 4 section letter, via its 2-digit division; null when the code is missing or unmapped.
export function isicSection(code: string | null): string | null {
  if (code == null || code === '') return null;
  const d = parseInt(String(code).slice(0, 2), 10);
  if (Number.isNaN(d)) return null;
  const hit = ISIC_SECTIONS.find(([, lo, hi]) => d >= lo && d <= hi);
  return hit ? hit[0] : null;
}

// A zero headcount is a figure never captured, not a unit with no staff, so it has no size class.
export function sizeBandOf(v: number | null): SizeBand | null {
  if (v == null || Number.isNaN(Number(v))) return null;
  const n = Number(v);
  if (n <= 0) return null;
  return SIZE_BANDS.find((b) => n >= b.min && n <= b.max)?.key ?? 'large';
}

// Sample route key: "AES__2025_Q1" <-> { surveyId: 'AES', period: '2025 Q1' }.
export function sampleSlug(surveyId: string, period: string): string {
  return `${surveyId}__${period.replace(/\s+/g, '_')}`;
}

export function parseSampleSlug(slug: string): { surveyId: string; period: string } {
  const decoded = decodeURIComponent(slug);
  const i = decoded.indexOf('__');
  if (i < 0) return { surveyId: '', period: '' };
  return { surveyId: decoded.slice(0, i), period: decoded.slice(i + 2).replace(/_/g, ' ') };
}

// Colour for a response rate: good, fair or poor.
export function rateColor(rate: number, good: string, fair: string, poor: string): string {
  return rate >= 75 ? good : rate >= 55 ? fair : poor;
}
