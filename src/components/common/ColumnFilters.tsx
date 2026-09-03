'use client';

import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SlidersHorizontal, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface ColumnFilterRow {
  id: string;
  column: string;
  operator: string;
  value: string;
}

export interface ColumnFilterOption {
  value: string;
  label: string;
}

// Full 8-operator set SBR_QUERY_PKG accepts — snake_case values must match
// the procedure's whitelist exactly, or it now raises ORA-20410 instead of silently ignoring it.
const OPERATORS = [
  'contains', 'not_contains', 'starts_with', 'ends_with',
  'equals', 'is_not', 'is_empty', 'is_not_empty',
] as const;
const OP_FALLBACK: Record<string, string> = {
  contains: 'contains',
  not_contains: 'does not contain',
  starts_with: 'starts with',
  ends_with: 'ends with',
  equals: 'equals',
  is_not: 'is not',
  is_empty: 'is empty',
  is_not_empty: 'is not empty',
};
// These two operators test for null/blank and take no value — SBR_QUERY_PKG ignores whatever
// is sent for them, so the value box is hidden rather than left as a dead, misleading input.
export const NO_VALUE_OPERATORS = new Set(['is_empty', 'is_not_empty']);

// A filter row is ready to send once its column is picked and either it has a typed value or its
// operator doesn't need one. Every *ListPage that renders <ColumnFilters> derives its
// `columnFilters` query param with this — without it, is_empty/is_not_empty rows (whose value is
// always blank) get silently dropped by a `r.value.trim()` check before ever reaching the API.
export const isActiveColumnFilterRow = (r: ColumnFilterRow): boolean =>
  !!r.column && (NO_VALUE_OPERATORS.has(r.operator) || !!r.value.trim());

interface ColumnFiltersProps {
  columns: ColumnFilterOption[];
  value: ColumnFilterRow[];
  onChange: (rows: ColumnFilterRow[]) => void;
}

export function ColumnFilters({ columns, value, onChange }: ColumnFiltersProps) {
  const { t } = useTranslation();
  const counter = useRef(0);

  const opLabel = (op: string) => t(`columnFilters.op.${op}`, { defaultValue: OP_FALLBACK[op] ?? op });

  const addRow = () => {
    counter.current += 1;
    onChange([...value, { id: `cf-${counter.current}`, column: columns[0]?.value ?? '', operator: 'contains', value: '' }]);
  };
  const updateRow = (id: string, patch: Partial<ColumnFilterRow>) =>
    onChange(value.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const removeRow = (id: string) => onChange(value.filter((r) => r.id !== id));

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
            {t('columnFilters.title', { defaultValue: 'Column filters' })}
          </div>
          {value.length === 0 ? (
            <p className="mt-1.5 text-xs text-slate-400">
              {t('columnFilters.empty', { defaultValue: 'No column filters — add one to narrow by any column.' })}
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {value.map((row) => (
                <div key={row.id} className="flex flex-wrap items-center gap-2">
                  <Select value={row.column} onValueChange={(v) => updateRow(row.id, { column: v })}>
                    <SelectTrigger className="h-8 w-44 text-xs shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map((c) => (
                        <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={row.operator} onValueChange={(v) => updateRow(row.id, { operator: v })}>
                    <SelectTrigger className="h-8 w-36 text-xs shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATORS.map((op) => (
                        <SelectItem key={op} value={op} className="text-xs">{opLabel(op)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!NO_VALUE_OPERATORS.has(row.operator) && (
                    <Input
                      className="h-8 w-56 text-xs shadow-none focus:border-[#A71D3A]/40 focus:ring-[#A71D3A]/20"
                      placeholder={t('columnFilters.valuePlaceholder', { defaultValue: 'Value…' })}
                      value={row.value}
                      onChange={(e) => updateRow(row.id, { value: e.target.value })}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    aria-label={t('columnFilters.remove', { defaultValue: 'Remove filter' })}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={addRow}
          className="-mr-1 -mt-1 flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#A71D3A] transition-colors hover:bg-[#FCF4F6]"
        >
          <Plus className="h-3 w-3" />
          {t('columnFilters.add', { defaultValue: 'Add filter' })}
        </button>
      </div>
    </div>
  );
}
