'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/i18n';
import { useGetAnalysisQuery } from '../api/analysisApi';
import { useAnalysisFrames } from '../hooks/useAnalysisFrames';
import { ReportDocument } from '../components/ReportDocument';
import { buildReportWorkbook, safeFilename } from '../utils/export';
import { RENDER_MAX_WAIT_MS, RENDER_SETTLE_MS } from '../constants';

// What the backend's headless browser reads to know the report is drawn and to fetch the workbook.
interface RenderState {
  status: 'loading' | 'ready' | 'error';
  message?: string;
  fileName?: string;
  buildXlsx?: () => Promise<string>;
}

type RenderWindow = Window & { __sbrRender?: RenderState };

const setState = (state: RenderState) => {
  (window as RenderWindow).__sbrRender = state;
};

const toBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};

// The report alone, for the server to print and email; always with disclosure control applied.
export function AnalysisRenderPage({ id }: { id: string }) {
  const { t } = useTranslation();
  const { dir } = useLanguage();
  const root = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const { isLoading: framesLoading } = useAnalysisFrames();
  const { data, isError } = useGetAnalysisQuery(id, { refetchOnFocus: false, refetchOnMountOrArgChange: false });
  const analysis = data?.data;

  useEffect(() => {
    setMounted(true);
    setState({ status: 'loading' });
    document.body.classList.add('analysis-printing');
    return () => document.body.classList.remove('analysis-printing');
  }, []);

  useEffect(() => {
    if (isError) setState({ status: 'error', message: 'The analysis could not be loaded.' });
  }, [isError]);

  // Ready once no block has shown a loading shimmer for a moment, or after the longest wait.
  useEffect(() => {
    if (!analysis || framesLoading) return;
    const started = Date.now();
    let quietSince = 0;
    const timer = setInterval(() => {
      const pending = !!root.current?.querySelector('.shimmer');
      const timedOut = Date.now() - started > RENDER_MAX_WAIT_MS;
      if (pending && !timedOut) { quietSince = 0; return; }
      if (!pending && !quietSince) { quietSince = Date.now(); return; }
      if (!pending && Date.now() - quietSince < RENDER_SETTLE_MS) return;
      clearInterval(timer);
      setState({
        status: 'ready',
        fileName: safeFilename(analysis.name),
        buildXlsx: async () => toBase64((await buildReportWorkbook(analysis, [], t, true)).buffer),
      });
    }, 200);
    return () => clearInterval(timer);
  }, [analysis, framesLoading, t]);

  if (!mounted) return null;
  return createPortal(
    <div id="analysis-print-root" ref={root} dir={dir} className="bg-white text-slate-900" style={{ width: 1040 }}>
      {analysis && !framesLoading ? (
        <ReportDocument analysis={analysis} cross={[]} masked />
      ) : (
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      )}
    </div>,
    document.body,
  );
}
