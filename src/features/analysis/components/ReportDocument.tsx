'use client';

import { useTranslation } from 'react-i18next';
import type { Analysis, AnalysisCrossFilter } from '@/types';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/format';
import { ANALYSIS_DISCLOSURE } from '../constants';
import { resolveBlockQuery } from '../engine/resolve';
import { frameName, valueLabel, fieldLabel } from '../utils/labels';
import { BlockContent, blockHeight } from './blocks/BlockContent';

interface Props {
  analysis: Analysis;
  cross: AnalysisCrossFilter[];
  masked: boolean;
}

// The report as printed: title, frame line, every block at print size, and the disclosure note when masked.
export function ReportDocument({ analysis, cross, masked }: Props) {
  const { t } = useTranslation();
  return (
    <>
      <header className="mb-5 border-b-2 border-adaam pb-3">
        <h1 className="text-[24px] font-extrabold leading-tight">{analysis.name}</h1>
        {analysis.description && <p className="mt-1 text-[12.5px] text-slate-600">{analysis.description}</p>}
        <p className="mt-2 text-[11px] text-slate-500">
          {frameName(t, analysis.frame)}
          {analysis.compareTo ? ` · ${t('analysis.vsFrame', { defaultValue: 'vs {{frame}}', frame: frameName(t, analysis.compareTo) })}` : ''}
          {analysis.filters.length ? ` · ${t('analysis.export.filters', { defaultValue: 'Filters' })}: ${analysis.filters.map((f) => fieldLabel(t, f.field)).join(', ')}` : ''}
          {cross.length ? ` · ${cross.map((c) => `${fieldLabel(t, c.field)} = ${valueLabel(t, c.field, c.value, true)}`).join(', ')}` : ''}
          {` · ${formatDate(new Date().toISOString())}`}
        </p>
      </header>
      <div className="grid grid-cols-2 gap-4">
        {analysis.blocks.map((b) => {
          const q = resolveBlockQuery(b, analysis, cross);
          return (
            <section key={b.id} className={cn('analysis-print-block rounded-xl border border-slate-200 p-4', b.width === 'full' && 'col-span-2', b.type === 'text' && 'border-0 p-0')}>
              {b.type !== 'text' && (
                <div className="mb-2">
                  <h2 className="text-[13.5px] font-bold">{b.title}</h2>
                  {b.subtitle && <p className="text-[11px] text-slate-500">{b.subtitle}</p>}
                </div>
              )}
              <BlockContent block={b} query={q} masked={masked} height={blockHeight(b, 'print')} mode="print" />
            </section>
          );
        })}
      </div>
      {masked && (
        <p className="mt-5 text-[10px] text-slate-500">
          {t('analysis.export.disclosure', { defaultValue: 'Statistical disclosure control applied: cells built from fewer than {{min}} units are suppressed (x).', min: ANALYSIS_DISCLOSURE.minCell })}
        </p>
      )}
    </>
  );
}
