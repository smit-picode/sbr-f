'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useGetMainBranchValuesQuery } from '@/features/lookups/api/lookupsApi';
import { useTranslation } from 'react-i18next';

/**
 * Pick an establishment's Main Branch SBR ID from the active main-branch establishment list
 * (SBR_LOOKUPS_API.GET_MAIN_BRANCH_VALUES).
 *
 * Replaces the general "search any establishment by name" picker so a non-existent, retired, or
 * branch-only SBR ID can never be selected — the value can only ever come from a candidate the
 * lookup already restricts to VALID_TO IS NULL AND MAIN_BRANCH_FLG = 'MAIN'. Mirrors
 * IsicCodeSelect's pattern exactly (same load-once, filter-client-side shape and interaction),
 * since the two lookups are the same order of magnitude and the procedure exposes no search or
 * paging parameter either.
 *
 * A value already on the record is always displayed even when the lookup does not contain it
 * (e.g. the establishment it pointed to has since become a branch, or was deactivated) — same
 * rule as IsicCodeSelect, for the same reason: silently blanking it on open would turn an
 * unrelated field edit into an unintended Main Branch change.
 */
interface MainBranchSelectProps {
  /** Current Main Branch SBR ID, or null when unset. */
  value: number | null;
  /** Called with the selected SBR ID, or null when cleared. */
  onChange: (sbrId: number | null) => void;
  disabled?: boolean;
  /** Marks the trigger invalid, matching the modal's error styling. */
  invalid?: boolean;
}

// Same rationale as IsicCodeSelect's MAX_VISIBLE: cap rendered DOM, not what is reachable —
// anything beyond this is reachable by typing, and the panel says so.
const MAX_VISIBLE = 50;

export function MainBranchSelect({ value, onChange, disabled, invalid }: MainBranchSelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const { data, isFetching } = useGetMainBranchValuesQuery();
  const options = useMemo(() => data?.data ?? [], [data]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        String(o.SBR_ID).includes(q) ||
        (o.NAME_ENU ?? '').toLowerCase().includes(q) ||
        (o.NAME_ARA ?? '').toLowerCase().includes(q)
    );
  }, [options, query]);

  const selected = useMemo(() => options.find((o) => o.SBR_ID === value), [options, value]);

  // Close on outside click so the panel never sits over the rest of the form.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  // Focus the search box on open so the user can type straight away.
  useEffect(() => {
    if (open) searchRef.current?.focus();
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

  const triggerClasses = disabled
    ? 'bg-slate-50 text-slate-400 cursor-not-allowed pointer-events-none border-slate-200'
    : invalid
      ? 'border-red-400'
      : 'border-slate-200 hover:bg-slate-50';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-white px-3 py-2 text-start text-sm transition-colors ${triggerClasses}`}
      >
        {value != null ? (
          <span className="min-w-0 flex-1 truncate">
            <span className="font-mono text-xs font-medium text-[#A71D3A]">{value}</span>
            {selected?.NAME_ENU && <span className="ms-2 text-slate-600">{selected.NAME_ENU}</span>}
          </span>
        ) : (
          <span className="flex-1 text-slate-400">
            {t('mainBranchSelect.placeholder', { defaultValue: 'Select main branch SBR ID' })}
          </span>
        )}
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" />
      </button>

      {/* Clearing is its own control rather than a list entry: MAIN_BRANCH_SBR_ID is nullable,
          and an empty option inside the list would sit among the valid SBR IDs as if it were one. */}
      {value != null && !disabled && (
        <button
          type="button"
          onClick={clear}
          aria-label={t('actions.clear', { defaultValue: 'Clear' })}
          className="absolute end-8 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 transition-colors hover:text-slate-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-md">
          <div className="relative border-b border-slate-100 p-2">
            <Search className="pointer-events-none absolute start-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
              placeholder={t('mainBranchSelect.searchPlaceholder', { defaultValue: 'Search by SBR ID or name…' })}
              className="h-8 ps-7 text-xs shadow-none focus:border-[#A71D3A]/40 focus:ring-[#A71D3A]/20"
              autoComplete="off"
            />
          </div>

          {isFetching ? (
            <p className="px-3 py-2 text-xs text-slate-400">
              {t('mainBranchSelect.loading', { defaultValue: 'Loading main branch establishments…' })}
            </p>
          ) : options.length === 0 ? (
            <p className="px-3 py-2 text-xs text-amber-600">
              {t('mainBranchSelect.unavailable', { defaultValue: 'Main branch list could not be loaded. Please refresh and try again.' })}
            </p>
          ) : matches.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-400">
              {t('mainBranchSelect.noMatch', { defaultValue: 'No matching establishments.' })}
            </p>
          ) : (
            <>
              <ul className="max-h-56 overflow-y-auto" role="listbox">
                {matches.slice(0, MAX_VISIBLE).map((o) => (
                  <li key={o.SBR_ID}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={o.SBR_ID === value}
                      onClick={() => select(o.SBR_ID)}
                      className="flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-slate-50"
                    >
                      <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${o.SBR_ID === value ? 'text-[#A71D3A]' : 'text-transparent'}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-mono text-xs font-medium text-slate-700">{o.SBR_ID}</span>
                        {o.NAME_ENU && <span className="block text-xs text-slate-500">{o.NAME_ENU}</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {matches.length > MAX_VISIBLE && (
                <p className="border-t border-slate-100 px-3 py-1.5 text-xs text-slate-400">
                  {t('mainBranchSelect.moreResults', {
                    count: matches.length - MAX_VISIBLE,
                    defaultValue: '{{count}} more — keep typing to narrow the list.',
                  })}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
