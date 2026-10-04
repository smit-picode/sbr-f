'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { AnalysisCompletenessResult } from '@/types';
import { cn } from '@/lib/utils';
import { useAnalysisResult } from '../../api/analysisService';
import { requestForBlock } from '../../engine/resolve';
import { fieldLabel, valueLabel } from '../../utils/labels';
import { BlockEmpty, BlockError, BlockSkeleton } from './BlockState';
import type { BlockViewProps } from './types';

// Red → amber → green on the share of units with the field filled.
function tone(v: number): { bg: string; fg: string } {
  const mix = (token: string, pct: number) => `color-mix(in srgb, var(--color-${token}) ${pct}%, transparent)`;
  if (v >= 0.9) return { bg: mix('pos', 16), fg: 'var(--color-pos-text)' };
  if (v >= 0.75) return { bg: mix('pos', 8), fg: 'var(--color-pos-text)' };
  if (v >= 0.6) return { bg: mix('warn', 16), fg: 'var(--color-warn-text)' };
  return { bg: mix('neg', 18), fg: 'var(--color-neg-text)' };
}

export function CompletenessBlock({ block, query, height, mode, onPoint }: BlockViewProps) {
  const { t } = useTranslation();
  const req = useMemo(() => requestForBlock(block, query), [block, query]);
  const { data, isLoading, isFetching, isError } = useAnalysisResult<AnalysisCompletenessResult>(req);

  if (isError) return <BlockError height={height} />;
  if (isLoading || !data) return <BlockSkeleton height={height} variant="table" />;
  const overallN = data.groupN[data.groupN.length - 1];
  if (!overallN) return <BlockEmpty height={height} />;

  const dim = query.dimensions[0];
  const clickable = !!onPoint && mode !== 'print' && !!dim;
  const th = 'px-3 py-2 text-[11px] font-semibold text-slate-500 whitespace-nowrap border-b border-slate-200';

  return (
    <div className={cn(mode === 'print' ? '' : 'overflow-auto', 'transition-opacity', isFetching && 'opacity-60')}>
      <table className="w-full text-[12.5px]">
        <thead>
          <tr>
            <th className={cn(th, 'text-start uppercase tracking-wide')}>{t('analysis.completeness.field', { defaultValue: 'Field' })}</th>
            {data.groups.map((g) => (
              <th
                key={String(g)}
                onClick={clickable ? (e) => onPoint!({ keys: [g], dims: [dim], clientX: e.clientX, clientY: e.clientY, value: null }) : undefined}
                className={cn(th, 'text-center', clickable && 'cursor-pointer hover:text-adaam-deep')}
              >
                <div className="max-w-[110px] truncate mx-auto" title={valueLabel(t, dim, g)}>{valueLabel(t, dim, g, true)}</div>
                <div className="text-[10px] font-normal text-slate-400 tabular-nums">{data.groupN[data.groups.indexOf(g)].toLocaleString()}</div>
              </th>
            ))}
            <th className={cn(th, 'text-center text-slate-800')}>
              {t('analysis.completeness.overall', { defaultValue: 'Overall' })}
              <div className="text-[10px] font-normal text-slate-400 tabular-nums">{overallN.toLocaleString()}</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.fields.map((f, fi) => (
            <tr key={f}>
              <td className="px-3 py-1.5 text-slate-700 border-b border-slate-100 whitespace-nowrap">{fieldLabel(t, f)}</td>
              {data.cells[fi].map((v, gi) => {
                const c = tone(v);
                const overall = gi === data.cells[fi].length - 1;
                return (
                  <td key={gi} className="px-1.5 py-1 border-b border-slate-100">
                    <div
                      className={cn('relative h-7 rounded-md flex items-center justify-center tabular-nums font-semibold overflow-hidden', overall && 'ring-1 ring-inset ring-slate-200')}
                      style={{ backgroundColor: c.bg, color: c.fg }}
                      title={`${fieldLabel(t, f)} — ${(v * 100).toFixed(1)}%`}
                    >
                      <span className="absolute inset-y-0 start-0 opacity-25" style={{ width: `${v * 100}%`, backgroundColor: c.fg }} />
                      <span className="relative">{Math.round(v * 100)}%</span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
