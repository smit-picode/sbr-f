'use client';

import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import type { DqRule } from '@/types';
import { formatNumber } from '@/utils/format';
import { asTier, ruleColumns } from '../utils/scores';
import { dqColumnLabel } from '../utils/labels';
import { TierBadge, formatPct } from './QualityScore';

const TH = 'px-3 py-2 text-start text-xs font-medium uppercase tracking-wide text-slate-500';

// The rules of one table (or one column of it) for the run, worst pass rate first.
export function DqRulesTable({ rules }: { rules: DqRule[] }) {
  const { t } = useTranslation();
  const sorted = [...rules].sort((a, b) => (a.PASS_PCT ?? -1) - (b.PASS_PCT ?? -1));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className={TH}>{t('dq.thRule', { defaultValue: 'Rule' })}</th>
            <th className={TH}>{t('dq.thColumn', { defaultValue: 'Column' })}</th>
            <th className={TH}>{t('dq.thDimension', { defaultValue: 'Dimension' })}</th>
            <th className={TH}>{t('dq.thWeight', { defaultValue: 'Weight' })}</th>
            <th className={`${TH} text-end`}>{t('dq.thChecked', { defaultValue: 'Checked' })}</th>
            <th className={`${TH} text-end`}>{t('dq.thFailing', { defaultValue: 'Failing' })}</th>
            <th className={`${TH} text-end`}>{t('dq.thPass', { defaultValue: 'Pass rate' })}</th>
            <th className={TH}>{t('dq.thTier', { defaultValue: 'Tier' })}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.RULE_ID} className="border-b border-slate-100 align-top transition-colors hover:bg-slate-50">
              <td className="max-w-[360px] px-3 py-2.5">
                <div className="font-mono text-xs font-medium text-slate-500">{r.RULE_ID}</div>
                <div className="mt-0.5 text-sm text-slate-700">{r.RULE_DESCRIPTION ?? r.FIELD_NAME ?? '—'}</div>
                {r.ERROR_MESSAGE && (
                  <div className="mt-1 flex items-start gap-1.5 text-xs text-red-600">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{t('dq.ruleErrored', { defaultValue: 'Could not be scored in this run' })}: {r.ERROR_MESSAGE}</span>
                  </div>
                )}
              </td>
              <td className="px-3 py-2.5 text-sm text-slate-600">
                {ruleColumns(r).map((c) => dqColumnLabel(t, r.SBR_TABLE, c, r.FIELD_NAME)).join(', ') || '—'}
              </td>
              <td className="px-3 py-2.5 text-sm text-slate-600">
                {r.QUALITY_DIMENSION ? t(`dq.dimension.${r.QUALITY_DIMENSION}`, { defaultValue: r.QUALITY_DIMENSION }) : '—'}
              </td>
              <td className="px-3 py-2.5 text-sm text-slate-600">{r.WEIGHT ? t(`dq.weight.${r.WEIGHT}`, { defaultValue: r.WEIGHT }) : '—'}</td>
              <td className="px-3 py-2.5 text-end text-sm tabular-nums text-slate-600">{formatNumber(r.TOTAL_CNT)}</td>
              <td className="px-3 py-2.5 text-end text-sm tabular-nums text-slate-700">{formatNumber(r.FLAGGED_CNT)}</td>
              <td className="px-3 py-2.5 text-end text-sm font-semibold tabular-nums text-slate-900">{formatPct(r.PASS_PCT)}</td>
              <td className="px-3 py-2.5"><TierBadge tier={asTier(r.QDTI_TIER)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
