export type AnalysisEntity = 'establishments' | 'enterprises' | 'enterpriseGroups' | 'contacts' | 'addresses';

export type AnalysisFieldType = 'category' | 'number' | 'boolean' | 'text' | 'id';

export type AnalysisAgg = 'count' | 'count_distinct' | 'sum' | 'avg' | 'median' | 'min' | 'max';

export type AnalysisFilterOp = 'in' | 'not_in' | 'between' | 'contains' | 'empty' | 'not_empty';

export interface AnalysisFilter {
  id: string;
  field: string;
  op: AnalysisFilterOp;
  values?: (string | null)[];
  min?: number | null;
  max?: number | null;
  text?: string;
}

export interface AnalysisMeasure {
  id: string;
  agg: AnalysisAgg;
  field: string | null;
}

export type AnalysisSort = 'value_desc' | 'value_asc' | 'key_asc' | 'key_desc';

export interface AnalysisQuery {
  entity: AnalysisEntity;
  frame: string | null;
  compareTo: string | null;
  dimensions: string[];
  measures: AnalysisMeasure[];
  filters: AnalysisFilter[];
  sort: AnalysisSort;
  limit: number | null;
  otherBucket: boolean;
  columns: string[];
  seriesLimit?: number | null;
}

export type AnalysisBlockType =
  | 'kpi'
  | 'bar'
  | 'column'
  | 'line'
  | 'donut'
  | 'treemap'
  | 'sunburst'
  | 'map'
  | 'pivot'
  | 'heatmap'
  | 'records'
  | 'waterfall'
  | 'sankey'
  | 'delta'
  | 'completeness'
  | 'text';

export type AnalysisPercentMode = 'none' | 'total' | 'row' | 'column';

export interface AnalysisBlockDisplay {
  showValues: boolean;
  stacked: boolean;
  percent: AnalysisPercentMode;
  showTotals: boolean;
  sparkline: boolean;
}

export interface AnalysisBlock {
  id: string;
  type: AnalysisBlockType;
  title: string;
  subtitle: string;
  width: 'half' | 'full';
  query: AnalysisQuery;
  display: AnalysisBlockDisplay;
  text: string;
  crossFilter: boolean;
}

export interface AnalysisShare {
  kind: 'user' | 'role';
  id: string;
  label: string;
  access: 'view' | 'edit';
}

export interface Analysis {
  id: string;
  name: string;
  description: string;
  ownerEmail: string;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
  frame: string;
  compareTo: string | null;
  filters: AnalysisFilter[];
  blocks: AnalysisBlock[];
  shares: AnalysisShare[];
}

export interface AnalysisFrame {
  id: string;
  label: string;
  asOf: string;
  kind: 'live' | 'frozen';
}

// A report-wide filter created by clicking a data point; it lives only in the page session.
export interface AnalysisCrossFilter {
  field: string;
  value: string | null;
  sourceBlockId: string;
}

export type AnalysisDisclosureFlag = 'min' | 'dominance' | 'secondary';

export interface AnalysisResultRow {
  keys: (string | null)[];
  values: (number | null)[];
  n: number;
  prev?: (number | null)[];
  prevN?: number;
  flag?: AnalysisDisclosureFlag;
}

export interface AnalysisAggregateResult {
  kind: 'aggregate';
  dimensions: string[];
  measures: AnalysisMeasure[];
  rows: AnalysisResultRow[];
  total: { values: (number | null)[]; n: number; prev?: (number | null)[]; prevN?: number };
  frame: string;
  compareTo: string | null;
}

export interface AnalysisRecordsResult {
  kind: 'records';
  columns: string[];
  rows: Record<string, unknown>[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AnalysisCompletenessResult {
  kind: 'completeness';
  fields: string[];
  groups: (string | null)[];
  cells: number[][];
  groupN: number[];
}

export interface AnalysisFlowResult {
  kind: 'flow';
  frame: string;
  compareTo: string;
  start: number;
  births: number;
  deaths: number;
  movedIn: number;
  movedOut: number;
  end: number;
  unchanged: number;
  links: { from: string | null; to: string | null; value: number }[];
}

export type AnalysisResult = AnalysisAggregateResult | AnalysisRecordsResult | AnalysisCompletenessResult | AnalysisFlowResult;

// A block query with inheritance resolved and report / cross / drill filters merged in.
export interface AnalysisResolvedQuery extends AnalysisQuery {
  frame: string;
  compareTo: string | null;
}

export type AnalysisRequest =
  | { kind: 'aggregate'; query: AnalysisResolvedQuery }
  | { kind: 'records'; query: AnalysisResolvedQuery; page: number; pageSize: number; sortBy: string | null; sortDir: 'asc' | 'desc' }
  | { kind: 'completeness'; query: AnalysisResolvedQuery }
  | { kind: 'flow'; query: AnalysisResolvedQuery };
