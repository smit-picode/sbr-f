'use client';

import { useMemo, useState } from 'react';
import { Binary, Check, ChevronDown, Hash, Search, Tag, TextCursorInput, Fingerprint } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AnalysisFieldType } from '@/types';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ANALYSIS_FIELD_GROUP_LABELS, ANALYSIS_FIELDS, type AnalysisFieldGroup } from '../../constants';
import { fieldGroupLabel, fieldLabel } from '../../utils/labels';

const TYPE_ICON: Record<AnalysisFieldType, typeof Tag> = { category: Tag, number: Hash, boolean: Binary, text: TextCursorInput, id: Fingerprint };

export function FieldTypeIcon({ type, className }: { type: AnalysisFieldType; className?: string }) {
  const Icon = TYPE_ICON[type];
  return <Icon className={className} />;
}

interface FieldPickerProps {
  fields: string[];
  value: string | null;
  onChange: (field: string) => void;
  types?: AnalysisFieldType[];
  exclude?: string[];
  placeholder?: string;
  className?: string;
  trigger?: React.ReactNode;
  extra?: { id: string; label: string }[];
}

export function FieldPicker({ fields, value, onChange, types, exclude = [], placeholder, className, trigger, extra = [] }: FieldPickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const allowed = fields.filter((f) => {
      const def = ANALYSIS_FIELDS[f];
      if (!def || exclude.includes(f)) return false;
      if (types && !types.includes(def.type)) return false;
      return !needle || fieldLabel(t, f).toLowerCase().includes(needle);
    });
    const byGroup = new Map<AnalysisFieldGroup, string[]>();
    for (const f of allowed) {
      const g = ANALYSIS_FIELDS[f].group;
      if (!byGroup.has(g)) byGroup.set(g, []);
      byGroup.get(g)!.push(f);
    }
    return (Object.keys(ANALYSIS_FIELD_GROUP_LABELS) as AnalysisFieldGroup[]).filter((g) => byGroup.has(g)).map((g) => ({ g, items: byGroup.get(g)! }));
  }, [fields, exclude, types, q, t]);

  const extraMatches = extra.filter((e) => !q || e.label.toLowerCase().includes(q.toLowerCase()));
  const label = value ? extra.find((e) => e.id === value)?.label ?? fieldLabel(t, value) : null;

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQ(''); }}>
      <PopoverTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className={cn(
              'h-9 w-full inline-flex items-center justify-between gap-2 rounded-full border border-slate-300 bg-white ps-3.5 pe-3 text-[12.5px] shadow-input hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-adaam/30',
              !label && 'text-slate-400',
              className
            )}
          >
            <span className="truncate">{label ?? placeholder ?? t('analysis.editor.pickField', { defaultValue: 'Choose a field' })}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[290px] p-0" align="start">
        <div className="p-2 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('analysis.editor.searchFields', { defaultValue: 'Search fields…' })}
              className="h-8 w-full rounded-full border border-slate-200 ps-8 pe-3 text-[12.5px] outline-none focus:border-[#A29374]/40 focus:ring-2 focus:ring-[#A29374]/20"
            />
          </div>
        </div>
        <div className="max-h-[320px] overflow-y-auto p-1.5">
          {extraMatches.map((e) => (
            <button key={e.id} type="button" onClick={() => { onChange(e.id); setOpen(false); }} className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] text-slate-700 hover:bg-slate-100">
              <Tag className="h-3.5 w-3.5 text-slate-400" />
              <span className="flex-1 text-start truncate">{e.label}</span>
              {value === e.id && <Check className="h-3.5 w-3.5 text-adaam" />}
            </button>
          ))}
          {groups.map(({ g, items }) => (
            <div key={g} className="mb-1">
              <div className="px-2.5 pt-2 pb-1 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">{fieldGroupLabel(t, g)}</div>
              {items.map((f) => (
                <button key={f} type="button" onClick={() => { onChange(f); setOpen(false); }} className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] text-slate-700 hover:bg-slate-100">
                  <FieldTypeIcon type={ANALYSIS_FIELDS[f].type} className="h-3.5 w-3.5 text-slate-400" />
                  <span className="flex-1 text-start truncate">{fieldLabel(t, f)}</span>
                  {value === f && <Check className="h-3.5 w-3.5 text-adaam" />}
                </button>
              ))}
            </div>
          ))}
          {!groups.length && !extraMatches.length && <p className="px-3 py-6 text-center text-[12px] text-slate-400">{t('analysis.editor.noFields', { defaultValue: 'No matching fields' })}</p>}
        </div>
      </PopoverContent>
    </Popover>
  );
}
