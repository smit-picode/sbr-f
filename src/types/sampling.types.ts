// Sample Builder: the /sampling endpoints (SBR_SAMPLING_API) and the design the page keeps.

export type SamplingUnit = 'enterprise' | 'establishment';
export type SamplingFieldKind = 'number' | 'date' | 'text';
export type SamplingFieldOrigin = 'frame' | 'register';
export type SamplingGroupMethod = 'random' | 'census' | 'manual';

export interface SamplingFrame {
  SNAPSHOT_ID: number;
  SNAPSHOT_NAME: string;
  CREATED_AT: string | null;
  ESTABLISHMENT_COUNT: number | null;
}

export interface SamplingField {
  FIELD_NAME: string;
  KIND: SamplingFieldKind;
  ORIGIN: SamplingFieldOrigin;
}

export interface SamplingValue {
  VALUE: string;
  CNT: number;
}

// The filter tree as the page edits it: every node has an id for React keys and edits.
export interface SamplingCondition {
  id: string;
  kind: 'condition';
  column: string;
  operator: string;
  value: string;
  values: string[];
}

export interface SamplingGroup {
  id: string;
  kind: 'group';
  op: 'and' | 'or';
  not: boolean;
  rules: SamplingNode[];
}

export type SamplingNode = SamplingCondition | SamplingGroup;

// The same tree as the API takes it: no ids, no half-built conditions.
export interface SamplingApiCondition {
  column: string;
  operator: string;
  value?: string | string[];
}

export interface SamplingApiGroup {
  op: 'and' | 'or';
  not?: boolean;
  rules: (SamplingApiCondition | SamplingApiGroup)[];
}

export interface SamplingStratumField {
  column: string;
  breaks?: number[];
}

export type SamplingAllocationMethod = 'neyman' | 'proportional' | 'equal';
export type SamplingSizeMode = 'size' | 'cv';

export interface SamplingStratumOverride {
  takeAll?: boolean;
  n?: number | null;
}

// How one random group's sample is sized and spread over its strata.
export interface SamplingAllocationSettings {
  method: SamplingAllocationMethod;
  sizeMode: SamplingSizeMode;
  sampleSize: number;
  targetCv: number;
  minPerStratum: number;
  reservePct: number;
  overrides: Record<string, SamplingStratumOverride>;
}

// One selection group as the page edits it.
export interface SamplingSelectionGroup {
  id: string;
  name: string;
  method: SamplingGroupMethod;
  filter: SamplingGroup;
  strata: SamplingStratumField[];
  // Hand-picked ids exactly as typed or pasted; parsed when the design is applied.
  manualIds: string;
  allocation: SamplingAllocationSettings;
}

export interface SamplingApiSelectionGroup {
  method: SamplingGroupMethod;
  filter?: SamplingApiGroup | null;
  strata?: SamplingStratumField[];
  ids?: number[];
}

export interface SamplingContactOptions {
  include: boolean;
  tags: string[];
  fallback: 'ALL' | 'NONE';
}

// Everything that defines a sample; saved in the browser and in the export, and loadable from a file.
export interface SamplingDesign {
  version: 2;
  snapshotId: number | null;
  unit: SamplingUnit;
  filter: SamplingGroup;
  groups: SamplingSelectionGroup[];
  auxColumn: string | null;
  seed: number;
  columns: string[];
  estColumns: string[];
  contacts: SamplingContactOptions;
}

export interface SamplingStratum {
  GROUP_NO: number;
  STRATUM_KEY: string;
  S1: string | null;
  S2: string | null;
  S3: string | null;
  S4: string | null;
  N: number;
  AUX_N: number | null;
  AUX_MEAN: number | null;
  AUX_SD: number | null;
  AUX_SUM: number | null;
}

export interface SamplingMissingId {
  GROUP_NO: number;
  UNIT_ID: number;
}

export interface SamplingStrataRequest {
  snapshotId: number | null;
  unit: SamplingUnit;
  filter: SamplingApiGroup | null;
  groups: SamplingApiSelectionGroup[];
  auxColumn: string | null;
}

export interface SamplingStrataResult {
  total: number;
  strata: SamplingStratum[];
  missing: SamplingMissingId[];
}

export interface SamplingAllocationEntry {
  key: string;
  n: number;
  reserve: number;
}

// The auxiliary field only matters for counting strata, so a draw does not send it.
export interface SamplingDrawRequest extends Omit<SamplingStrataRequest, 'auxColumn'> {
  allocation: SamplingAllocationEntry[];
  seed: number;
  columns: string[];
}

export type SamplingRow = Record<string, string | number | null>;

export interface SamplingTableResult {
  columns: string[];
  rows: SamplingRow[];
}

export type SamplingDrawResult = SamplingTableResult;

export interface SamplingEstablishmentsRequest {
  snapshotId: number | null;
  enterpriseIds: number[];
  columns: string[];
}

export interface SamplingContactTag {
  CODE: string;
  NAME_EN: string | null;
  NAME_AR: string | null;
  ONE_PER_ESTABLISHMENT: 'Y' | 'N' | null;
}

export interface SamplingContactsRequest {
  snapshotId: number | null;
  sbrIds: number[];
  tags: string[];
  fallback: 'ALL' | 'NONE';
}

// The draw as published: the page's draw request plus what it fetched after the draw.
export interface SamplingPublishRequest extends SamplingDrawRequest {
  estColumns?: string[];
  contacts: { include: boolean; tags: string[]; fallback: 'ALL' | 'NONE' };
}

export interface SamplingPublishBody {
  name: string;
  description?: string;
  request: SamplingPublishRequest;
  design: SamplingDesign;
  accountIds: number[];
}

export interface PublishedSampleCounts {
  units: number;
  main: number;
  reserve: number;
  establishments: number;
  contacts: number;
}

export interface PublishedSample {
  id: number;
  name: string;
  description: string | null;
  unit: SamplingUnit;
  frame: { snapshotId: number; name: string | null } | null;
  seed: number;
  counts: PublishedSampleCounts;
  publishedAt: string;
  publishedBy: string | null;
  withdrawnAt: string | null;
  accounts: { id: number; name: string }[];
}

export interface SamplePublishAccount {
  id: number;
  name: string;
  clientId: string;
  isActive: boolean;
  canRead: boolean;
}
