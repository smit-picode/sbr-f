'use client';

import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { AutosaveStatus } from '@/types';
export function SaveStatus({ status }: { status: AutosaveStatus }) {
  const { t } = useTranslation();
  if (status === 'saving' || status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] text-white/85" aria-live="polite">
        <Loader2 className="h-3 w-3 animate-spin" />
        {t('analysis.save.saving', { defaultValue: 'Saving…' })}
      </span>
    );
  }
  if (status === 'error' || status === 'conflict') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-neg/80 px-2 py-0.5 text-[11px] text-white" aria-live="polite">
        <AlertCircle className="h-3 w-3" />
        {status === 'conflict' ? t('analysis.save.reloaded', { defaultValue: 'Reloaded' }) : t('analysis.save.failed', { defaultValue: 'Not saved — retrying on your next change' })}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] text-white/85" aria-live="polite">
      <Check className="h-3 w-3" />
      {t('analysis.save.saved', { defaultValue: 'Saved' })}
    </span>
  );
}
