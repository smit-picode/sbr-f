'use client';

import { useEffect, useRef, useState } from 'react';
import { Building2, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { useGetEstablishmentsListQuery } from '@/features/establishments/api/establishmentsApi';
import { nullableText } from '@/utils/format';
import { useTranslation } from 'react-i18next';

/**
 * Pick an establishment by searching, and store its SBR ID.
 *
 * Replaces free-text SBR ID entry so a non-existent ID cannot be typed — the value can only
 * ever come from a record that exists (2026-08-11 requirements call). Mirrors the enterprise
 * search already used in the Enterprise Group modals: debounced query, small result list,
 * click to select.
 *
 * Search matches on NAME_ENU / NAME_ARA / NPC_NAME_* only — that is what the list procedure's
 * p_search covers. Searching by typing the SBR ID itself needs the procedure's column filter,
 * which is currently broken upstream (the filter loop drops every row), so it is deliberately
 * not wired here; each result shows its SBR ID so the user can still confirm the right record.
 */
interface SbrIdSearchInputProps {
  value: number | null;
  onChange: (sbrId: number | null) => void;
  disabled?: boolean;
  /** Extra classes for the trigger input, e.g. the modal's locked/error styling. */
  className?: string;
  placeholder?: string;
}

export function SbrIdSearchInput({ value, onChange, disabled, className, placeholder }: SbrIdSearchInputProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 400);

  const { data, isFetching } = useGetEstablishmentsListQuery(
    { search: debouncedQuery, page: 1, limit: 6 },
    { skip: !open || !debouncedQuery }
  );
  const results = data?.data ?? [];

  // Close on outside click so the panel never sits over the rest of the form.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const select = (sbrId: number) => {
    onChange(sbrId);
    setQuery('');
    setOpen(false);
  };

  const clear = () => {
    onChange(null);
    setQuery('');
    setOpen(false);
  };

  // A chosen value is shown as a read-only chip: re-selecting means searching again, which
  // keeps "the value always came from a real record" true for the lifetime of the form.
  if (value !== null && value !== undefined && !open) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex flex-1 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="font-mono text-xs font-medium text-[#A71D3A]">{value}</span>
        </span>
        {!disabled && (
          <button
            type="button"
            onClick={clear}
            aria-label={t('actions.clear', { defaultValue: 'Clear' })}
            className="rounded-md border border-slate-200 bg-white p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <Input
        value={query}
        disabled={disabled}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder ?? t('common.searchEstablishmentPlaceholder', { defaultValue: 'Search establishments by name...' })}
        className={`ps-8 shadow-none focus:border-[#A71D3A]/40 focus:ring-[#A71D3A]/20 ${className ?? ''}`}
        autoComplete="off"
      />

      {open && debouncedQuery && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-md">
          {isFetching ? (
            <p className="px-3 py-2 text-xs text-slate-400">{t('common.searching', { defaultValue: 'Searching…' })}</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-400">{t('common.noMatchingEstablishments', { defaultValue: 'No matching establishments.' })}</p>
          ) : (
            <ul className="max-h-44 overflow-y-auto">
              {results.map((e) => (
                <li key={e.ID}>
                  <button
                    type="button"
                    onClick={() => select(e.SBR_ID)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-slate-50"
                  >
                    <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-slate-800">{nullableText(e.NAME_ENU)}</span>
                      <span className="block font-mono text-xs text-slate-400">{e.SBR_ID}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
