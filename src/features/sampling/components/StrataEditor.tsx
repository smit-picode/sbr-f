'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { SamplingField, SamplingStratumField } from '@/types';
import { SAMPLING_EMPLOYMENT_BANDS, SAMPLING_MAX_BREAKS, SAMPLING_MAX_STRATA_FIELDS } from '../constants';
import { FieldSelect } from './FilterGroupEditor';

const INPUT_CLASS = 'h-8 text-xs shadow-none focus:border-[#A29374]/40 focus:ring-[#A29374]/20';

// Band limits as typed (10, 50, 250): strictly increasing numbers; anything else is an error.
export function parseBreaks(text: string): { breaks: number[]; error: boolean } {
  const parts = text.split(/[,;\s]+/).map((p) => p.trim()).filter(Boolean);
  const breaks = parts.map(Number);
  const error = breaks.some((b) => !Number.isFinite(b)) || breaks.some((b, i) => i > 0 && b <= breaks[i - 1]) || breaks.length > SAMPLING_MAX_BREAKS;
  return { breaks: error ? [] : breaks, error };
}

function BandsInput({ value, onChange }: { value: number[] | undefined; onChange: (b: number[] | undefined) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState((value ?? []).join(', '));
  const parsed = parseBreaks(text);
  useEffect(() => { setText((value ?? []).join(', ')); }, [value]);
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-slate-500">{t('sampling.cutAt', { defaultValue: 'cut into bands at' })}</span>
      <Input
        className={`${INPUT_CLASS} w-44 ${parsed.error ? 'border-red-300' : ''}`}
        placeholder={t('sampling.bandsPlaceholder', { defaultValue: 'e.g. 10, 50, 250' })}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => { if (!parsed.error) onChange(parsed.breaks.length ? parsed.breaks : undefined); }}
      />
      <button type="button" onClick={() => onChange(SAMPLING_EMPLOYMENT_BANDS)}
        className="rounded-md px-2 py-1 text-[11px] font-medium text-[#87795D] hover:bg-[#F4F0E8]">
        {t('sampling.sizeClassBands', { defaultValue: 'Size classes (11, 51, 251)' })}
      </button>
      {parsed.error && <span className="text-[11px] text-red-600">{t('sampling.bandsError', { defaultValue: 'Numbers, each larger than the one before' })}</span>}
    </span>
  );
}

// A random group's stratification fields; number fields can be cut into bands.
export function StrataEditor({ fields, strata, onChange }: {
  fields: SamplingField[];
  strata: SamplingStratumField[];
  onChange: (s: SamplingStratumField[]) => void;
}) {
  const { t } = useTranslation();
  const kindOf = (c: string) => fields.find((f) => f.FIELD_NAME === c)?.KIND ?? 'text';
  const free = fields.filter((f) => !strata.some((s) => s.column === f.FIELD_NAME));

  const add = () => {
    const pick = free.find((f) => f.FIELD_NAME === 'SECTOR') ?? free.find((f) => f.KIND === 'text') ?? free[0];
    if (pick) onChange([...strata, { column: pick.FIELD_NAME }]);
  };
  const update = (i: number, patch: Partial<SamplingStratumField>) => onChange(strata.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  return (
    <div className="space-y-2">
      {strata.length === 0 && (
        <p className="text-xs text-slate-400">{t('sampling.noStrataHint', { defaultValue: 'No strata: one simple random sample from the whole group.' })}</p>
      )}
      {strata.map((s, i) => (
        <div key={`${s.column}-${i}`} className="flex flex-wrap items-center gap-2">
          <span className="w-6 text-end text-[11px] font-bold text-slate-400">{i + 1}.</span>
          <FieldSelect
            fields={fields.filter((f) => f.FIELD_NAME === s.column || !strata.some((x) => x.column === f.FIELD_NAME))}
            value={s.column}
            onChange={(column) => update(i, { column, breaks: kindOf(column) === 'number' && column === 'EMPLOYMENT' ? SAMPLING_EMPLOYMENT_BANDS : undefined })}
          />
          {kindOf(s.column) === 'number' && <BandsInput value={s.breaks} onChange={(breaks) => update(i, { breaks })} />}
          {kindOf(s.column) === 'number' && !s.breaks?.length && (
            <span className="text-[11px] text-amber-700">{t('sampling.everyValueStratum', { defaultValue: 'Every distinct value becomes a stratum' })}</span>
          )}
          <button type="button" onClick={() => onChange(strata.filter((_, j) => j !== i))}
            aria-label={t('sampling.removeStratum', { defaultValue: 'Remove stratification field' })}
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      {strata.length < SAMPLING_MAX_STRATA_FIELDS && (
        <button type="button" onClick={add}
          className="ms-8 flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#87795D] transition-colors hover:bg-[#F4F0E8]">
          <Plus className="h-3 w-3" />
          {t('sampling.addStratum', { defaultValue: 'Stratification field' })}
        </button>
      )}
    </div>
  );
}
