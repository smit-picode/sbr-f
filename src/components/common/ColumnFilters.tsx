'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SlidersHorizontal, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ValuePicker } from '@/components/common/ValuePicker';
import { useGetFilterValuesQuery } from '@/services/filterValuesApi';

import type { ColumnFilterItem, ColumnFilterOption, ColumnFilterRow, ColumnFilterType } from '@/types';
// Operators SBR_QUERY_PKG accepts, matching its whitelist exactly (else ORA-20410); comparisons are for number and date columns only.
const TEXT_OPERATORS = [
  'contains', 'not_contains', 'starts_with', 'ends_with',
  'equals', 'is_not', 'is_empty', 'is_not_empty',
] as const;
const COMPARE_OPERATORS = [
  'equals', 'is_not', 'greater_than', 'greater_or_equal', 'less_than', 'less_or_equal', 'between',
  'is_empty', 'is_not_empty',
] as const;
// With a values source, text columns also get the list operators, whose values come from a picker.
const PICK_TEXT_OPERATORS = [
  'in', 'not_in', 'equals', 'is_not', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty',
] as const;
const LIST_OPERATORS = new Set(['in', 'not_in']);
const PICKED_OPERATORS = new Set(['in', 'not_in', 'equals', 'is_not']);
const operatorsFor = (type: ColumnFilterType = 'text', withValues = false): readonly string[] =>
  type !== 'text' ? COMPARE_OPERATORS : withValues ? PICK_TEXT_OPERATORS : TEXT_OPERATORS;
const defaultOperatorFor = (type: ColumnFilterType = 'text', pick = false) =>
  type === 'text' ? (pick ? 'in' : 'contains') : 'equals';
const OP_FALLBACK: Record<string, string> = {
  contains: 'contains',
  not_contains: 'does not contain',
  starts_with: 'starts with',
  ends_with: 'ends with',
  equals: 'equals',
  is_not: 'is not',
  is_empty: 'is empty',
  is_not_empty: 'is not empty',
  greater_than: 'greater than',
  greater_or_equal: 'at least',
  less_than: 'less than',
  less_or_equal: 'at most',
  between: 'between',
  in: 'is any of',
  not_in: 'is none of',
};
const DATE_OP_FALLBACK: Record<string, string> = {
  greater_than: 'after',
  greater_or_equal: 'on or after',
  less_than: 'before',
  less_or_equal: 'on or before',
};
export const NO_VALUE_OPERATORS = new Set(['is_empty', 'is_not_empty']);

// A row is ready once it has a column and either a value or a no-value operator.
export const isActiveColumnFilterRow = (r: ColumnFilterRow): boolean =>
  !!r.column && (NO_VALUE_OPERATORS.has(r.operator)
    || (LIST_OPERATORS.has(r.operator) ? (r.values?.length ?? 0) > 0 : !!r.value.trim()));

// The active rows as the API's columnFilters entries: a list for in / not_in, the trimmed text otherwise.
export const columnFilterItems = (rows: ColumnFilterRow[]): ColumnFilterItem[] =>
  rows.filter(isActiveColumnFilterRow).map((r) => ({
    column: r.column,
    operator: r.operator,
    value: LIST_OPERATORS.has(r.operator) ? r.values ?? [] : r.value.trim(),
  }));

// The columnFilters query parameter, or undefined when no row is active.
export const columnFiltersParam = (rows: ColumnFilterRow[]): string | undefined => {
  const items = columnFilterItems(rows);
  return items.length ? JSON.stringify(items) : undefined;
};

// Rows are persisted across visits, so a new id must be unique against the rows already there, not a per-mount counter.
const nextRowId = (rows: ColumnFilterRow[]): string => {
  const used = new Set(rows.map((r) => r.id));
  let n = rows.length + 1;
  while (used.has(`cf-${n}`)) n += 1;
  return `cf-${n}`;
};

// Gives every row after the first holder of an id a fresh one, repairing rows saved before ids were unique.
const withUniqueRowIds = (rows: ColumnFilterRow[]): ColumnFilterRow[] => {
  const seen = new Set<string>();
  return rows.reduce<ColumnFilterRow[]>((out, r) => {
    const id = seen.has(r.id) ? nextRowId([...rows, ...out]) : r.id;
    seen.add(id);
    return [...out, id === r.id ? r : { ...r, id }];
  }, []);
};

interface ColumnFiltersProps {
  columns: ColumnFilterOption[];
  value: ColumnFilterRow[];
  onChange: (rows: ColumnFilterRow[]) => void;
  labelPrefix?: string;
  // The table's /filter-values endpoint: text columns then pick their values from a list instead of typing them.
  valuesUrl?: string;
}

export function ColumnFilters({ columns, value, onChange, labelPrefix, valuesUrl }: ColumnFiltersProps) {
  const { t } = useTranslation();
  const hasDuplicateIds = new Set(value.map((r) => r.id)).size !== value.length;
  useEffect(() => {
    if (hasDuplicateIds) onChange(withUniqueRowIds(value));
  }, [hasDuplicateIds, value, onChange]);

  const typeOf = (column: string): ColumnFilterType => columns.find((c) => c.value === column)?.type ?? 'text';
  const pickOf = (column: string): boolean => !!valuesUrl && !!columns.find((c) => c.value === column)?.pick;
  const opsFor = (column: string) => operatorsFor(typeOf(column), !!valuesUrl);
  const opLabel = (op: string, type: ColumnFilterType = 'text') =>
    type === 'date' && DATE_OP_FALLBACK[op]
      ? t(`columnFilters.opDate.${op}`, { defaultValue: DATE_OP_FALLBACK[op] })
      : t(`columnFilters.op.${op}`, { defaultValue: OP_FALLBACK[op] ?? op });
  const columnLabel = (c: ColumnFilterOption) => (labelPrefix ? t(`${labelPrefix}.${c.value}`, { defaultValue: c.label }) : c.label);

  const addRow = () => {
    onChange([...value, { id: nextRowId(value), column: columns[0]?.value ?? '', operator: defaultOperatorFor(columns[0]?.type, pickOf(columns[0]?.value ?? '')), value: '', values: [] }]);
  };
  const updateRow = (id: string, patch: Partial<ColumnFilterRow>) =>
    onChange(value.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const removeRow = (id: string) => onChange(value.filter((r) => r.id !== id));
  // A different column type needs a different operator set and value format, so both reset.
  const changeColumn = (row: ColumnFilterRow, column: string) => {
    const type = typeOf(column);
    // Picked values belong to the old column, so they never carry over.
    if (type === typeOf(row.column) && opsFor(column).includes(row.operator) && !PICKED_OPERATORS.has(row.operator)) updateRow(row.id, { column });
    else updateRow(row.id, { column, operator: defaultOperatorFor(type, pickOf(column)), value: '', values: [] });
  };
  // Switching between one value and a list carries the picked values across.
  const changeOperator = (row: ColumnFilterRow, operator: string) => {
    const wasList = LIST_OPERATORS.has(row.operator);
    const isList = LIST_OPERATORS.has(operator);
    if (wasList && !isList) updateRow(row.id, { operator, value: row.values?.[0] ?? '', values: [] });
    else if (!wasList && isList) updateRow(row.id, { operator, values: row.value.trim() ? [row.value.trim()] : [], value: '' });
    else updateRow(row.id, { operator, value: operator === 'between' || row.operator === 'between' ? '' : row.value });
  };

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
                  <Select value={row.column} onValueChange={(v) => changeColumn(row, v)}>
                    <SelectTrigger className="h-8 w-44 text-xs shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map((c) => (
                        <SelectItem key={c.value} value={c.value} className="text-xs">{columnLabel(c)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={row.operator} onValueChange={(v) => changeOperator(row, v)}>
                    <SelectTrigger className="h-8 w-36 text-xs shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {opsFor(row.column).map((op) => (
                        <SelectItem key={op} value={op} className="text-xs">{opLabel(op, typeOf(row.column))}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!NO_VALUE_OPERATORS.has(row.operator) && valuesUrl && typeOf(row.column) === 'text' && PICKED_OPERATORS.has(row.operator) && (
                    <ColumnValuePicker
                      url={valuesUrl}
                      column={row.column}
                      valueLabel={columns.find((c) => c.value === row.column)?.valueLabel}
                      multiple={LIST_OPERATORS.has(row.operator)}
                      values={LIST_OPERATORS.has(row.operator) ? row.values ?? [] : row.value ? [row.value] : []}
                      onChange={(vals) => (LIST_OPERATORS.has(row.operator) ? updateRow(row.id, { values: vals }) : updateRow(row.id, { value: vals[0] ?? '' }))}
                    />
                  )}
                  {!NO_VALUE_OPERATORS.has(row.operator) && !(valuesUrl && typeOf(row.column) === 'text' && PICKED_OPERATORS.has(row.operator)) && (
                    <ValueInput
                      type={typeOf(row.column)}
                      between={row.operator === 'between'}
                      value={row.value}
                      onChange={(v) => updateRow(row.id, { value: v })}
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
          className="-mr-1 -mt-1 flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#A29374] transition-colors hover:bg-[#F4F0E8]"
        >
          <Plus className="h-3 w-3" />
          {t('columnFilters.add', { defaultValue: 'Add filter' })}
        </button>
      </div>
    </div>
  );
}

const INPUT_CLASS = 'h-8 text-xs shadow-none focus:border-[#A29374]/40 focus:ring-[#A29374]/20';

// The shared picker fed by the table's /filter-values endpoint, fetched only once the list is opened.
function ColumnValuePicker({ url, column, multiple, values, onChange, valueLabel }: {
  url: string; column: string; multiple: boolean; values: string[]; onChange: (v: string[]) => void;
  valueLabel?: (value: string, language: string) => string;
}) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const { data, isFetching } = useGetFilterValuesQuery({ url, column }, { skip: !open });
  return (
    <ValuePicker
      options={data?.data ?? []}
      loading={isFetching}
      multiple={multiple}
      values={values}
      onChange={onChange}
      onOpenChange={setOpen}
      labelFor={valueLabel ? (v) => valueLabel(v, i18n.language) : undefined}
    />
  );
}

// One value box, or two for "between" (sent as "min,max"); number and date columns get typed inputs.
function ValueInput({ type, between, value, onChange }: { type: ColumnFilterType; between: boolean; value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation();
  const inputType = type === 'number' ? 'number' : type === 'date' ? 'date' : 'text';
  if (!between) {
    return (
      <Input
        type={inputType}
        className={`${INPUT_CLASS} ${type === 'text' ? 'w-56' : 'w-40'}`}
        placeholder={t('columnFilters.valuePlaceholder', { defaultValue: 'Value…' })}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
    );
  }
  const [from = '', to = ''] = value.split(',');
  return (
    <span className="flex items-center gap-1.5">
      <Input type={inputType} className={`${INPUT_CLASS} w-36`} placeholder={t('columnFilters.from', { defaultValue: 'From' })}
        value={from} onChange={(e) => onChange(`${e.target.value},${to}`)} autoComplete="off" />
      <span className="text-xs text-slate-400">{t('columnFilters.and', { defaultValue: 'and' })}</span>
      <Input type={inputType} className={`${INPUT_CLASS} w-36`} placeholder={t('columnFilters.to', { defaultValue: 'To' })}
        value={to} onChange={(e) => onChange(`${from},${e.target.value}`)} autoComplete="off" />
    </span>
  );
}
