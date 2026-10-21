'use client';

import { useState } from 'react';
import { Lock, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AnalysisMailUser } from '@/types';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks';
import { useGetAnalysisRecipientsQuery } from '../../api/analysisApi';
import { ANALYSIS_MAIL_MAX_RECIPIENTS, ANALYSIS_RECIPIENT_SEARCH_DEBOUNCE_MS } from '../../constants';

interface Props {
  analysisId: string;
  value: AnalysisMailUser[];
  onChange: (next: AnalysisMailUser[]) => void;
  disabled?: boolean;
}

// Portal users only; someone the analysis is not shared with is listed but cannot be picked.
export function RecipientPicker({ analysisId, value, onChange, disabled }: Props) {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const search = useDebounce(q.trim(), ANALYSIS_RECIPIENT_SEARCH_DEBOUNCE_MS);
  const { data, isFetching } = useGetAnalysisRecipientsQuery({ id: analysisId, search }, { skip: !search || disabled });
  const matches = search ? (data?.data?.recipients ?? []).filter((u) => !value.some((v) => v.id === u.id)) : [];
  const full = value.length >= ANALYSIS_MAIL_MAX_RECIPIENTS;

  const add = (u: AnalysisMailUser) => {
    if (!u.hasAccess || full) return;
    onChange([...value, u]);
    setQ('');
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          disabled={disabled || full}
          placeholder={full
            ? t('analysis.email.recipientsFull', { defaultValue: 'At most {{max}} recipients', max: ANALYSIS_MAIL_MAX_RECIPIENTS })
            : t('analysis.email.recipientsSearch', { defaultValue: 'Add people by name or email…' })}
          className="h-10 w-full rounded-full border border-slate-300 bg-white ps-10 pe-4 text-[13px] shadow-input outline-none focus:border-[#A29374]/40 focus:ring-2 focus:ring-[#A29374]/20 disabled:opacity-60"
        />
        {search && (matches.length > 0 || !isFetching) && (
          <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-float">
            {matches.length === 0 ? (
              <p className="px-3 py-2 text-[12.5px] text-slate-400">{t('analysis.email.noMatches', { defaultValue: 'No matching users.' })}</p>
            ) : matches.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => add(u)}
                disabled={!u.hasAccess}
                title={u.hasAccess ? undefined : t('analysis.email.noAccessHint', { defaultValue: 'This analysis is not shared with them. Share it first.' })}
                className={cn(
                  'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-start',
                  u.hasAccess ? 'hover:bg-slate-50' : 'cursor-not-allowed opacity-60',
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-slate-800">{u.name}</span>
                  <span className="block truncate text-[11.5px] text-slate-400">{u.email}</span>
                </span>
                {!u.hasAccess && (
                  <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-slate-400">
                    <Lock className="h-3 w-3" />
                    {t('analysis.email.noAccess', { defaultValue: 'Not shared' })}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((u) => (
            <span
              key={u.id}
              className={cn(
                'inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-1 text-[12px]',
                u.hasAccess === false ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-slate-200 bg-slate-50 text-slate-700',
              )}
              title={u.hasAccess === false ? t('analysis.email.lostAccess', { defaultValue: 'Can no longer open the analysis; skipped when sending.' }) : u.email}
            >
              <span className="truncate">{u.name}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onChange(value.filter((v) => v.id !== u.id))}
                  aria-label={t('analysis.email.removeRecipient', { defaultValue: 'Remove {{name}}', name: u.name })}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
