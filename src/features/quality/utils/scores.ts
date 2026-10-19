import type { DqRule, DqColumnScore, DqTier } from '@/types';
import { DQ_AMBER_MIN, DQ_GREEN_MIN } from '../constants';

export function tierFor(pct: number | null | undefined): DqTier | null {
  if (pct == null) return null;
  if (pct >= DQ_GREEN_MIN) return 'Green';
  if (pct >= DQ_AMBER_MIN) return 'Amber';
  return 'Red';
}

export function asTier(value: string | null | undefined): DqTier | null {
  return value === 'Green' || value === 'Amber' || value === 'Red' ? value : null;
}

// A rule can check several columns ("MOCI_CR_NUM, MOCI_CP_NUM"); it counts towards each of them.
export function ruleColumns(rule: DqRule): string[] {
  return (rule.SBR_COLUMN ?? '').split(',').map((c) => c.trim()).filter(Boolean);
}

// Same weighting as V_DQ_TABLE_SCORE: weighted pass percentage over scored rules, worst first.
export function columnScores(rules: DqRule[]): DqColumnScore[] {
  const acc = new Map<string, { fieldName: string | null; rules: number; num: number; den: number }>();
  for (const rule of rules) {
    for (const column of ruleColumns(rule)) {
      const entry = acc.get(column) ?? { fieldName: rule.FIELD_NAME, rules: 0, num: 0, den: 0 };
      entry.rules += 1;
      if (rule.PASS_PCT != null) {
        const weight = rule.WEIGHT_VALUE ?? 1;
        entry.num += rule.PASS_PCT * weight;
        entry.den += weight;
      }
      acc.set(column, entry);
    }
  }
  return Array.from(acc, ([column, e]) => ({
    column,
    fieldName: e.fieldName,
    rules: e.rules,
    pct: e.den > 0 ? Math.round((e.num / e.den) * 100) / 100 : null,
  })).sort((a, b) => (a.pct ?? 101) - (b.pct ?? 101));
}
