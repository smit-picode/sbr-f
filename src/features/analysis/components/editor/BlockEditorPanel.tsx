'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Analysis, AnalysisAgg, AnalysisBlock, AnalysisBlockType, AnalysisEntity, AnalysisMeasure, AnalysisQuery, AnalysisSort } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ANALYSIS_AGGS,
  ANALYSIS_BLOCK_CATEGORY_LABELS,
  ANALYSIS_BLOCK_TYPE_MAP,
  ANALYSIS_BLOCK_TYPES,
  ANALYSIS_ENTITIES,
  ANALYSIS_ENTITY_ORDER,
  ANALYSIS_FIELDS,
  ANALYSIS_LIMIT_OPTIONS,
  ANALYSIS_MAX_MEASURES,
  ANALYSIS_PERCENT_OPTIONS,
  ANALYSIS_SORT_OPTIONS,
  type AnalysisBlockCategory,
} from '../../constants';
import { ANALYSIS_FRAMES } from '../../mock/frames';
import { changeEntity, convertBlock, firstNumericField, supportsType, uid } from '../../utils/blocks';
import { aggLabel, blockCategoryLabel, blockTypeLabel, entityLabel, fieldLabel, frameName } from '../../utils/labels';
import { AnalysisIcon } from '../AnalysisIcon';
import { SidePanel } from '../SidePanel';
import { FieldPicker } from './FieldPicker';
import { FilterChips } from './FilterChips';

const INHERIT = '__inherit__';

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="px-5 py-4 border-b border-slate-100 last:border-0">
      <div className="mb-2.5">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</h4>
        {hint && <p className="text-[11.5px] text-slate-400 mt-0.5">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="w-full flex items-start gap-3 py-1.5 text-start">
      <span className={cn('mt-0.5 relative h-5 w-9 shrink-0 rounded-full transition-colors', checked ? 'bg-adaam' : 'bg-slate-200')}>
        <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', checked ? 'start-[18px]' : 'start-0.5')} />
      </span>
      <span>
        <span className="block text-[12.5px] font-medium text-slate-700">{label}</span>
        {hint && <span className="block text-[11px] text-slate-400">{hint}</span>}
      </span>
    </button>
  );
}

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="inline-flex flex-wrap items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)} className={cn('h-7 rounded-full px-3 text-[11.5px] font-semibold transition-colors', value === o.value ? 'bg-dune text-white shadow-soft' : 'text-slate-500 hover:text-slate-800')}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function dimLabels(t: ReturnType<typeof useTranslation>['t'], type: AnalysisBlockType): string[] {
  switch (type) {
    case 'pivot': case 'heatmap': return [t('analysis.editor.rows', { defaultValue: 'Rows' }), t('analysis.editor.columns', { defaultValue: 'Columns' })];
    case 'treemap': case 'sunburst': return [t('analysis.editor.level1', { defaultValue: 'Outer level' }), t('analysis.editor.level2', { defaultValue: 'Inner level' })];
    case 'line': return [t('analysis.editor.splitBy', { defaultValue: 'Split lines by' })];
    case 'completeness': return [t('analysis.editor.compareAcross', { defaultValue: 'Compare across' })];
    case 'sankey': return [t('analysis.editor.flowsOf', { defaultValue: 'Track movements of' })];
    default: return [t('analysis.editor.categories', { defaultValue: 'Categories' }), t('analysis.editor.series', { defaultValue: 'Split into series' })];
  }
}

// Keeps a saved limit that isn't a preset (e.g. 12) selectable, so the picker never shows blank.
function limitOptions(current: number | null): (number | null)[] {
  const opts = ANALYSIS_LIMIT_OPTIONS.includes(current) ? ANALYSIS_LIMIT_OPTIONS : [...ANALYSIS_LIMIT_OPTIONS, current];
  return [...opts].sort((a, b) => (a == null ? 1 : b == null ? -1 : a - b));
}

// How many measures a visual can actually show.
function measureCap(type: AnalysisBlockType): number {
  if (type === 'kpi' || type === 'pivot') return ANALYSIS_MAX_MEASURES;
  if (type === 'bar' || type === 'column' || type === 'line') return 3;
  return 1;
}

interface Props {
  block: AnalysisBlock | null;
  analysis: Analysis;
  onChange: (b: AnalysisBlock) => void;
  onClose: () => void;
}

export function BlockEditorPanel({ block, analysis, onChange, onClose }: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'data' | 'visual'>('data');
  if (!block) return null;

  const def = ANALYSIS_BLOCK_TYPE_MAP[block.type];
  const q = block.query;
  const entity = ANALYSIS_ENTITIES[q.entity];
  const setQuery = (patch: Partial<AnalysisQuery>) => onChange({ ...block, query: { ...q, ...patch } });
  const setDisplay = (patch: Partial<AnalysisBlock['display']>) => onChange({ ...block, display: { ...block.display, ...patch } });
  const isText = block.type === 'text';
  const showDims = def.maxDims > 0;
  const showMeasures = !['records', 'completeness', 'waterfall', 'sankey', 'text'].includes(block.type);
  const cap = measureCap(block.type);
  const categories = [...new Set(ANALYSIS_BLOCK_TYPES.map((b) => b.category))] as AnalysisBlockCategory[];
  const labels = dimLabels(t, block.type);
  const groupable = entity.fields.filter((f) => f !== entity.idField);

  const setMeasure = (i: number, m: Partial<AnalysisMeasure>) => setQuery({ measures: q.measures.map((x, j) => (j === i ? { ...x, ...m } : x)) });
  const numericFields = entity.fields.filter((f) => f !== entity.idField);

  return (
    <SidePanel
      open
      onClose={onClose}
      title={
        <input
          value={isText ? blockTypeLabel(t, 'text') : block.title}
          readOnly={isText}
          onChange={(e) => onChange({ ...block, title: e.target.value })}
          placeholder={t('analysis.editor.titlePlaceholder', { defaultValue: 'Block title' })}
          className="w-full bg-transparent outline-none text-[15px] font-bold text-slate-900 placeholder:text-slate-300"
        />
      }
      subtitle={!isText && (
        <input
          value={block.subtitle}
          onChange={(e) => onChange({ ...block, subtitle: e.target.value })}
          placeholder={t('analysis.editor.subtitlePlaceholder', { defaultValue: 'Add a subtitle (optional)' })}
          className="w-full bg-transparent outline-none text-[11.5px] text-slate-500 placeholder:text-slate-300"
        />
      )}
      footer={
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400">{t('analysis.editor.liveHint', { defaultValue: 'Changes apply instantly · Ctrl+Z to undo' })}</span>
          <Button size="sm" onClick={onClose}>{t('analysis.editor.done', { defaultValue: 'Done' })}</Button>
        </div>
      }
    >
      {!isText && (
        <div className="px-5 pt-3">
          <Segmented value={tab} onChange={setTab} options={[{ value: 'data', label: t('analysis.editor.tabData', { defaultValue: 'Data' }) }, { value: 'visual', label: t('analysis.editor.tabVisual', { defaultValue: 'Visual' }) }]} />
        </div>
      )}

      {isText && (
        <Section title={t('analysis.editor.content', { defaultValue: 'Content' })} hint={t('analysis.editor.markdownHint', { defaultValue: '# heading · ## subheading · **bold** · *italic* · - bullet' })}>
          <textarea
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            rows={14}
            className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-3 text-[13px] leading-relaxed text-slate-800 shadow-input outline-none focus:border-[#A29374]/40 focus:ring-2 focus:ring-[#A29374]/20 font-mono"
          />
        </Section>
      )}

      {!isText && tab === 'data' && (
        <>
          <Section title={t('analysis.editor.unit', { defaultValue: 'Unit of analysis' })}>
            <div className="grid grid-cols-3 gap-1.5">
              {ANALYSIS_ENTITY_ORDER.map((e: AnalysisEntity) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => e !== q.entity && onChange(changeEntity(block, e))}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-[11.5px] font-semibold transition-colors',
                    q.entity === e ? 'border-adaam bg-adaam-tint text-adaam-deep' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  <AnalysisIcon name={ANALYSIS_ENTITIES[e].icon} className="h-4 w-4" />
                  <span className="truncate max-w-full">{entityLabel(t, e)}</span>
                </button>
              ))}
            </div>
            {(q.entity === 'contacts' || q.entity === 'addresses') && (
              <p className="mt-2 text-[11px] text-slate-400">{t('analysis.editor.joinHint', { defaultValue: 'Establishment fields are available through the link to each unit.' })}</p>
            )}
          </Section>

          {showDims && (
            <Section title={t('analysis.editor.groupBy', { defaultValue: 'Group by' })}>
              <div className="space-y-2">
                {Array.from({ length: Math.min(def.maxDims, Math.max(def.minDims, q.dimensions.length)) }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-[92px] shrink-0 text-[11.5px] text-slate-500">{labels[i] ?? labels[0]}</span>
                    <FieldPicker
                      fields={groupable}
                      types={['category', 'boolean']}
                      exclude={q.dimensions.filter((_, j) => j !== i)}
                      value={q.dimensions[i] ?? null}
                      onChange={(f) => {
                        const dims = [...q.dimensions];
                        dims[i] = f;
                        setQuery({ dimensions: block.type === 'map' ? ['municipality'] : dims });
                      }}
                    />
                    {i >= def.minDims && (
                      <button type="button" onClick={() => setQuery({ dimensions: q.dimensions.filter((_, j) => j !== i) })} className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100" aria-label={t('analysis.editor.remove', { defaultValue: 'Remove' })}>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {q.dimensions.length < def.maxDims && q.dimensions.length >= def.minDims && (
                  <button type="button" onClick={() => setQuery({ dimensions: [...q.dimensions, groupable.find((f) => !q.dimensions.includes(f) && ['status', 'size_class', 'source', 'sector'].includes(f)) ?? groupable[0]] })} className="inline-flex items-center gap-1 text-[12px] font-semibold text-adaam-deep hover:underline">
                    <Plus className="h-3.5 w-3.5" />
                    {labels[q.dimensions.length] ?? labels[0]}
                  </button>
                )}
                {block.type === 'map' && <p className="text-[11px] text-slate-400">{t('analysis.editor.mapHint', { defaultValue: 'Maps always group by municipality.' })}</p>}
              </div>
            </Section>
          )}

          {showMeasures && (
            <Section title={t('analysis.editor.measures', { defaultValue: 'Measures' })} hint={cap === 1 ? t('analysis.editor.oneMeasure', { defaultValue: 'This visual shows one measure.' }) : undefined}>
              <div className="space-y-2">
                {q.measures.slice(0, cap).map((m, i) => (
                  <div key={m.id} className="flex items-center gap-2">
                    <Select
                      value={m.agg}
                      onValueChange={(v) => {
                        const agg = v as AnalysisAgg;
                        const numeric = ANALYSIS_AGGS.find((a) => a.id === agg)?.numeric;
                        const keep = m.field && (!numeric || ANALYSIS_FIELDS[m.field]?.type === 'number');
                        setMeasure(i, { agg, field: agg === 'count' ? null : keep ? m.field : numeric ? firstNumericField(q.entity) : entity.idField });
                      }}
                    >
                      <SelectTrigger className="h-9 w-[132px] shrink-0 text-[12.5px] shadow-none"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ANALYSIS_AGGS.map((a) => <SelectItem key={a.id} value={a.id} className="text-[12.5px]">{aggLabel(t, a.id)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {m.agg !== 'count' ? (
                      <FieldPicker
                        fields={numericFields}
                        types={m.agg === 'count_distinct' ? ['category', 'id', 'boolean', 'text'] : ['number']}
                        value={m.field}
                        onChange={(f) => setMeasure(i, { field: f })}
                      />
                    ) : (
                      <span className="flex-1 text-[12px] text-slate-500 truncate">{entityLabel(t, q.entity)}</span>
                    )}
                    {q.measures.length > 1 && (
                      <button type="button" onClick={() => setQuery({ measures: q.measures.filter((_, j) => j !== i) })} className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100" aria-label={t('analysis.editor.remove', { defaultValue: 'Remove' })}>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {q.measures.length < cap && (
                  <button type="button" onClick={() => setQuery({ measures: [...q.measures, { id: uid('m'), agg: entity.fields.includes('employment') ? 'sum' : 'count', field: entity.fields.includes('employment') ? 'employment' : null }] })} className="inline-flex items-center gap-1 text-[12px] font-semibold text-adaam-deep hover:underline">
                    <Plus className="h-3.5 w-3.5" />
                    {t('analysis.editor.addMeasure', { defaultValue: 'Add measure' })}
                  </button>
                )}
              </div>
            </Section>
          )}

          {(block.type === 'records' || block.type === 'completeness') && (
            <Section title={block.type === 'records' ? t('analysis.editor.columnsToShow', { defaultValue: 'Columns' }) : t('analysis.editor.fieldsToCheck', { defaultValue: 'Fields to check' })}>
              <div className="flex flex-wrap gap-1.5">
                {q.columns.map((c, i) => (
                  <span key={c} className="inline-flex items-center gap-1 h-7 rounded-full bg-slate-100 ps-2.5 pe-1 text-[12px] text-slate-700">
                    {fieldLabel(t, c)}
                    {i > 0 && block.type === 'records' && (
                      <button type="button" onClick={() => { const cols = [...q.columns]; [cols[i - 1], cols[i]] = [cols[i], cols[i - 1]]; setQuery({ columns: cols }); }} className="h-5 w-5 rounded-full text-slate-400 hover:bg-white text-[11px]" aria-label={t('analysis.block.moveUp', { defaultValue: 'Move up' })}>‹</button>
                    )}
                    <button type="button" onClick={() => setQuery({ columns: q.columns.filter((x) => x !== c) })} className="h-5 w-5 rounded-full flex items-center justify-center text-slate-400 hover:bg-white" aria-label={t('analysis.editor.remove', { defaultValue: 'Remove' })}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <FieldPicker
                  fields={entity.fields}
                  exclude={q.columns}
                  value={null}
                  onChange={(f) => setQuery({ columns: [...q.columns, f] })}
                  trigger={<button type="button" className="inline-flex items-center gap-1 h-7 rounded-full border border-dashed border-slate-300 px-2.5 text-[12px] text-slate-500 hover:border-adaam/50 hover:text-adaam-deep"><Plus className="h-3 w-3" />{t('analysis.editor.addColumn', { defaultValue: 'Add' })}</button>}
                />
              </div>
            </Section>
          )}

          <Section title={t('analysis.editor.filters', { defaultValue: 'Filters' })} hint={analysis.filters.length ? t('analysis.editor.reportFiltersApply', { defaultValue: 'Report filters also apply.' }) : undefined}>
            <FilterChips filters={q.filters} onChange={(filters) => setQuery({ filters })} entity={q.entity} />
          </Section>

          <Section title={t('analysis.editor.frames', { defaultValue: 'Frames' })}>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="text-[11px] text-slate-500">{t('analysis.editor.dataFrom', { defaultValue: 'Data from' })}</span>
                <Select value={q.frame ?? INHERIT} onValueChange={(v) => setQuery({ frame: v === INHERIT ? null : v })}>
                  <SelectTrigger className="h-9 text-[12.5px] shadow-none"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={INHERIT} className="text-[12.5px]">{t('analysis.editor.reportFrame', { defaultValue: 'Report frame ({{frame}})', frame: frameName(t, analysis.frame) })}</SelectItem>
                    {ANALYSIS_FRAMES.map((f) => <SelectItem key={f.id} value={f.id} className="text-[12.5px]">{frameName(t, f.id)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </label>
              <label className="space-y-1">
                <span className="text-[11px] text-slate-500">{t('analysis.editor.compareWith', { defaultValue: 'Compare with' })}</span>
                <Select value={q.compareTo ?? INHERIT} onValueChange={(v) => setQuery({ compareTo: v === INHERIT ? null : v })}>
                  <SelectTrigger className="h-9 text-[12.5px] shadow-none"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={INHERIT} className="text-[12.5px]">
                      {analysis.compareTo ? t('analysis.editor.reportCompare', { defaultValue: 'Report setting ({{frame}})', frame: frameName(t, analysis.compareTo) }) : t('analysis.editor.reportNoCompare', { defaultValue: 'Report setting (none)' })}
                    </SelectItem>
                    {!def.needsCompare && <SelectItem value="none" className="text-[12.5px]">{t('analysis.editor.noCompare', { defaultValue: 'No comparison' })}</SelectItem>}
                    {ANALYSIS_FRAMES.map((f) => <SelectItem key={f.id} value={f.id} className="text-[12.5px]">{frameName(t, f.id)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </label>
            </div>
          </Section>

          {showDims && block.type !== 'map' && block.type !== 'line' && (
            <Section title={t('analysis.editor.ranking', { defaultValue: 'Ranking' })}>
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="text-[11px] text-slate-500">{t('analysis.editor.sort', { defaultValue: 'Sort' })}</span>
                  <Select value={q.sort} onValueChange={(v) => setQuery({ sort: v as AnalysisSort })}>
                    <SelectTrigger className="h-9 text-[12.5px] shadow-none"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ANALYSIS_SORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value} className="text-[12.5px]">{t(`analysis.sort.${o.value}`, { defaultValue: o.label })}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] text-slate-500">{t('analysis.editor.show', { defaultValue: 'Show' })}</span>
                  <Select value={String(q.limit ?? 'all')} onValueChange={(v) => setQuery({ limit: v === 'all' ? null : Number(v) })}>
                    <SelectTrigger className="h-9 text-[12.5px] shadow-none"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {limitOptions(q.limit).map((n) => (
                        <SelectItem key={String(n)} value={String(n ?? 'all')} className="text-[12.5px]">
                          {n == null ? t('analysis.editor.all', { defaultValue: 'All categories' }) : t('analysis.editor.topN', { defaultValue: 'Top {{n}}', n })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              </div>
              {q.limit != null && (
                <Toggle checked={q.otherBucket} onChange={(v) => setQuery({ otherBucket: v })} label={t('analysis.editor.otherBucket', { defaultValue: 'Group the rest as “Other”' })} />
              )}
            </Section>
          )}
        </>
      )}

      {!isText && tab === 'visual' && (
        <>
          <Section title={t('analysis.editor.visual', { defaultValue: 'Visual' })} hint={t('analysis.editor.visualHint', { defaultValue: 'Switching keeps your data selection.' })}>
            <div className="space-y-3">
              {categories.map((c) => (
                <div key={c}>
                  <div className="text-[10.5px] font-semibold text-slate-400 mb-1.5">{blockCategoryLabel(t, c) || ANALYSIS_BLOCK_CATEGORY_LABELS[c]}</div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {ANALYSIS_BLOCK_TYPES.filter((b) => b.category === c).map((b) => (
                      <button
                        key={b.type}
                        type="button"
                        onClick={() => b.type !== block.type && onChange(convertBlock(block, b.type))}
                        disabled={!supportsType(b.type, q.entity)}
                        title={b.description}
                        className={cn(
                          'flex flex-col items-center gap-1 rounded-xl border px-1.5 py-2 text-[11px] font-semibold transition-colors disabled:opacity-40 disabled:pointer-events-none',
                          block.type === b.type ? 'border-adaam bg-adaam-tint text-adaam-deep' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        )}
                      >
                        <AnalysisIcon name={b.icon} className="h-4 w-4" />
                        <span className="truncate max-w-full">{blockTypeLabel(t, b.type)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title={t('analysis.editor.layout', { defaultValue: 'Layout' })}>
            <Segmented
              value={block.width}
              onChange={(width) => onChange({ ...block, width })}
              options={[{ value: 'half', label: t('analysis.block.halfWidth', { defaultValue: 'Half width' }) }, { value: 'full', label: t('analysis.block.fullWidth', { defaultValue: 'Full width' }) }]}
            />
          </Section>

          <Section title={t('analysis.editor.options', { defaultValue: 'Options' })}>
            {['bar', 'column', 'pivot', 'heatmap', 'delta'].includes(block.type) && (
              <div className="mb-2">
                <span className="block text-[11px] text-slate-500 mb-1">{t('analysis.editor.valuesAs', { defaultValue: 'Show values as' })}</span>
                <Segmented
                  value={block.display.percent}
                  onChange={(percent) => setDisplay({ percent })}
                  options={ANALYSIS_PERCENT_OPTIONS
                    .filter((o) => block.type === 'delta' ? o.value === 'none' || o.value === 'total' : (q.dimensions.length > 1 || o.value === 'none' || o.value === 'total'))
                    .map((o) => ({ value: o.value, label: block.type === 'delta' && o.value === 'total' ? t('analysis.editor.pctChange', { defaultValue: '% change' }) : t(`analysis.percent.${o.value}`, { defaultValue: o.label }) }))}
                />
              </div>
            )}
            {['bar', 'column', 'line'].includes(block.type) && <Toggle checked={block.display.showValues} onChange={(v) => setDisplay({ showValues: v })} label={t('analysis.editor.showValues', { defaultValue: 'Show value labels' })} />}
            {(block.type === 'column' || block.type === 'bar') && q.dimensions.length > 1 && <Toggle checked={block.display.stacked} onChange={(v) => setDisplay({ stacked: v })} label={t('analysis.editor.stacked', { defaultValue: 'Stack series' })} />}
            {(block.type === 'pivot' || block.type === 'heatmap') && <Toggle checked={block.display.showTotals} onChange={(v) => setDisplay({ showTotals: v })} label={t('analysis.editor.totals', { defaultValue: 'Show totals' })} />}
            {block.type === 'kpi' && <Toggle checked={block.display.sparkline} onChange={(v) => setDisplay({ sparkline: v })} label={t('analysis.editor.sparkline', { defaultValue: 'Trend across frames' })} hint={t('analysis.editor.sparklineHint', { defaultValue: 'A sparkline of each measure over every frozen frame' })} />}
            <Toggle
              checked={block.crossFilter}
              onChange={(v) => onChange({ ...block, crossFilter: v })}
              label={t('analysis.editor.crossFilter', { defaultValue: 'Respond to report clicks' })}
              hint={t('analysis.editor.crossFilterHint', { defaultValue: 'Clicking data in other blocks filters this one, and its own data can filter the report.' })}
            />
          </Section>
        </>
      )}
    </SidePanel>
  );
}

