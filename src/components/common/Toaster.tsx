'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToastPayload, ToastType } from '@/utils/toast';

const DURATION = 4000;

const STYLE: Record<ToastType, { container: string; icon: React.ElementType }> = {
  success: { container: 'bg-emerald-50 border-emerald-200 text-emerald-800', icon: CheckCircle2 },
  error:   { container: 'bg-red-50 border-red-200 text-red-800',             icon: AlertCircle },
  warning: { container: 'bg-amber-50 border-amber-200 text-amber-800',       icon: AlertTriangle },
  info:    { container: 'bg-blue-50 border-blue-200 text-blue-800',           icon: Info },
};

export function Toaster() {
  const [toasts, setToasts] = useState<ToastPayload[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    function onToast(e: Event) {
      const payload = (e as CustomEvent<ToastPayload>).detail;
      setToasts((prev) => [...prev, payload]);
      setTimeout(() => dismiss(payload.id), DURATION);
    }
    window.addEventListener('sbr:toast', onToast);
    return () => window.removeEventListener('sbr:toast', onToast);
  }, [dismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((t) => {
        const { container, icon: Icon } = STYLE[t.type];
        return (
          <div
            key={t.id}
            className={cn(
              'flex items-start gap-3 px-4 py-3 rounded-lg border shadow-md text-sm font-medium pointer-events-auto',
              container
            )}
          >
            <Icon className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="flex-1 leading-snug">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
