'use client';

import { useTranslation } from 'react-i18next';
import { Plus, FolderPlus, X, Ban } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { SamplingCondition, SamplingField, SamplingGroup, FilterEditorContext } from '@/types';
import {
  SAMPLING_LIST_OPERATORS, SAMPLING_MAX_DEPTH, SAMPLING_NO_VALUE_OPERATORS, SAMPLING_PICK_OPERATORS,
  samplingDefaultOperator, samplingOperatorsFor,
} from '../constants';
import { newCondition, newGroup } from '../utils/filterTree';
import { fieldLabel, operatorLabel } from '../utils/labels';
import { ValuePicker } from './ValuePicker';

const INPUT_CLASS = 'h-8 text-xs shadow-none focus:border-[#A29374]/40 focus:ring-[#A29374]/20';

// Field select grouped by where the field comes from, filterable fields only.
export function FieldSelect({ fields, value, onChange, className = 'w-56', kinds }: {
  fields: SamplingField[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
  kinds?: SamplingField['KIND'][];
}) {
  const { t } = useTranslation();
  const usable = fields.filter((f) => !kinds || kinds.includes(f.KIND));
  const groups: { origin: SamplingField['ORIGIN']; label: string }[] = [
    { origin: 'frame', label: t('sampling.originFrame', { defaultValue: 'Classification & derived' }) },
    { origin: 'register', label: t('sampling.originRegister', { defaultValue: 'Register record' }) },
  ];
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`h-8 text-xs shadow-none ${className}`}>
        <SelectValue placeholder={t('sampling.pickField', { defaultValue: 'Pick a field…' })} />
      </SelectTrigger>
      <SelectContent className="max-h-80">
        {groups.map((g) => {
          const items = usable.filter((f) => f.ORIGIN === g.origin)
            .map((f) => ({ f, label: fieldLabel(t, f.FIELD_NAME, f.ORIGIN) }))
            .sort((a, b) => a.label.localeCompare(b.label));
          if (!items.length) return null;
          return (
            <SelectGroup key={g.origin}>
              <SelectLabel className="text-[11px] text-slate-400">{g.label}</SelectLabel>
              {items.map(({ f, label }) => (
                <SelectItem key={f.FIELD_NAME} value={f.FIELD_NAME} className="text-xs">{label}</SelectItem>
              ))}
            </SelectGroup>
          );
        })}
      </SelectContent>
    </Select>
  );
}

function ConditionEditor({ node, ctx }: { node: SamplingCondition; ctx: FilterEditorContext }) {
  const { t } = useTranslation();
  const kind = ctx.fields.find((f) => f.FIELD_NAME === node.column)?.KIND ?? 'text';
  const inputType = kind === 'number' ? 'number' : kind === 'date' ? 'date' : 'text';
  const set = (patch: Partial<SamplingCondition>) => ctx.onUpdate(node.id, (n) => ({ ...(n as SamplingCondition), ...patch }));

  const changeColumn = (column: string) => {
    const nextKind = ctx.fields.find((f) => f.FIELD_NAME === column)?.KIND ?? 'text';
    const keepOp = nextKind === kind && samplingOperatorsFor(nextKind).includes(node.operator);
    set({ column, operator: keepOp ? node.operator : samplingDefaultOperator(nextKind), value: '', values: [] });
  };
  const changeOperator = (operator: string) => {
    const wasList = SAMPLING_LIST_OPERATORS.includes(node.operator);
    const isList = SAMPLING_LIST_OPERATORS.includes(operator);
    // Moving between a single value and a list carries the picked values across.
    if (wasList && !isList) set({ operator, value: node.values[0] ?? '', values: [] });
    else if (!wasList && isList) set({ operator, values: node.value.trim() ? [node.value.trim()] : [], value: '' });
    else set({ operator, value: operator === 'between' || node.operator === 'between' ? '' : node.value });
  };

  let valueEditor: React.ReactNode = null;
  if (!SAMPLING_NO_VALUE_OPERATORS.includes(node.operator)) {
    if (SAMPLING_PICK_OPERATORS.includes(node.operator) && kind !== 'date') {
      const multiple = SAMPLING_LIST_OPERATORS.includes(node.operator);
      valueEditor = (
        <ValuePicker
          unit={ctx.unit}
          column={node.column}
          snapshotId={ctx.snapshotId}
          multiple={multiple}
          values={multiple ? node.values : node.value ? [node.value] : []}
          onChange={(vals) => (multiple ? set({ values: vals }) : set({ value: vals[0] ?? '' }))}
        />
      );
    } else if (node.operator === 'between') {
      const [lo = '', hi = ''] = node.value.split(',');
      valueEditor = (
        <span className="flex items-center gap-1.5">
          <Input type={inputType} className={`${INPUT_CLASS} w-32`} placeholder={t('sampling.from', { defaultValue: 'From' })} value={lo}
            onChange={(e) => set({ value: `${e.target.value},${hi}` })} />
          <span className="text-xs text-slate-400">{t('sampling.andLower', { defaultValue: 'and' })}</span>
          <Input type={inputType} className={`${INPUT_CLASS} w-32`} placeholder={t('sampling.to', { defaultValue: 'To' })} value={hi}
            onChange={(e) => set({ value: `${lo},${e.target.value}` })} />
        </span>
      );
    } else {
      valueEditor = (
        <Input type={inputType} className={`${INPUT_CLASS} ${kind === 'text' ? 'w-60' : 'w-40'}`}
          placeholder={t('sampling.value', { defaultValue: 'Value…' })} value={node.value} onChange={(e) => set({ value: e.target.value })} />
      );
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FieldSelect fields={ctx.fields} value={node.column} onChange={changeColumn} />
      <Select value={node.operator} onValueChange={changeOperator}>
        <SelectTrigger className="h-8 w-36 text-xs shadow-none"><SelectValue /></SelectTrigger>
        <SelectContent>
          {samplingOperatorsFor(kind).map((op) => (
            <SelectItem key={op} value={op} className="text-xs">{operatorLabel(t, op)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {valueEditor}
      <button type="button" onClick={() => ctx.onRemove(node.id)} aria-label={t('sampling.removeCondition', { defaultValue: 'Remove condition' })}
        className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function GroupEditor({ group, ctx, depth, isRoot }: { group: SamplingGroup; ctx: FilterEditorContext; depth: number; isRoot: boolean }) {
  const { t } = useTranslation();
  const first = ctx.fields[0];
  const addCondition = () => {
    const kind = first?.KIND ?? 'text';
    ctx.onAdd(group.id, newCondition(first?.FIELD_NAME ?? '', samplingDefaultOperator(kind)));
  };
  const setGroup = (patch: Partial<SamplingGroup>) => ctx.onUpdate(group.id, (n) => ({ ...(n as SamplingGroup), ...patch }));
  const joinWord = group.op === 'and' ? t('sampling.and', { defaultValue: 'AND' }) : t('sampling.or', { defaultValue: 'OR' });

  return (
    <div className={isRoot ? '' : `rounded-lg border p-3 ${group.not ? 'border-red-200 bg-red-50/40' : 'border-slate-200 bg-slate-50/60'}`}>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
        {group.not && <span className="font-semibold text-red-700">{t('sampling.noneOf', { defaultValue: 'Exclude units where' })}</span>}
        <span>{group.not ? '' : isRoot ? ctx.rootLabel : t('sampling.matchGroup', { defaultValue: 'Match' })}</span>
        <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5">
          {(['and', 'or'] as const).map((op) => (
            <button key={op} type="button" onClick={() => setGroup({ op })}
              className={`rounded px-2 py-0.5 text-[11px] font-semibold transition-colors ${group.op === op ? 'bg-[#A29374] text-white' : 'text-slate-500 hover:text-slate-800'}`}>
              {op === 'and' ? t('sampling.allOf', { defaultValue: 'ALL of' }) : t('sampling.anyOf', { defaultValue: 'ANY of' })}
            </button>
          ))}
        </div>
        <span>{t('sampling.theseConditions', { defaultValue: 'these conditions' })}</span>
        {!isRoot && (
          <span className="ms-auto flex items-center gap-1">
            <button type="button" onClick={() => setGroup({ not: !group.not })}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${group.not ? 'bg-red-100 text-red-700' : 'text-slate-500 hover:bg-slate-100'}`}>
              <Ban className="h-3 w-3" />
              {t('sampling.negate', { defaultValue: 'Exclude' })}
            </button>
            <button type="button" onClick={() => ctx.onRemove(group.id)} aria-label={t('sampling.removeGroup', { defaultValue: 'Remove group' })}
              className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        )}
      </div>

      <div className="space-y-2">
        {group.rules.map((rule, i) => (
          <div key={rule.id} className="flex gap-2">
            <span className="w-9 shrink-0 pt-2 text-end text-[10px] font-bold uppercase tracking-wide text-slate-400">{i === 0 ? '' : joinWord}</span>
            <div className="min-w-0 flex-1">
              {rule.kind === 'condition'
                ? <ConditionEditor node={rule} ctx={ctx} />
                : <GroupEditor group={rule} ctx={ctx} depth={depth + 1} isRoot={false} />}
            </div>
          </div>
        ))}
        {group.rules.length === 0 && (
          <p className="ps-11 text-xs text-slate-400">
            {isRoot ? ctx.emptyLabel : t('sampling.emptyGroup', { defaultValue: 'Empty group: ignored until it has a condition.' })}
          </p>
        )}
      </div>

      <div className="mt-2 flex items-center gap-1 ps-11">
        <button type="button" onClick={addCondition}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#87795D] transition-colors hover:bg-[#F4F0E8]">
          <Plus className="h-3 w-3" />
          {t('sampling.addCondition', { defaultValue: 'Condition' })}
        </button>
        {depth < SAMPLING_MAX_DEPTH && (
          <button type="button" onClick={() => ctx.onAdd(group.id, newGroup(group.op === 'and' ? 'or' : 'and'))}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#87795D] transition-colors hover:bg-[#F4F0E8]">
            <FolderPlus className="h-3 w-3" />
            {t('sampling.addGroup', { defaultValue: 'Group' })}
          </button>
        )}
      </div>
    </div>
  );
}

interface FilterGroupEditorProps extends FilterEditorContext {
  root: SamplingGroup;
}

// Nested AND / OR groups of conditions; a group can be turned into an exclusion.
export function FilterGroupEditor({ root, ...ctx }: FilterGroupEditorProps) {
  return <GroupEditor group={root} ctx={ctx} depth={1} isRoot />;
}
