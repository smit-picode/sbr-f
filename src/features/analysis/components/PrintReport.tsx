'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Analysis, AnalysisCrossFilter } from '@/types';
import { useLanguage } from '@/i18n';
import { ReportDocument } from './ReportDocument';

interface Props {
  analysis: Analysis;
  cross: AnalysisCrossFilter[];
  masked: boolean;
  onDone: () => void;
}

const MAX_WAIT_MS = 8000;

// Off screen landscape A4 render; the print stylesheet shows only this root.
export function PrintReport({ analysis, cross, masked, onDone }: Props) {
  const { dir } = useLanguage();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.add('analysis-printing');
    const started = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    const finish = () => {
      document.body.classList.remove('analysis-printing');
      onDone();
    };
    const tick = () => {
      const pending = root.current?.querySelector('.shimmer');
      if (pending && Date.now() - started < MAX_WAIT_MS) {
        timer = setTimeout(tick, 150);
        return;
      }
      timer = setTimeout(() => {
        window.addEventListener('afterprint', finish, { once: true });
        window.print();
        setTimeout(() => { if (document.body.classList.contains('analysis-printing')) finish(); }, 1500);
      }, 350);
    };
    timer = setTimeout(tick, 300);
    return () => {
      clearTimeout(timer);
      document.body.classList.remove('analysis-printing');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <div id="analysis-print-root" ref={root} dir={dir} className="bg-white text-slate-900" style={{ position: 'fixed', left: -12000, top: 0, width: 1040 }}>
      <ReportDocument analysis={analysis} cross={cross} masked={masked} />
    </div>,
    document.body
  );
}
