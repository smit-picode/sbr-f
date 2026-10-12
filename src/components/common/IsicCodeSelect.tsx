'use client';

import { useMemo, useRef, useState } from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNearestDialogContainer } from '@/hooks';
import { useGetIsicValuesQuery, useGetIsic2DigitValuesQuery } from '@/features/lookups/api/lookupsApi';
import { useTranslation } from 'react-i18next';

// Pick an ISIC code from the SBR_ISIC_LKP classification list.
interface IsicCodeSelectProps {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  digitMode?: 'lvl4' | 'lvl2';
}

const MAX_VISIBLE = 50;

export function IsicCodeSelect({ value, onChange, disabled, invalid, digitMode = 'lvl4' }: IsicCodeSelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const { ref: containerRef, container } = useNearestDialogContainer<HTMLDivElement>();

  const lvl4 = useGetIsicValuesQuery(undefined, { skip: digitMode !== 'lvl4' });
  const lvl2 = useGetIsic2DigitValuesQuery(undefined, { skip: digitMode !== 'lvl2' });
  const { data, isFetching } = digitMode === 'lvl2' ? lvl2 : lvl4;
  const options = useMemo(() => data?.data ?? [], [data]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.CODE.toLowerCase().includes(q) || (o.DESCRIPTION ?? '').toLowerCase().includes(q)
    );
  }, [options, query]);

  const selected = useMemo(() => options.find((o) => o.CODE === value), [options, value]);

  const select = (code: string) => {
    onChange(code);
    setQuery('');
    setOpen(false);
  };

  const triggerClasses = disabled
    ? 'bg-slate-50 text-slate-400 cursor-not-allowed pointer-events-none border-slate-200'
    : invalid
      ? 'border-red-400'
      : 'border-slate-200 hover:bg-slate-50 shadow-input';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div ref={containerRef} className="relative">
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={open}
            className={`flex h-10 w-full items-center justify-between gap-2 rounded-full border bg-white px-4 py-2 text-start text-sm transition-colors ${triggerClasses}`}
          >
            {value ? (
              <span className="min-w-0 flex-1 truncate">
                <span className="font-mono text-xs font-medium text-[#A29374]">{value}</span>
                {selected?.DESCRIPTION && <span className="ms-2 text-slate-600">{selected.DESCRIPTION}</span>}
              </span>
            ) : (
              <span className="flex-1 text-slate-400">
                {t('isicSelect.placeholder', { defaultValue: 'Select ISIC code' })}
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" />
          </button>
        </PopoverTrigger>

        {value && !disabled && (
          <button
            type="button"
            onClick={() => select('')}
            aria-label={t('actions.clear', { defaultValue: 'Clear' })}
            className="absolute end-8 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 transition-colors hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <PopoverContent
        container={container}
        onOpenAutoFocus={(e) => { e.preventDefault(); searchRef.current?.focus(); }}
        className="flex w-[var(--radix-popover-trigger-width)] max-h-[min(260px,var(--radix-popover-content-available-height))] flex-col overflow-hidden p-0"
      >
        <div className="relative shrink-0 border-b border-slate-100 p-2">
          <Search className="pointer-events-none absolute start-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
            placeholder={t('isicSelect.searchPlaceholder', { defaultValue: 'Search by code or activity…' })}
            className="h-8 ps-7 text-xs shadow-none focus:border-[#A29374]/40 focus:ring-[#A29374]/20"
            autoComplete="off"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {isFetching ? (
            <p className="px-3 py-2 text-xs text-slate-400">
              {t('isicSelect.loading', { defaultValue: 'Loading ISIC codes…' })}
            </p>
          ) : options.length === 0 ? (
            <p className="px-3 py-2 text-xs text-amber-600">
              {t('isicSelect.unavailable', { defaultValue: 'ISIC codes could not be loaded. Please refresh and try again.' })}
            </p>
          ) : matches.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-400">
              {t('isicSelect.noMatch', { defaultValue: 'No matching ISIC codes.' })}
            </p>
          ) : (
            <>
              <ul role="listbox">
                {matches.slice(0, MAX_VISIBLE).map((o) => (
                  <li key={o.CODE}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={o.CODE === value}
                      onClick={() => select(o.CODE)}
                      className="flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-slate-50"
                    >
                      <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${o.CODE === value ? 'text-[#A29374]' : 'text-transparent'}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-mono text-xs font-medium text-slate-700">{o.CODE}</span>
                        {o.DESCRIPTION && <span className="block text-xs text-slate-500">{o.DESCRIPTION}</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {matches.length > MAX_VISIBLE && (
                <p className="border-t border-slate-100 px-3 py-1.5 text-xs text-slate-400">
                  {t('isicSelect.moreResults', {
                    count: matches.length - MAX_VISIBLE,
                    defaultValue: '{{count}} more — keep typing to narrow the list.',
                  })}
                </p>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
