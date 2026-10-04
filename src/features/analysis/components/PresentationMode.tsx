'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Analysis, AnalysisCrossFilter } from '@/types';
import { cn } from '@/lib/utils';
import { CHART_COLOR } from '@/lib/charts/theme';
import { resolveBlockQuery } from '../engine/resolve';
import { formatDate } from '@/utils/format';
import { frameName } from '../utils/labels';
import { BlockContent, blockHeight } from './blocks/BlockContent';

interface Props {
  analysis: Analysis;
  cross: AnalysisCrossFilter[];
  masked: boolean;
  onClose: () => void;
}

export function PresentationMode({ analysis, cross, masked, onClose }: Props) {
  const { t } = useTranslation();
  const [i, setI] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const slides = analysis.blocks;
  const count = slides.length + 1;
  const go = useCallback((d: number) => setI((x) => Math.max(0, Math.min(count - 1, x + d))), [count]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); go(document.dir === 'rtl' && e.key === 'ArrowRight' ? -1 : 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(document.dir === 'rtl' && e.key === 'ArrowLeft' ? 1 : -1); }
      else if (e.key === 'Home') setI(0);
      else if (e.key === 'End') setI(count - 1);
    };
    window.addEventListener('keydown', key);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', key); document.body.style.overflow = ''; };
  }, [go, onClose, count]);

  const block = i > 0 ? slides[i - 1] : null;
  const query = useMemo(() => (block ? resolveBlockQuery(block, analysis, cross) : null), [block, analysis, cross]);

  return createPortal(
    <div ref={root} className="fixed inset-0 z-[80] flex flex-col text-white" style={{ background: `radial-gradient(120% 90% at 20% 0%, color-mix(in srgb, ${CHART_COLOR.info} 22%, ${CHART_COLOR.night}) 0%, ${CHART_COLOR.night} 55%, color-mix(in srgb, ${CHART_COLOR.night} 70%, black) 100%)` }}>
      <div className="flex items-center gap-3 px-6 pt-4 pb-2">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-[.18em] text-white/50">{analysis.name}</div>
        </div>
        <div className="text-[12px] tabular-nums text-white/60">{i + 1} / {count}</div>
        <button type="button" onClick={() => root.current?.requestFullscreen?.().catch(() => undefined)} className="h-9 w-9 rounded-full flex items-center justify-center text-white/70 hover:bg-white/10" aria-label={t('analysis.present.fullscreen', { defaultValue: 'Full screen' })}>
          <Maximize2 className="h-4 w-4" />
        </button>
        <button type="button" onClick={onClose} className="h-9 w-9 rounded-full flex items-center justify-center text-white/70 hover:bg-white/10" aria-label={t('analysis.close', { defaultValue: 'Close' })}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center px-16 pb-4">
        {!block ? (
          <div key="title" className="max-w-4xl text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mx-auto mb-6 h-1 w-16 rounded-full bg-dune-light" />
            <h1 className="text-5xl font-extrabold leading-tight">{analysis.name}</h1>
            {analysis.description && <p className="mt-4 text-xl text-white/70">{analysis.description}</p>}
            <p className="mt-8 text-sm text-white/50">
              {frameName(t, analysis.frame)}
              {analysis.compareTo ? ` · ${t('analysis.vsFrame', { defaultValue: 'vs {{frame}}', frame: frameName(t, analysis.compareTo) })}` : ''}
              {' · '}
              {formatDate(new Date().toISOString())}
            </p>
          </div>
        ) : (
          <div key={block.id} className={cn('w-full max-w-[1280px] rounded-[28px] bg-white text-slate-900 shadow-2xl animate-in fade-in zoom-in-95 duration-300', block.type === 'text' ? 'p-12' : 'p-8')}>
            {block.type !== 'text' && (
              <div className="mb-5">
                <h2 className="text-3xl font-extrabold leading-tight">{block.title}</h2>
                {block.subtitle && <p className="mt-1 text-base text-slate-500">{block.subtitle}</p>}
              </div>
            )}
            {query && <BlockContent block={block} query={query} masked={masked} height={blockHeight(block, 'present')} mode="present" />}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 pb-5">
        <button type="button" onClick={() => go(-1)} disabled={i === 0} className="h-10 w-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 disabled:opacity-30" aria-label={t('analysis.present.prev', { defaultValue: 'Previous' })}>
          <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
        </button>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: count }).map((_, k) => (
            <button key={k} type="button" onClick={() => setI(k)} className={cn('h-1.5 rounded-full transition-all', k === i ? 'w-8 bg-dune-light' : 'w-1.5 bg-white/30 hover:bg-white/60')} aria-label={`${k + 1}`} />
          ))}
        </div>
        <button type="button" onClick={() => go(1)} disabled={i === count - 1} className="h-10 w-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 disabled:opacity-30" aria-label={t('analysis.present.next', { defaultValue: 'Next' })}>
          <ChevronRight className="h-5 w-5 rtl:rotate-180" />
        </button>
      </div>
    </div>,
    document.body
  );
}
