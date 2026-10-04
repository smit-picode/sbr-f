'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
  // Non-modal panels keep the canvas usable (live preview while editing).
  modal?: boolean;
}

// Non-modal by default so the canvas beside it previews every edit live.
export function SidePanel({ open, onClose, title, subtitle, children, footer, width = 'w-[440px]', modal = false }: SidePanelProps) {
  const { t } = useTranslation();
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('[data-radix-popper-content-wrapper]')) onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      {modal && <div className="fixed inset-0 z-40 bg-ink/35 backdrop-blur-[1px] animate-in fade-in" onClick={onClose} />}
      <aside
        className={cn(
          'no-print fixed top-3 bottom-3 end-3 z-50 flex max-w-[calc(100vw-24px)] flex-col rounded-3xl bg-white shadow-float border border-slate-100',
          'animate-in slide-in-from-right-8 rtl:slide-in-from-left-8 fade-in duration-200',
          width
        )}
      >
        <header className="flex items-start gap-3 px-5 pt-4 pb-3 border-b border-slate-100">
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-bold text-slate-900 truncate">{title}</div>
            {subtitle && <div className="text-[11.5px] text-slate-500 mt-0.5 truncate">{subtitle}</div>}
          </div>
          <button type="button" onClick={onClose} className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={t('analysis.close', { defaultValue: 'Close' })}>
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
        {footer && <footer className="px-5 py-3 border-t border-slate-100">{footer}</footer>}
      </aside>
    </>
  );
}
