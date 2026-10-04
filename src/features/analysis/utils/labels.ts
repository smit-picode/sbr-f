import type { TFunction } from 'i18next';
import i18n from '@/i18n/config';
import type { AnalysisBlockType, AnalysisEntity, AnalysisMeasure } from '@/types';
import { QATAR_MUNICIPALITY_NAME_AR } from '@/features/home/data/qatarMunicipalities';
import {
  ANALYSIS_AGGS,
  ANALYSIS_BLOCK_CATEGORY_LABELS,
  ANALYSIS_BLOCK_TYPE_MAP,
  ANALYSIS_ENTITIES,
  ANALYSIS_FIELD_GROUP_LABELS,
  ANALYSIS_FIELDS,
  ANALYSIS_FRAME_DIMENSION,
  ANALYSIS_OTHER_KEY,
  ANALYSIS_SIZE_CLASS_LABELS,
  FLOW_CEASED,
  FLOW_NEW,
  FLOW_OUTSIDE,
  ANALYSIS_SIZE_CLASS_LABELS_AR,
  ISIC_SECTION_LABELS,
  ISIC_SECTION_LABELS_AR,
  type AnalysisBlockCategory,
  type AnalysisFieldGroup,
} from '../constants';
import { ISIC_DIVISION_LABELS, ISIC_DIVISION_LABELS_AR } from '../constants/isicDivisions';
import { ANALYSIS_FRAMES } from '../mock/frames';

const FRAME_LABELS_AR: Record<string, string> = {
  live: 'الإطار الحي',
  'f-2026-07': 'يوليو 2026',
  'f-2026-05': 'مايو 2026',
  'f-2026-04': 'أبريل 2026',
};

function isAr() {
  return i18n.language === 'ar';
}

export function fieldLabel(t: TFunction, id: string): string {
  if (id === ANALYSIS_FRAME_DIMENSION) return t('analysis.frame', { defaultValue: 'Frame' });
  return t(`analysis.fields.${id}`, { defaultValue: ANALYSIS_FIELDS[id]?.label ?? id });
}

export function fieldGroupLabel(t: TFunction, g: AnalysisFieldGroup): string {
  return t(`analysis.fieldGroups.${g}`, { defaultValue: ANALYSIS_FIELD_GROUP_LABELS[g] });
}

export function entityLabel(t: TFunction, e: AnalysisEntity): string {
  return t(`analysis.entities.${e}`, { defaultValue: ANALYSIS_ENTITIES[e].label });
}

export function blockTypeLabel(t: TFunction, type: AnalysisBlockType): string {
  return t(`analysis.blockTypes.${type}.label`, { defaultValue: ANALYSIS_BLOCK_TYPE_MAP[type].label });
}

export function blockTypeDescription(t: TFunction, type: AnalysisBlockType): string {
  return t(`analysis.blockTypes.${type}.description`, { defaultValue: ANALYSIS_BLOCK_TYPE_MAP[type].description });
}

export function blockCategoryLabel(t: TFunction, c: AnalysisBlockCategory): string {
  return t(`analysis.blockCategories.${c}`, { defaultValue: ANALYSIS_BLOCK_CATEGORY_LABELS[c] });
}

export function frameName(t: TFunction, frameId: string | null | undefined): string {
  const id = frameId ?? 'live';
  if (isAr()) return FRAME_LABELS_AR[id] ?? id;
  return ANALYSIS_FRAMES.find((f) => f.id === id)?.label ?? id;
}

// Human label for a dimension value; `short` drops long descriptions (chart axes).
export function valueLabel(t: TFunction, field: string, key: string | null, short = false): string {
  if (key == null) return t('analysis.notRecorded', { defaultValue: 'Not recorded' });
  if (key === ANALYSIS_OTHER_KEY) return t('analysis.other', { defaultValue: 'Other' });
  if (key === FLOW_NEW) return t('analysis.flow.new', { defaultValue: 'New units' });
  if (key === FLOW_CEASED) return t('analysis.flow.ceased', { defaultValue: 'Ceased' });
  if (key === FLOW_OUTSIDE) return t('analysis.flow.outside', { defaultValue: 'Outside filter' });
  if (field === ANALYSIS_FRAME_DIMENSION) return frameName(t, key);
  const ar = isAr();
  const type = ANALYSIS_FIELDS[field]?.type;
  if (type === 'boolean') return key === 'true' ? t('analysis.yes', { defaultValue: 'Yes' }) : t('analysis.no', { defaultValue: 'No' });
  if (field === 'isic_section') {
    const name = (ar ? ISIC_SECTION_LABELS_AR : ISIC_SECTION_LABELS)[key];
    return name ? (short ? `${key} · ${name.split(/[,&،]/)[0].trim()}` : `${key} · ${name}`) : key;
  }
  if (field === 'isic_division') {
    const name = (ar ? ISIC_DIVISION_LABELS_AR : ISIC_DIVISION_LABELS)[key];
    return name ? `${key} · ${name}` : key;
  }
  if (field === 'size_class') return (ar ? ANALYSIS_SIZE_CLASS_LABELS_AR : ANALYSIS_SIZE_CLASS_LABELS)[key] ?? key;
  if (field === 'municipality' && ar) return QATAR_MUNICIPALITY_NAME_AR[key] ?? key;
  if (field === 'zone' && ar) return key.replace('Zone', 'منطقة');
  return key;
}

export function recordValue(t: TFunction, field: string, v: unknown): string {
  if (v == null || v === '') return '—';
  const type = ANALYSIS_FIELDS[field]?.type;
  if (typeof v === 'boolean') return valueLabel(t, field, v ? 'true' : 'false');
  if (type === 'id') return String(v);
  if (typeof v === 'number') return v.toLocaleString();
  if (type === 'category') return valueLabel(t, field, String(v), true);
  return String(v);
}

export function aggLabel(t: TFunction, agg: AnalysisMeasure['agg']): string {
  const def = ANALYSIS_AGGS.find((a) => a.id === agg);
  return t(`analysis.aggs.${agg}`, { defaultValue: def?.label ?? agg });
}

export function measureLabel(t: TFunction, m: AnalysisMeasure, entity: AnalysisEntity): string {
  if (m.agg === 'count' || !m.field) {
    const unit = entityLabel(t, entity);
    return t('analysis.measure.count', { defaultValue: 'Number of {{unit}}', unit: unit.toLowerCase() });
  }
  const f = fieldLabel(t, m.field);
  switch (m.agg) {
    case 'sum': return t('analysis.measure.sum', { defaultValue: 'Total {{field}}', field: f.toLowerCase() });
    case 'avg': return t('analysis.measure.avg', { defaultValue: 'Average {{field}}', field: f.toLowerCase() });
    case 'median': return t('analysis.measure.median', { defaultValue: 'Median {{field}}', field: f.toLowerCase() });
    case 'min': return t('analysis.measure.min', { defaultValue: 'Minimum {{field}}', field: f.toLowerCase() });
    case 'max': return t('analysis.measure.max', { defaultValue: 'Maximum {{field}}', field: f.toLowerCase() });
    case 'count_distinct': return t('analysis.measure.distinct', { defaultValue: 'Distinct {{field}}', field: f.toLowerCase() });
    default: return f;
  }
}

export function formatValue(v: number | null | undefined, opts: { percent?: boolean; compact?: boolean } = {}): string {
  if (v == null || Number.isNaN(v)) return '—';
  if (opts.percent) return `${v.toFixed(v >= 10 || v === 0 ? 0 : 1)}%`;
  if (opts.compact && Math.abs(v) >= 10000) return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(v);
  return Math.abs(v) < 100 && !Number.isInteger(v) ? v.toLocaleString(undefined, { maximumFractionDigits: 1 }) : Math.round(v).toLocaleString();
}

export function formatDelta(curr: number | null, prev: number | null): { pct: number | null; abs: number | null } {
  if (curr == null || prev == null) return { pct: null, abs: null };
  return { abs: curr - prev, pct: prev === 0 ? null : ((curr - prev) / prev) * 100 };
}
