'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Columns3, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import type { SamplingField } from '@/types';
import { SAMPLING_MAX_COLUMNS } from '../constants';
import { fieldLabel } from '../utils/labels';

const INPUT_CLASS = 'h-8 text-xs shadow-none focus:border-[#A29374]/40 focus:ring-[#A29374]/20';

// The fields exported with each row, in tick order; the row id and design columns come first.
export function ColumnPicker({ fields, value, onChange, keyField, defaults, label }: {
  fields: SamplingField[];
  value: string[];
  onChange: (v: string[]) => void;
  keyField: string;
  defaults: string[];
  label?: string;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();
  const origins: { origin: SamplingField['ORIGIN']; label: string }[] = [
    { origin: 'frame', label: t('sampling.originFrame', { defaultValue: 'Classification & derived' }) },
    { origin: 'register', label: t('sampling.originRegister', { defaultValue: 'Register record' }) },
  ];
  const toggle = (f: string) => onChange(value.includes(f) ? value.filter((x) => x !== f) : value.length >= SAMPLING_MAX_COLUMNS ? value : [...value, f]);

  return (
    <Popover onOpenChange={(o) => { if (!o) setSearch(''); }}>
      <PopoverTrigger asChild>
        <button type="button" className="flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700">
          <Columns3 className="h-3.5 w-3.5 text-slate-400" />
          {label ?? t('sampling.columnsPicked', { defaultValue: '{{count}} output fields', count: value.length })}
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-2">
        <div className="flex items-center gap-2">
          <Input autoFocus className={INPUT_CLASS} placeholder={t('sampling.searchFields', { defaultValue: 'Search fields…' })} value={search} onChange={(e) => setSearch(e.target.value)} />
          <button type="button" onClick={() => onChange(defaults.filter((c) => fields.some((f) => f.FIELD_NAME === c)))}
            className="shrink-0 rounded-md px-2 py-1 text-[11px] font-medium text-[#87795D] hover:bg-[#F4F0E8]">
            {t('sampling.defaults', { defaultValue: 'Defaults' })}
          </button>
          <button type="button" onClick={() => onChange([])} className="shrink-0 rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100">
            {t('sampling.none', { defaultValue: 'None' })}
          </button>
        </div>
        <div className="mt-2 max-h-80 space-y-2 overflow-y-auto">
          {origins.map((g) => {
            const items = fields.filter((f) => f.ORIGIN === g.origin && f.FIELD_NAME !== keyField)
              .map((f) => ({ f, label: fieldLabel(t, f.FIELD_NAME, f.ORIGIN) }))
              .filter(({ f, label }) => !q || label.toLowerCase().includes(q) || f.FIELD_NAME.toLowerCase().includes(q));
            if (!items.length) return null;
            return (
              <div key={g.origin}>
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400">{g.label}</div>
                {items.map(({ f, label }) => (
                  <label key={f.FIELD_NAME} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-xs hover:bg-slate-50">
                    <Checkbox checked={value.includes(f.FIELD_NAME)} onCheckedChange={() => toggle(f.FIELD_NAME)} />
                    <span className="flex-1 truncate text-slate-700">{label}</span>
                    <span className="font-mono text-[10px] text-slate-400">{f.FIELD_NAME}</span>
                  </label>
                ))}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
