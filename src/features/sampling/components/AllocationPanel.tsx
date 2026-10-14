'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { TablePagination } from '@/components/table/TablePagination';
import { formatNumber } from '@/utils/format';
import type { SamplingAllocationSettings, SamplingField, SamplingStratum, SamplingStratumField } from '@/types';
import { SAMPLING_METHODS } from '../constants';
import type { Allocation, Precision } from '../utils/allocation';
import { fieldLabel, valueLabel } from '../utils/labels';

const INPUT_CLASS = 'h-8 text-xs shadow-none focus:border-[#A29374]/40 focus:ring-[#A29374]/20';
const TH = 'px-3 py-2 text-start text-xs font-medium uppercase tracking-wide text-slate-500 whitespace-nowrap';

const fmt = (v: number | null | undefined, digits = 1) => (v == null ? '—' : v.toLocaleString(undefined, { maximumFractionDigits: digits }));

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="text-lg font-bold tabular-nums text-slate-900">{value}</div>
      {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
    </div>
  );
}

interface AllocationPanelProps {
  settings: SamplingAllocationSettings;
  // The group's stratification fields, one table column each.
  strataFields: SamplingStratumField[];
  auxColumn: string | null;
  fields: SamplingField[];
  strata: SamplingStratum[];
  allocation: Allocation;
  precision: Precision;
  solvedSize: number | null;
  onChange: (patch: Partial<SamplingAllocationSettings>) => void;
}

// One random group's allocation: method, size or target precision, bounds, reserve, and per-stratum overrides.
export function AllocationPanel({ settings, strataFields, auxColumn, fields, strata, allocation, precision, solvedSize, onChange }: AllocationPanelProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const origin = (f: string) => fields.find((x) => x.FIELD_NAME === f)?.ORIGIN;
  const strataCols = strataFields.map((s) => fieldLabel(t, s.column, origin(s.column)));
  const auxName = auxColumn ? fieldLabel(t, auxColumn, origin(auxColumn)) : null;
  const overrideCount = Object.keys(settings.overrides).filter((k) => strata.some((s) => s.STRATUM_KEY === k)).length;

  const setOverride = (key: string, patch: { takeAll?: boolean; n?: number | null } | null) => {
    const next = { ...settings.overrides };
    if (patch === null) delete next[key];
    else {
      const merged = { ...next[key], ...patch };
      if (!merged.takeAll && merged.n == null) delete next[key];
      else next[key] = merged;
    }
    onChange({ overrides: next });
  };

  const warningText: Record<string, string> = {
    fixedExceedSize: t('sampling.warn.fixedExceedSize', { defaultValue: 'Take-all and hand-set strata alone exceed the sample size, so the other strata get only their minimum.' }),
    minimumsExceedSize: t('sampling.warn.minimumsExceedSize', { defaultValue: 'The minimum per stratum alone exceeds the sample size, so the sample is larger than asked.' }),
    noVariance: t('sampling.warn.noVariance', { defaultValue: 'The auxiliary field has no spread to allocate on, so Neyman fell back to proportional allocation.' }),
    sizeAboveFrame: t('sampling.warn.sizeAboveFrame', { defaultValue: 'The sample size is above the population: every unit is taken.' }),
  };
  // A new strata count can leave the page past the end; show the last page instead.
  const shownPage = Math.min(page, Math.max(1, Math.ceil(strata.length / limit)));
  const rows = strata.slice((shownPage - 1) * limit, shownPage * limit);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <div className="mb-1 text-xs font-medium text-slate-600">{t('sampling.method', { defaultValue: 'Allocation' })}</div>
          <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5">
            {SAMPLING_METHODS.map((m) => (
              <button key={m} type="button" onClick={() => onChange({ method: m })}
                className={`rounded px-3 py-1 text-xs font-semibold transition-colors ${settings.method === m ? 'bg-[#A29374] text-white' : 'text-slate-500 hover:text-slate-800'}`}>
                {t(`sampling.methods.${m}`, { defaultValue: m === 'neyman' ? 'Neyman' : m === 'proportional' ? 'Proportional' : 'Equal' })}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs font-medium text-slate-600">{t('sampling.sizeBy', { defaultValue: 'Size the sample by' })}</div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5">
              {(['size', 'cv'] as const).map((m) => (
                <button key={m} type="button" onClick={() => onChange({ sizeMode: m })}
                  className={`rounded px-3 py-1 text-xs font-semibold transition-colors ${settings.sizeMode === m ? 'bg-[#A29374] text-white' : 'text-slate-500 hover:text-slate-800'}`}>
                  {m === 'size' ? t('sampling.bySize', { defaultValue: 'Number of units' }) : t('sampling.byCv', { defaultValue: 'Target precision' })}
                </button>
              ))}
            </div>
            {settings.sizeMode === 'size' ? (
              <Input type="number" min={1} className={`${INPUT_CLASS} w-28`} value={settings.sampleSize}
                onChange={(e) => onChange({ sampleSize: Math.max(0, Math.floor(Number(e.target.value) || 0)) })} />
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-slate-600">
                {t('sampling.cvOf', { defaultValue: 'CV' })}
                <Input type="number" min={0.1} step={0.5} className={`${INPUT_CLASS} w-20`} value={settings.targetCv}
                  onChange={(e) => onChange({ targetCv: Math.max(0.1, Number(e.target.value) || 0.1) })} />
                %
              </span>
            )}
          </div>
        </div>
        <label className="text-xs text-slate-600">
          <div className="mb-1 font-medium">{t('sampling.minPerStratum', { defaultValue: 'Minimum per stratum' })}</div>
          <Input type="number" min={0} className={`${INPUT_CLASS} w-24`} value={settings.minPerStratum}
            onChange={(e) => onChange({ minPerStratum: Math.max(0, Math.floor(Number(e.target.value) || 0)) })} />
        </label>
        <label className="text-xs text-slate-600">
          <div className="mb-1 font-medium">{t('sampling.reservePct', { defaultValue: 'Reserve (%)' })}</div>
          <Input type="number" min={0} max={100} className={`${INPUT_CLASS} w-24`} value={settings.reservePct}
            onChange={(e) => onChange({ reservePct: Math.min(100, Math.max(0, Math.floor(Number(e.target.value) || 0))) })} />
        </label>
        {overrideCount > 0 && (
          <button type="button" onClick={() => onChange({ overrides: {} })}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#87795D] hover:bg-[#F4F0E8]">
            <RotateCcw className="h-3 w-3" />
            {t('sampling.clearOverrides', { defaultValue: 'Clear {{count}} stratum overrides', count: overrideCount })}
          </button>
        )}
      </div>

      {settings.method === 'neyman' && !auxColumn && (
        <p className="text-xs text-amber-700">{t('sampling.neymanNeedsAux', { defaultValue: 'Neyman allocation needs an auxiliary field (step 3); without one it is proportional.' })}</p>
      )}
      {settings.sizeMode === 'cv' && solvedSize == null && (
        <p className="text-xs text-amber-700">{t('sampling.cvUnreachable', { defaultValue: 'This precision cannot be reached (no auxiliary field, or a stratum left unsampled): showing a census.' })}</p>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label={t('sampling.population', { defaultValue: 'Population' })} value={formatNumber(allocation.population)} sub={t('sampling.strataCount', { defaultValue: '{{count}} strata', count: strata.length })} />
        <Kpi label={t('sampling.sampleSize', { defaultValue: 'Sample' })} value={formatNumber(allocation.total)}
          sub={allocation.total !== allocation.requested && settings.sizeMode === 'size' ? t('sampling.askedFor', { defaultValue: 'asked for {{n}}', n: formatNumber(allocation.requested) }) : undefined} />
        <Kpi label={t('sampling.reserve', { defaultValue: 'Reserve' })} value={formatNumber(allocation.reserveTotal)} />
        <Kpi label={t('sampling.fraction', { defaultValue: 'Sampling fraction' })}
          value={allocation.population ? `${((allocation.total / allocation.population) * 100).toFixed(2)}%` : '—'} />
        <Kpi label={t('sampling.expectedCv', { defaultValue: 'Expected CV' })}
          value={precision.cv == null ? '—' : `${(precision.cv * 100).toFixed(2)}%`}
          sub={auxName ? t('sampling.ofTotal', { defaultValue: 'of total {{field}}', field: auxName }) : t('sampling.noAuxShort', { defaultValue: 'no auxiliary field' })} />
        <Kpi label={t('sampling.uncovered', { defaultValue: 'Strata not sampled' })} value={formatNumber(precision.uncovered)} />
      </div>

      {allocation.warnings.map((w) => (
        <div key={w} className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {warningText[w]}
        </div>
      ))}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-white">
            <tr className="border-b border-slate-200">
              {(strataCols.length ? strataCols : [t('sampling.stratum', { defaultValue: 'Stratum' })]).map((c) => <th key={c} className={TH}>{c}</th>)}
              <th className={`${TH} text-end normal-case`}>N</th>
              <th className={`${TH} text-end`}>{t('sampling.mean', { defaultValue: 'Mean' })}</th>
              <th className={`${TH} text-end`}>{t('sampling.sd', { defaultValue: 'SD' })}</th>
              <th className={`${TH} text-end normal-case`}>n</th>
              <th className={TH}>{t('sampling.takeAll', { defaultValue: 'Take all' })}</th>
              <th className={`${TH} text-end`}>{t('sampling.reserve', { defaultValue: 'Reserve' })}</th>
              <th className={`${TH} text-end normal-case`}>{t('sampling.fractionShort', { defaultValue: 'n / N' })}</th>
              <th className={`${TH} text-end`}>{t('sampling.weight', { defaultValue: 'Weight' })}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const i = strata.indexOf(s);
              const a = allocation.strata[i];
              const o = settings.overrides[s.STRATUM_KEY];
              const values = [s.S1, s.S2, s.S3, s.S4].slice(0, Math.max(1, strataFields.length));
              return (
                <tr key={s.STRATUM_KEY} className={`border-b border-slate-100 transition-colors hover:bg-slate-50 ${a.n === 0 ? 'text-slate-400' : ''}`}>
                  {strataFields.length
                    ? values.map((v, j) => <td key={j} className="px-3 py-1.5 text-sm text-slate-700">{valueLabel(t, strataFields[j].column, v)}</td>)
                    : <td className="px-3 py-1.5 text-sm text-slate-700">{t('sampling.wholePopulation', { defaultValue: 'Whole population' })}</td>}
                  <td className="px-3 py-1.5 text-end tabular-nums">{formatNumber(s.N)}</td>
                  <td className="px-3 py-1.5 text-end tabular-nums text-slate-600">{fmt(s.AUX_MEAN)}</td>
                  <td className="px-3 py-1.5 text-end tabular-nums text-slate-600" title={s.AUX_SD == null && a.sdUsed != null ? t('sampling.pooledSd', { defaultValue: 'Too few values: the size-weighted average SD of the other strata is used' }) : undefined}>
                    {s.AUX_SD == null && a.sdUsed != null ? <span className="italic text-slate-400">{fmt(a.sdUsed)}*</span> : fmt(s.AUX_SD)}
                  </td>
                  <td className="px-3 py-1">
                    <div className="flex items-center justify-end gap-1.5">
                      {a.bound && !a.fixed && (
                        <span className="rounded bg-slate-100 px-1 text-[10px] font-semibold uppercase text-slate-500">
                          {a.bound === 'max' ? t('sampling.boundAll', { defaultValue: 'all' }) : t('sampling.boundMin', { defaultValue: 'min' })}
                        </span>
                      )}
                      <Input
                        type="number"
                        min={0}
                        disabled={!!o?.takeAll}
                        className={`${INPUT_CLASS} h-7 w-20 text-end tabular-nums ${o?.n != null ? 'border-[#A29374] font-semibold' : ''}`}
                        value={o?.n ?? a.n}
                        onChange={(e) => setOverride(s.STRATUM_KEY, { n: e.target.value === '' ? null : Math.max(0, Math.floor(Number(e.target.value))) })}
                        aria-label={t('sampling.setN', { defaultValue: 'Units to sample in this stratum' })}
                      />
                      {o?.n != null && (
                        <button type="button" onClick={() => setOverride(s.STRATUM_KEY, { n: null })} title={t('sampling.backToAuto', { defaultValue: 'Back to the allocation' })}
                          className="text-slate-400 hover:text-slate-600"><RotateCcw className="h-3 w-3" /></button>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-1.5">
                    <Checkbox checked={!!o?.takeAll} onCheckedChange={(c) => setOverride(s.STRATUM_KEY, { takeAll: c === true, n: null })}
                      aria-label={t('sampling.takeAll', { defaultValue: 'Take all' })} />
                  </td>
                  <td className="px-3 py-1.5 text-end tabular-nums text-slate-600">{a.reserve ? formatNumber(a.reserve) : '—'}</td>
                  <td className="px-3 py-1.5 text-end tabular-nums text-slate-600">{s.N ? `${((a.n / s.N) * 100).toFixed(1)}%` : '—'}</td>
                  <td className="px-3 py-1.5 text-end tabular-nums text-slate-700">{a.weight == null ? '—' : fmt(a.weight, 2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {strata.length > 10 && (
        <TablePagination page={shownPage} limit={limit} total={strata.length} onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1); }} />
      )}
    </div>
  );
}
