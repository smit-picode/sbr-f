'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { formatNumber } from '@/utils/format';
import type { FilterValue } from '@/types';

const INPUT_CLASS = 'h-8 text-xs shadow-none focus:border-[#A29374]/40 focus:ring-[#A29374]/20';

interface ValuePickerProps {
  // The column's known values with their counts, most frequent first; the caller fetches them.
  options: FilterValue[];
  loading?: boolean;
  multiple: boolean;
  values: string[];
  onChange: (values: string[]) => void;
  // Lets the caller fetch the options only once the list is opened.
  onOpenChange?: (open: boolean) => void;
  labelFor?: (value: string) => string;
  // Options are capped server-side; when the list is that long the picker says so.
  cap?: number;
  className?: string;
}

// A searchable list of a column's values with counts; an unlisted typed value can still be used.
export function ValuePicker({
  options, loading = false, multiple, values, onChange, onOpenChange, labelFor = (v) => v, cap = 200, className = 'w-60',
}: ValuePickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();
  const shown = q
    ? options.filter((o) => o.VALUE.toLowerCase().includes(q) || labelFor(o.VALUE).toLowerCase().includes(q))
    : options;
  const canAdd = q !== '' && !options.some((o) => o.VALUE.toLowerCase() === q) && !values.some((v) => v.toLowerCase() === q);

  const changeOpen = (o: boolean) => {
    setOpen(o);
    if (!o) setSearch('');
    onOpenChange?.(o);
  };
  // Select all acts on the listed options (search matches when searching); typed values are kept.
  const allShown = shown.length > 0 && shown.every((o) => values.includes(o.VALUE));
  const toggleAll = () => {
    const keys = new Set(shown.map((o) => o.VALUE));
    onChange(allShown ? values.filter((v) => !keys.has(v)) : [...values, ...shown.map((o) => o.VALUE).filter((v) => !values.includes(v))]);
  };
  const toggle = (v: string) => {
    if (!multiple) { onChange([v]); changeOpen(false); return; }
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  };

  const summary = values.length === 0
    ? (multiple ? t('valuePicker.pickValues', { defaultValue: 'Pick values…' }) : t('valuePicker.pickValue', { defaultValue: 'Pick a value…' }))
    : values.length <= 2
      ? values.map(labelFor).join(', ')
      : t('valuePicker.valuesPicked', { defaultValue: '{{count}} values', count: values.length });

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`flex h-8 items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2.5 text-start text-xs ${values.length ? 'text-slate-800' : 'text-slate-400'} ${className}`}
        >
          <span className="truncate">{summary}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2">
        <Input
          autoFocus
          className={INPUT_CLASS}
          placeholder={t('valuePicker.search', { defaultValue: 'Search or type a value…' })}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && canAdd) { toggle(search.trim()); setSearch(''); } }}
        />
        <div className="mt-2 max-h-64 overflow-y-auto">
          {canAdd && (
            <button type="button" onClick={() => { toggle(search.trim()); setSearch(''); }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-xs text-[#87795D] hover:bg-slate-50">
              <Plus className="h-3.5 w-3.5" />
              {t('valuePicker.use', { defaultValue: 'Use “{{value}}”', value: search.trim() })}
            </button>
          )}
          {values.filter((v) => !options.some((o) => o.VALUE === v)).map((v) => (
            <button key={`own-${v}`} type="button" onClick={() => toggle(v)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-xs hover:bg-slate-50">
              <Check className="h-3.5 w-3.5 text-[#A29374]" />
              <span className="flex-1 truncate text-slate-700">{labelFor(v)}</span>
            </button>
          ))}
          {multiple && shown.length > 1 && (
            <button type="button" onClick={toggleAll}
              className="mb-1 flex w-full items-center gap-2 rounded-md border-b border-slate-100 px-2 py-1.5 text-start text-xs font-medium text-slate-700 hover:bg-slate-50">
              <Check className={`h-3.5 w-3.5 shrink-0 ${allShown ? 'text-[#A29374]' : 'text-transparent'}`} />
              <span className="flex-1">{q ? t('valuePicker.selectAllMatching', { defaultValue: 'Select all matching' }) : t('valuePicker.selectAll', { defaultValue: 'Select all' })}</span>
              <span className="tabular-nums text-slate-400">{shown.length}</span>
            </button>
          )}
          {loading && !options.length && (
            <p className="px-2 py-3 text-xs text-slate-400">{t('valuePicker.loading', { defaultValue: 'Loading values…' })}</p>
          )}
          {shown.map((o) => {
            const on = values.includes(o.VALUE);
            return (
              <button key={o.VALUE} type="button" onClick={() => toggle(o.VALUE)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-xs hover:bg-slate-50">
                <Check className={`h-3.5 w-3.5 shrink-0 ${on ? 'text-[#A29374]' : 'text-transparent'}`} />
                <span className="flex-1 truncate text-slate-700" title={labelFor(o.VALUE)}>{labelFor(o.VALUE)}</span>
                <span className="tabular-nums text-slate-400">{formatNumber(o.CNT)}</span>
              </button>
            );
          })}
          {!loading && !shown.length && !canAdd && (
            <p className="px-2 py-3 text-xs text-slate-400">{t('valuePicker.none', { defaultValue: 'No values' })}</p>
          )}
        </div>
        {options.length >= cap && (
          <p className="mt-1 border-t border-slate-100 px-2 pt-1.5 text-[11px] text-slate-400">
            {t('valuePicker.topOnly', { defaultValue: 'The {{n}} most frequent values; type to use another one.', n: cap })}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
