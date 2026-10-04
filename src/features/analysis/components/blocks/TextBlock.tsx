'use client';

import { Fragment, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { AnalysisRenderMode } from './types';

// **bold** and *italic* only — rendered as React nodes, never as HTML.
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    out.push(tok.startsWith('**') ? <strong key={i++} className="font-bold text-slate-900">{tok.slice(2, -2)}</strong> : <em key={i++}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function TextBlock({ text, mode }: { text: string; mode: AnalysisRenderMode }) {
  const { t } = useTranslation();
  const big = mode === 'present';
  if (!text.trim()) {
    return <p className="text-[13px] text-slate-400 italic">{t('analysis.text.empty', { defaultValue: 'Empty commentary — edit this block to write.' })}</p>;
  }
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (!list.length) return;
    blocks.push(
      <ul key={`l${blocks.length}`} className={cn('list-disc ps-5 space-y-1 text-slate-700', big ? 'text-xl' : 'text-[13.5px]')}>
        {list.map((li, i) => <li key={i}>{inline(li)}</li>)}
      </ul>
    );
    list = [];
  };
  text.split('\n').forEach((raw, i) => {
    const line = raw.trimEnd();
    if (/^\s*-\s+/.test(line)) { list.push(line.replace(/^\s*-\s+/, '')); return; }
    flush();
    if (!line.trim()) return;
    if (line.startsWith('# ')) blocks.push(<h2 key={i} className={cn('font-extrabold text-slate-900 leading-tight', big ? 'text-5xl' : 'text-[22px]')}>{inline(line.slice(2))}</h2>);
    else if (line.startsWith('## ')) blocks.push(<h3 key={i} className={cn('font-bold text-slate-800', big ? 'text-3xl' : 'text-[16px]')}>{inline(line.slice(3))}</h3>);
    else blocks.push(<p key={i} className={cn('text-slate-600 leading-relaxed', big ? 'text-xl' : 'text-[13.5px]')}>{inline(line)}</p>);
  });
  flush();
  return <div className="space-y-2.5">{blocks.map((b, i) => <Fragment key={i}>{b}</Fragment>)}</div>;
}
