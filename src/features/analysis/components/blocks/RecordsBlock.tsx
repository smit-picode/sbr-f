'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AnalysisRecordsResult } from '@/types';
import { cn } from '@/lib/utils';
import { useAnalysisResult } from '../../api/analysisService';
import { ANALYSIS_FIELDS, ANALYSIS_RECORDS_PAGE_SIZE } from '../../constants';
import { requestForBlock } from '../../engine/resolve';
import { fieldLabel, recordValue } from '../../utils/labels';
import { BlockEmpty, BlockError, BlockSkeleton } from './BlockState';
import type { BlockViewProps } from './types';

export function RecordsBlock({ block, query, height, mode, fill = false }: BlockViewProps & { fill?: boolean }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string | null>(query.columns.includes('employment') ? 'employment' : null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const pageSize = mode === 'present' ? 12 : ANALYSIS_RECORDS_PAGE_SIZE;
  const queryKey = JSON.stringify(query);

  useEffect(() => { setPage(1); }, [queryKey]);

  const req = useMemo(() => requestForBlock(block, query, page, pageSize, sortBy, sortDir), [block, query, page, pageSize, sortBy, sortDir]);
  const { data, isLoading, isFetching, isError } = useAnalysisResult<AnalysisRecordsResult>(req);

  if (isError) return <BlockError height={height} />;
  if (isLoading || !data) return <BlockSkeleton height={height} variant="table" />;
  if (!data.total) return <BlockEmpty height={height} />;

  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const from = (data.page - 1) * data.pageSize + 1;
  const to = Math.min(data.total, data.page * data.pageSize);
  const toggleSort = (c: string) => {
    if (mode === 'print') return;
    if (sortBy === c) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(c); setSortDir(ANALYSIS_FIELDS[c]?.type === 'number' ? 'desc' : 'asc'); }
    setPage(1);
  };

  return (
    <div className={cn('transition-opacity', isFetching && 'opacity-60')}>
      <div className={cn(mode === 'print' ? '' : fill ? 'max-h-[calc(100vh-230px)] overflow-auto' : 'max-h-[460px] overflow-auto', 'rounded-lg border border-slate-100')}>
        <table className="w-full text-[12.5px]">
          <thead>
            <tr>
              {data.columns.map((c) => {
                const numeric = ANALYSIS_FIELDS[c]?.type === 'number';
                return (
                  <th
                    key={c}
                    onClick={() => toggleSort(c)}
                    className={cn(
                      'sticky top-0 z-[1] bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap select-none border-b border-slate-200',
                      numeric ? 'text-end' : 'text-start',
                      mode !== 'print' && 'cursor-pointer hover:text-slate-800'
                    )}
                  >
                    <span className="inline-flex items-center gap-1">
                      {fieldLabel(t, c)}
                      {sortBy === c && (sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50/70">
                {data.columns.map((c) => {
                  const type = ANALYSIS_FIELDS[c]?.type;
                  const v = recordValue(t, c, r[c]);
                  return (
                    <td
                      key={c}
                      className={cn(
                        'px-3 py-1.5 border-b border-slate-100 whitespace-nowrap',
                        type === 'number' ? 'text-end tabular-nums text-slate-700' : type === 'id' ? 'font-mono text-[11.5px] text-adaam-deep' : 'text-slate-700',
                        type === 'text' && 'max-w-[280px] truncate',
                        v === '—' && 'text-slate-300'
                      )}
                      title={type === 'text' ? v : undefined}
                    >
                      {v}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11.5px] text-slate-500">
        <span className="tabular-nums">
          {t('analysis.records.range', { defaultValue: '{{from}}–{{to}} of {{total}}', from: from.toLocaleString(), to: to.toLocaleString(), total: data.total.toLocaleString() })}
        </span>
        {mode !== 'print' && pages > 1 && (
          <div className="flex items-center gap-1 no-print">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-slate-100 disabled:opacity-30" aria-label={t('analysis.records.prev', { defaultValue: 'Previous page' })}>
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            </button>
            <span className="tabular-nums px-1">{page} / {pages.toLocaleString()}</span>
            <button type="button" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-slate-100 disabled:opacity-30" aria-label={t('analysis.records.next', { defaultValue: 'Next page' })}>
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
