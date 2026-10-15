'use client';

import { useTranslation } from 'react-i18next';
import { DQ_AMBER_MIN, DQ_GREEN_MIN, DQ_NO_SCORE_COLOR, DQ_TIER_STYLE } from '../constants';

import type { DqTier } from '@/types';
export function TierBadge({ tier }: { tier: DqTier | null }) {
  const { t } = useTranslation();
  if (!tier) {
    return <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{t('dq.notScored', { defaultValue: 'Not scored' })}</span>;
  }
  const s = DQ_TIER_STYLE[tier];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: s.bg, color: s.fg }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} />
      {t(`dq.tier.${tier}`, { defaultValue: tier })}
    </span>
  );
}

// 0 to 100 bar with the Amber and Green thresholds marked.
export function ScoreBar({ pct, tier }: { pct: number | null; tier: DqTier | null }) {
  const color = tier ? DQ_TIER_STYLE[tier].dot : DQ_NO_SCORE_COLOR;
  return (
    <div className="relative h-2.5 rounded-full bg-slate-100">
      <div className="absolute inset-y-0 start-0 rounded-full" style={{ width: `${Math.max(0, Math.min(100, pct ?? 0))}%`, background: color }} />
      {[DQ_AMBER_MIN, DQ_GREEN_MIN].map((x) => (
        <span key={x} className="absolute -bottom-1 -top-1 w-px bg-slate-300" style={{ insetInlineStart: `${x}%` }} />
      ))}
    </div>
  );
}

export function formatPct(pct: number | null | undefined): string {
  return pct == null ? '—' : `${pct.toFixed(1)}%`;
}
