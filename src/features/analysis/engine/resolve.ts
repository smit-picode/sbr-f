import type {
  Analysis,
  AnalysisBlock,
  AnalysisCrossFilter,
  AnalysisFilter,
  AnalysisRequest,
  AnalysisResolvedQuery,
} from '@/types';
import { ANALYSIS_BLOCK_TYPE_MAP, ANALYSIS_DRILL_PATHS, ANALYSIS_ENTITIES, ANALYSIS_FRAME_DIMENSION } from '../constants';
import { ANALYSIS_FRAME_CHRONO } from '../mock/frames';

export interface AnalysisDrillStep {
  field: string;
  value: string | null;
}

export function effectiveCompare(block: AnalysisBlock, analysis: Pick<Analysis, 'compareTo'>): string | null {
  if (block.query.compareTo === 'none') return null;
  return block.query.compareTo ?? analysis.compareTo ?? null;
}

export function resolveBlockQuery(
  block: AnalysisBlock,
  analysis: Pick<Analysis, 'frame' | 'compareTo' | 'filters'>,
  cross: AnalysisCrossFilter[] = [],
  drill: AnalysisDrillStep[] = []
): AnalysisResolvedQuery {
  const frame = block.query.frame ?? analysis.frame;
  let compareTo = effectiveCompare(block, analysis);
  // Comparison blocks are meaningless without a second frame: fall back to the oldest one.
  if (ANALYSIS_BLOCK_TYPE_MAP[block.type].needsCompare && (!compareTo || compareTo === frame)) {
    compareTo = ANALYSIS_FRAME_CHRONO.find((f) => f !== frame) ?? null;
  }

  const fields = new Set(ANALYSIS_ENTITIES[block.query.entity].fields);
  const crossFilters: AnalysisFilter[] = block.crossFilter
    ? cross
        .filter((c) => c.sourceBlockId !== block.id && fields.has(c.field))
        .map((c, i) => ({ id: `x${i}`, field: c.field, op: 'in', values: [c.value] }))
    : [];

  let dimensions = [...block.query.dimensions];
  const drillFilters: AnalysisFilter[] = [];
  drill.forEach((step, i) => {
    const child = ANALYSIS_DRILL_PATHS[step.field];
    if (!child) return;
    dimensions = dimensions.map((d) => (d === step.field ? child : d));
    drillFilters.push({ id: `d${i}`, field: step.field, op: 'in', values: [step.value] });
  });

  return {
    ...block.query,
    frame,
    compareTo,
    dimensions,
    filters: [...analysis.filters, ...block.query.filters, ...crossFilters, ...drillFilters],
  };
}

export function requestForBlock(block: AnalysisBlock, q: AnalysisResolvedQuery, page = 1, pageSize = 25, sortBy: string | null = null, sortDir: 'asc' | 'desc' = 'desc'): AnalysisRequest | null {
  switch (block.type) {
    case 'text':
      return null;
    case 'records':
      return { kind: 'records', query: q, page, pageSize, sortBy, sortDir };
    case 'completeness':
      return { kind: 'completeness', query: q };
    case 'waterfall':
    case 'sankey':
      return { kind: 'flow', query: q };
    case 'kpi':
      return { kind: 'aggregate', query: { ...q, dimensions: [] } };
    case 'treemap':
    case 'sunburst':
    case 'pivot':
    case 'heatmap':
      return { kind: 'aggregate', query: { ...q, seriesLimit: null } };
    case 'line':
      return { kind: 'aggregate', query: { ...q, compareTo: null, dimensions: [ANALYSIS_FRAME_DIMENSION, ...q.dimensions.filter((d) => d !== ANALYSIS_FRAME_DIMENSION)].slice(0, 2) } };
    default:
      return { kind: 'aggregate', query: q };
  }
}

// KPI sparklines: the same measures across every frame.
export function trendRequestFor(q: AnalysisResolvedQuery): AnalysisRequest {
  return { kind: 'aggregate', query: { ...q, compareTo: null, dimensions: [ANALYSIS_FRAME_DIMENSION], limit: null } };
}
