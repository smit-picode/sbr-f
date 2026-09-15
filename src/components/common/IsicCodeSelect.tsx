'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useGetIsicValuesQuery, useGetIsic2DigitValuesQuery } from '@/features/lookups/api/lookupsApi';
import { useTranslation } from 'react-i18next';

/**
 * Pick an ISIC code from the SBR_ISIC_LKP classification list.
 *
 * Replaces free-text ISIC entry so an invalid code cannot be typed — the value can only ever
 * come from the lookup. Mirrors the SbrIdSearchInput idiom (trigger → search panel → click to
 * select), with one deliberate difference: the list is loaded ONCE (from
 * SBR_LOOKUPS_API.GET_ISIC_VALUES, or GET_ISIC_2DIGIT_VALUES in `digitMode="lvl2"`) and filtered
 * in memory, because neither procedure exposes a search or paging parameter. That is also why
 * there is no useDebounce here — no keystroke reaches the network, so debouncing would only add
 * lag to a local array filter.
 *
 * A value already on the record is always displayed even when the lookup does not contain it.
 * Historic rows can carry codes the current lookup has dropped, and silently blanking one on
 * open would turn "edit the employment count" into an unintended ISIC change.
 */
interface IsicCodeSelectProps {
  /** Current ISIC code, or '' when unset. */
  value: string;
  /** Called with the selected code, or '' when cleared. */
  onChange: (code: string) => void;
  disabled?: boolean;
  /** Marks the trigger invalid, matching the modal's error styling. */
  invalid?: boolean;
  /**
   * 'lvl4' (default): the ~437-row full classification (Establishments/Enterprises ISIC_CODE).
   * 'lvl2': the ~87-row division-level list (Enterprise Groups' PRINCIPAL_ISIC_2DIGIT).
   * Defaults to 'lvl4' so every existing caller keeps its current behaviour unchanged.
   */
  digitMode?: 'lvl4' | 'lvl2';
}

// Rendering all ~437 (lvl4) / ~87 (lvl2) options at once is wasted DOM for a list nobody scrolls
// end to end. Anything beyond this is reachable by typing, and the panel says so.
const MAX_VISIBLE = 50;

export function IsicCodeSelect({ value, onChange, disabled, invalid, digitMode = 'lvl4' }: IsicCodeSelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  // The panel is portaled to <body> (see below) so a modal's `overflow-y-auto` body can't clip
  // it — position it in fixed/viewport coordinates from the trigger's own rect instead of
  // relying on CSS `absolute` positioning off a `relative` ancestor.
  const [panelRect, setPanelRect] = useState<{ top: number; left: number; width: number } | null>(null);

  // Both hooks are always called (React hook rules — no conditional calls), but only one of the
  // two ever has an active subscriber per rendered instance since digitMode is fixed per usage,
  // so this never doubles up the actual network/cache traffic for either list.
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

  // Close on outside click so the panel never sits over the rest of the form. The panel itself
  // lives in a portal (outside containerRef in the DOM), so it needs its own ref checked too.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  // Track the trigger's viewport position while open, so the portaled panel stays anchored
  // under it even when an ancestor (e.g. a modal's scrollable body) scrolls or the window resizes.
  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) setPanelRect({ top: rect.bottom, left: rect.left, width: rect.width });
    };
    update();
    window.addEventListener('resize', update);
    document.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      document.removeEventListener('scroll', update, true);
    };
  }, [open]);

  // Focus the search box on open so the user can type straight away.
  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

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
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-full border bg-white px-4 py-2 text-start text-sm transition-colors ${triggerClasses}`}
      >
        {value ? (
          <span className="min-w-0 flex-1 truncate">
            <span className="font-mono text-xs font-medium text-[#8A1538]">{value}</span>
            {selected?.DESCRIPTION && <span className="ms-2 text-slate-600">{selected.DESCRIPTION}</span>}
          </span>
        ) : (
          <span className="flex-1 text-slate-400">
            {t('isicSelect.placeholder', { defaultValue: 'Select ISIC code' })}
          </span>
        )}
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" />
      </button>

      {/* Clearing is its own control rather than a list entry: ISIC_CODE is nullable, and an
          empty option inside the list would sit among the valid codes as if it were one. */}
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

      {open && panelRect && createPortal(
        <div
          ref={panelRef}
          className="fixed z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-float"
          style={{ top: panelRect.top + 4, left: panelRect.left, width: panelRect.width }}
        >
          <div className="relative border-b border-slate-100 p-2">
            <Search className="pointer-events-none absolute start-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
              placeholder={t('isicSelect.searchPlaceholder', { defaultValue: 'Search by code or activity…' })}
              className="h-8 ps-7 text-xs shadow-none focus:border-[#8A1538]/40 focus:ring-[#8A1538]/20"
              autoComplete="off"
            />
          </div>

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
              <ul className="max-h-56 overflow-y-auto" role="listbox">
                {matches.slice(0, MAX_VISIBLE).map((o) => (
                  <li key={o.CODE}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={o.CODE === value}
                      onClick={() => select(o.CODE)}
                      className="flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-slate-50"
                    >
                      <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${o.CODE === value ? 'text-[#8A1538]' : 'text-transparent'}`} />
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
        </div>,
        document.body
      )}
    </div>
  );
}
