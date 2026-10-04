'use client';

import { useMemo, useState } from 'react';
import { Check, Plus, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AnalysisAggregateResult, AnalysisEntity, AnalysisFilter, AnalysisFilterOp } from '@/types';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAnalysisResult } from '../../api/analysisService';
import { ANALYSIS_ENTITIES, ANALYSIS_FIELDS, ANALYSIS_FILTER_OPS } from '../../constants';
import { uid } from '../../utils/blocks';
import { fieldLabel, valueLabel } from '../../utils/labels';
import { FieldPicker } from './FieldPicker';

function opsFor(field: string): AnalysisFilterOp[] {
  const type = ANALYSIS_FIELDS[field]?.type;
  if (type === 'number') return ['between', 'empty', 'not_empty'];
  if (type === 'text' || type === 'id') return ['contains', 'empty', 'not_empty'];
  if (type === 'boolean') return ['in'];
  return ['in', 'not_in', 'empty', 'not_empty'];
}

export function filterSummary(t: ReturnType<typeof useTranslation>['t'], f: AnalysisFilter): string {
  const op = t(`analysis.ops.${f.op}`, { defaultValue: ANALYSIS_FILTER_OPS[f.op] });
  if (f.op === 'empty' || f.op === 'not_empty') return op;
  if (f.op === 'between') {
    if (f.min != null && f.max != null) return `${f.min.toLocaleString()}–${f.max.toLocaleString()}`;
    if (f.min != null) return `≥ ${f.min.toLocaleString()}`;
    if (f.max != null) return `≤ ${f.max.toLocaleString()}`;
    return op;
  }
  if (f.op === 'contains') return `${op} “${f.text ?? ''}”`;
  const vals = (f.values ?? []).map((v) => valueLabel(t, f.field, v, true));
  const shown = vals.length > 2 ? `${vals.slice(0, 2).join(', ')} +${vals.length - 2}` : vals.join(', ');
  return f.op === 'not_in' ? `${op} ${shown}` : shown || op;
}

// Value domain of a field (with unit counts) from the live frame, for the checklist.
function useDomain(entity: AnalysisEntity, field: string, enabled: boolean) {
  const req = useMemo(() => {
    if (!enabled) return null;
    const type = ANALYSIS_FIELDS[field]?.type;
    if (type !== 'category' && type !== 'boolean') return null;
    return {
      kind: 'aggregate' as const,
      query: { entity, frame: 'live', compareTo: null, dimensions: [field], measures: [{ id: 'c', agg: 'count' as const, field: null }], filters: [], sort: 'value_desc' as const, limit: null, otherBucket: false, columns: [] },
    };
  }, [entity, field, enabled]);
  return useAnalysisResult<AnalysisAggregateResult>(req);
}

function FilterBody({ filter, entity, onChange }: { filter: AnalysisFilter; entity: AnalysisEntity; onChange: (f: AnalysisFilter) => void }) {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const ops = opsFor(filter.field);
  const { data, isLoading } = useDomain(entity, filter.field, filter.op === 'in' || filter.op === 'not_in');
  const selected = new Set(filter.values ?? []);
  const options = (data?.rows ?? []).map((r) => ({ key: r.keys[0], n: r.n, label: valueLabel(t, filter.field, r.keys[0]) }))
    .filter((o) => !q || o.label.toLowerCase().includes(q.toLowerCase()));
  const toggle = (k: string | null) => {
    const next = new Set(selected);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    onChange({ ...filter, values: [...next] });
  };

  return (
    <div className="w-[300px]">
      <div className="px-3 pt-3 pb-2 border-b border-slate-100">
        <div className="text-[12.5px] font-bold text-slate-900 mb-2">{fieldLabel(t, filter.field)}</div>
        {ops.length > 1 && (
          <div className="flex flex-wrap gap-1">
            {ops.map((op) => (
              <button
                key={op}
                type="button"
                onClick={() => onChange({ ...filter, op })}
                className={cn('h-7 rounded-full px-2.5 text-[11.5px] font-semibold transition-colors', filter.op === op ? 'bg-dune text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
              >
                {t(`analysis.ops.${op}`, { defaultValue: ANALYSIS_FILTER_OPS[op] })}
              </button>
            ))}
          </div>
        )}
      </div>
      {(filter.op === 'in' || filter.op === 'not_in') && (
        <div className="p-2">
          {(data?.rows.length ?? 0) > 8 && (
            <div className="relative mb-1.5">
              <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('analysis.editor.searchValues', { defaultValue: 'Search values…' })} className="h-8 w-full rounded-full border border-slate-200 ps-8 pe-3 text-[12.5px] outline-none focus:border-[#A29374]/40 focus:ring-2 focus:ring-[#A29374]/20" />
            </div>
          )}
          <div className="max-h-[260px] overflow-y-auto">
            {isLoading && <p className="px-2 py-4 text-center text-[12px] text-slate-400">{t('analysis.loading', { defaultValue: 'Loading…' })}</p>}
            {options.map((o) => (
              <button key={String(o.key)} type="button" onClick={() => toggle(o.key)} className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px] text-slate-700 hover:bg-slate-100">
                <span className={cn('h-4 w-4 shrink-0 rounded border flex items-center justify-center', selected.has(o.key) ? 'bg-adaam border-adaam text-white' : 'border-slate-300')}>
                  {selected.has(o.key) && <Check className="h-3 w-3" />}
                </span>
                <span className={cn('flex-1 text-start truncate', o.key == null && 'italic text-slate-500')}>{o.label}</span>
                <span className="text-[11px] text-slate-400 tabular-nums">{o.n.toLocaleString()}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {filter.op === 'between' && (
        <div className="p-3 grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="text-[11px] text-slate-500">{t('analysis.editor.min', { defaultValue: 'Min' })}</span>
            <Input type="number" value={filter.min ?? ''} onChange={(e) => onChange({ ...filter, min: e.target.value === '' ? null : Number(e.target.value) })} className="h-8 text-xs focus:border-[#A29374]/40 focus:ring-[#A29374]/20" />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] text-slate-500">{t('analysis.editor.max', { defaultValue: 'Max' })}</span>
            <Input type="number" value={filter.max ?? ''} onChange={(e) => onChange({ ...filter, max: e.target.value === '' ? null : Number(e.target.value) })} className="h-8 text-xs focus:border-[#A29374]/40 focus:ring-[#A29374]/20" />
          </label>
        </div>
      )}
      {filter.op === 'contains' && (
        <div className="p-3">
          <Input autoFocus value={filter.text ?? ''} onChange={(e) => onChange({ ...filter, text: e.target.value })} placeholder={t('analysis.editor.textPlaceholder', { defaultValue: 'Type text…' })} className="h-8 text-xs focus:border-[#A29374]/40 focus:ring-[#A29374]/20" />
        </div>
      )}
      {(filter.op === 'empty' || filter.op === 'not_empty') && (
        <p className="px-3 py-3 text-[12px] text-slate-500">
          {filter.op === 'empty'
            ? t('analysis.editor.emptyHint', { defaultValue: 'Keeps units where this field is not recorded.' })
            : t('analysis.editor.notEmptyHint', { defaultValue: 'Keeps units where this field is recorded.' })}
        </p>
      )}
    </div>
  );
}

function newFilterFor(field: string): AnalysisFilter {
  const op = opsFor(field)[0];
  if (op === 'between') return { id: uid('f'), field, op, min: null, max: null };
  if (op === 'contains') return { id: uid('f'), field, op, text: '' };
  return { id: uid('f'), field, op, values: [] };
}

interface FilterChipsProps {
  filters: AnalysisFilter[];
  onChange: (filters: AnalysisFilter[]) => void;
  entity: AnalysisEntity;
  fields?: string[];
  readOnly?: boolean;
  compact?: boolean;
  addLabel?: string;
}

export function FilterChips({ filters, onChange, entity, fields, readOnly, compact, addLabel }: FilterChipsProps) {
  const { t } = useTranslation();
  const [openId, setOpenId] = useState<string | null>(null);
  const allFields = fields ?? ANALYSIS_ENTITIES[entity].fields;
  // A filter's value domain comes from the first entity that has its field.
  const domainEntity = (field: string): AnalysisEntity =>
    ANALYSIS_ENTITIES[entity].fields.includes(field) ? entity : (Object.keys(ANALYSIS_ENTITIES) as AnalysisEntity[]).find((e) => ANALYSIS_ENTITIES[e].fields.includes(field)) ?? entity;

  const update = (f: AnalysisFilter) => onChange(filters.map((x) => (x.id === f.id ? f : x)));
  const remove = (id: string) => onChange(filters.filter((x) => x.id !== id));

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {filters.map((f) => (
        <Popover key={f.id} open={openId === f.id} onOpenChange={(o) => setOpenId(o ? f.id : null)}>
          <span
            className={cn(
              'inline-flex max-w-full items-center gap-0.5 rounded-full border bg-white ps-2.5 pe-1 text-slate-700 transition-colors focus-within:ring-2 focus-within:ring-adaam/25',
              compact ? 'h-7 text-[11.5px]' : 'h-8 text-[12px]',
              openId === f.id ? 'border-adaam/60 ring-2 ring-adaam/15' : 'border-slate-200 hover:border-slate-300',
              readOnly && 'pe-2.5'
            )}
          >
            <PopoverTrigger asChild disabled={readOnly}>
              <button type="button" className={cn('inline-flex min-w-0 items-center gap-1 outline-none', readOnly ? 'cursor-default' : 'cursor-pointer')}>
                <span className="font-semibold text-slate-500 shrink-0">{fieldLabel(t, f.field)}:</span>
                <span className="truncate max-w-[180px]">{filterSummary(t, f)}</span>
              </button>
            </PopoverTrigger>
            {!readOnly && (
              <button
                type="button"
                onClick={() => remove(f.id)}
                className="h-5 w-5 shrink-0 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:bg-slate-100"
                aria-label={t('analysis.editor.removeFilter', { defaultValue: 'Remove filter' })}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
          <PopoverContent className="p-0" align="start">
            <FilterBody filter={f} entity={domainEntity(f.field)} onChange={update} />
          </PopoverContent>
        </Popover>
      ))}
      {!readOnly && (
        <FieldPicker
          fields={allFields}
          value={null}
          onChange={(field) => {
            const f = newFilterFor(field);
            onChange([...filters, f]);
            setTimeout(() => setOpenId(f.id), 0);
          }}
          trigger={
            <button
              type="button"
              className={cn(
                'inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-2.5 text-slate-500 hover:border-adaam/50 hover:text-adaam-deep hover:bg-adaam-tint/40',
                compact ? 'h-7 text-[11.5px]' : 'h-8 text-[12px]'
              )}
            >
              <Plus className="h-3 w-3" />
              {addLabel ?? t('analysis.editor.addFilter', { defaultValue: 'Add filter' })}
            </button>
          }
        />
      )}
    </div>
  );
}
