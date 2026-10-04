import type { Analysis, AnalysisBlock, AnalysisBlockType, AnalysisEntity, AnalysisMeasure, AnalysisQuery } from '@/types';
import { ANALYSIS_BLOCK_TYPE_MAP, ANALYSIS_DEFAULT_DISPLAY, ANALYSIS_ENTITIES, ANALYSIS_FIELDS } from '../constants';

let seq = 0;
export function uid(prefix: string): string {
  seq = (seq + 1) % 1000;
  return `${prefix}${Date.now().toString(36)}${seq.toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
}

const DEFAULT_DIM: Record<AnalysisEntity, string> = {
  establishments: 'isic_section',
  enterprises: 'isic_section',
  enterpriseGroups: 'group_type',
  contacts: 'role',
  addresses: 'municipality',
};

const DEFAULT_COMPLETENESS: Record<AnalysisEntity, string[]> = {
  establishments: ['isic_section', 'sector', 'employment', 'municipality', 'has_coordinates', 'has_phone', 'has_email'],
  enterprises: ['isic_section', 'sector', 'employment', 'turnover', 'municipality', 'parent_country'],
  enterpriseGroups: ['isic_section', 'employment', 'turnover', 'uci_country'],
  contacts: ['role', 'has_phone', 'has_mobile', 'has_email', 'has_website'],
  addresses: ['zone', 'has_street', 'has_building', 'has_coordinates'],
};

export function countMeasure(): AnalysisMeasure {
  return { id: uid('m'), agg: 'count', field: null };
}

export function hasField(entity: AnalysisEntity, field: string): boolean {
  return ANALYSIS_ENTITIES[entity].fields.includes(field);
}

// Maps join on municipality, which enterprise groups don't have.
export function supportsType(type: AnalysisBlockType, entity: AnalysisEntity): boolean {
  return type !== 'map' || hasField(entity, 'municipality');
}

export function firstNumericField(entity: AnalysisEntity): string | null {
  return ANALYSIS_ENTITIES[entity].fields.find((f) => ANALYSIS_FIELDS[f]?.type === 'number') ?? null;
}

function defaultDims(type: AnalysisBlockType, entity: AnalysisEntity): string[] {
  const d = DEFAULT_DIM[entity];
  switch (type) {
    case 'kpi': case 'records': case 'waterfall': case 'text': case 'line':
      return [];
    case 'map':
      return ['municipality'];
    case 'column':
      return [hasField(entity, 'size_class') ? 'size_class' : d];
    case 'donut':
      return [hasField(entity, 'source') ? 'source' : d];
    case 'treemap':
      return hasField(entity, 'isic_division') ? ['isic_section', 'isic_division'] : [d];
    case 'sunburst':
      return hasField(entity, 'size_class') ? ['isic_section', 'size_class'] : [d, 'status'];
    case 'pivot':
      return hasField(entity, 'size_class') ? ['municipality', 'size_class'].filter((f) => hasField(entity, f)) : [d];
    case 'heatmap':
      return [hasField(entity, 'isic_section') ? 'isic_section' : d, hasField(entity, 'municipality') ? 'municipality' : 'status'];
    case 'sankey':
      return [hasField(entity, 'size_class') ? 'size_class' : 'status'];
    case 'completeness':
      return [hasField(entity, 'source') ? 'source' : 'status'];
    default:
      return [d];
  }
}

export function defaultQuery(type: AnalysisBlockType, entity: AnalysisEntity): AnalysisQuery {
  const measures: AnalysisMeasure[] = [countMeasure()];
  if (type === 'kpi' && hasField(entity, 'employment')) measures.push({ id: uid('m'), agg: 'sum', field: 'employment' });
  return {
    entity,
    frame: null,
    compareTo: null,
    dimensions: defaultDims(type, entity),
    measures,
    filters: [],
    sort: type === 'column' || type === 'sankey' ? 'key_asc' : 'value_desc',
    limit: type === 'donut' ? 6 : type === 'bar' || type === 'delta' ? 12 : type === 'completeness' ? 8 : null,
    otherBucket: true,
    columns: type === 'completeness' ? DEFAULT_COMPLETENESS[entity] : type === 'records' ? ANALYSIS_ENTITIES[entity].defaultColumns : [],
  };
}

export function createBlock(type: AnalysisBlockType, entity: AnalysisEntity = 'establishments', patch: Partial<AnalysisBlock> = {}): AnalysisBlock {
  const def = ANALYSIS_BLOCK_TYPE_MAP[type];
  const wide = type === 'records' || type === 'heatmap' || type === 'completeness' || type === 'text' || type === 'sankey';
  return {
    id: uid('b'),
    type,
    title: type === 'text' ? '' : def.label,
    subtitle: '',
    width: wide ? 'full' : 'half',
    query: defaultQuery(type, entity),
    display: { ...ANALYSIS_DEFAULT_DISPLAY, stacked: type === 'column' },
    text: type === 'text' ? '## Key findings\n\n- ' : '',
    crossFilter: true,
    ...patch,
  };
}

// Switching a block's visual keeps its question and only adjusts what the new visual can't take.
export function convertBlock(block: AnalysisBlock, type: AnalysisBlockType): AnalysisBlock {
  if (!supportsType(type, block.query.entity)) return block;
  const def = ANALYSIS_BLOCK_TYPE_MAP[type];
  const q = block.query;
  let dims = q.dimensions.slice(0, def.maxDims);
  if (dims.length < def.minDims) {
    const fallback = defaultDims(type, q.entity);
    dims = [...dims, ...fallback.filter((f) => !dims.includes(f))].slice(0, Math.max(def.minDims, dims.length));
  }
  if (type === 'map') dims = ['municipality'];
  const columns = (type === 'records' || type === 'completeness') && !q.columns.length ? defaultQuery(type, q.entity).columns : q.columns;
  const oldDefault = ANALYSIS_BLOCK_TYPE_MAP[block.type].label;
  return {
    ...block,
    type,
    title: block.title === oldDefault ? def.label : block.title,
    query: { ...q, dimensions: dims, columns },
    display: { ...block.display, stacked: type === 'column' ? block.display.stacked : false },
  };
}

// Changing entity drops everything that entity doesn't have.
export function changeEntity(block: AnalysisBlock, entity: AnalysisEntity): AnalysisBlock {
  if (!supportsType(block.type, entity)) return changeEntity(convertBlock(block, 'bar'), entity);
  const fresh = defaultQuery(block.type, entity);
  const keep = (f: string) => hasField(entity, f);
  const dims = block.query.dimensions.filter(keep);
  return {
    ...block,
    query: {
      ...block.query,
      entity,
      dimensions: dims.length >= ANALYSIS_BLOCK_TYPE_MAP[block.type].minDims ? dims : fresh.dimensions,
      measures: block.query.measures.filter((m) => !m.field || keep(m.field)).length
        ? block.query.measures.filter((m) => !m.field || keep(m.field))
        : fresh.measures,
      filters: block.query.filters.filter((f) => keep(f.field)),
      columns: block.query.columns.filter(keep).length ? block.query.columns.filter(keep) : fresh.columns,
    },
  };
}

export function updateBlockIn(a: Analysis, id: string, patch: Partial<AnalysisBlock> | ((b: AnalysisBlock) => AnalysisBlock)): Analysis {
  return { ...a, blocks: a.blocks.map((b) => (b.id === id ? (typeof patch === 'function' ? patch(b) : { ...b, ...patch }) : b)) };
}

export function insertBlock(a: Analysis, block: AnalysisBlock, afterId?: string | null): Analysis {
  if (!afterId) return { ...a, blocks: [...a.blocks, block] };
  const i = a.blocks.findIndex((b) => b.id === afterId);
  const blocks = [...a.blocks];
  blocks.splice(i + 1, 0, block);
  return { ...a, blocks };
}

export function removeBlock(a: Analysis, id: string): Analysis {
  return { ...a, blocks: a.blocks.filter((b) => b.id !== id) };
}

export function moveBlock(a: Analysis, id: string, toIndex: number): Analysis {
  const from = a.blocks.findIndex((b) => b.id === id);
  if (from === -1 || toIndex === from) return a;
  const blocks = [...a.blocks];
  const [b] = blocks.splice(from, 1);
  blocks.splice(Math.max(0, Math.min(toIndex, blocks.length)), 0, b);
  return { ...a, blocks };
}

export function duplicateBlock(a: Analysis, id: string): Analysis {
  const src = a.blocks.find((b) => b.id === id);
  if (!src) return a;
  const copy: AnalysisBlock = JSON.parse(JSON.stringify(src));
  copy.id = uid('b');
  copy.query.measures = copy.query.measures.map((m) => ({ ...m, id: uid('m') }));
  return insertBlock(a, copy, id);
}
