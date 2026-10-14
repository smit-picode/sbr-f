import type { DqTableScore } from '@/types';

export type DqTier = 'Green' | 'Amber' | 'Red';

// The QDTI guide's thresholds, the same ones SBR_DQ_RUN uses for a rule's tier (docs/data-quality.md section 7).
export const DQ_GREEN_MIN: number = 85;
export const DQ_AMBER_MIN: number = 60;

export const DQ_TIER_STYLE: Record<DqTier, { bg: string; fg: string; dot: string }> = {
  Green: { bg: '#ECFDF5', fg: '#047857', dot: '#3FB185' },
  Amber: { bg: '#FBF3D6', fg: '#A67C1B', dot: '#BF9F5F' },
  Red:   { bg: '#FDECEC', fg: '#B23B3B', dot: '#DF7878' },
};
export const DQ_NO_SCORE_COLOR: string = '#CBD5E1';

// The six Quality Dimensions, in the order the page lists them, with the V_DQ_TABLE_SCORE column for each.
export const DQ_DIMENSIONS: { name: string; tableKey: keyof DqTableScore }[] = [
  { name: 'Completeness',          tableKey: 'COMPLETENESS_SCORE' },
  { name: 'Validity',              tableKey: 'VALIDITY_SCORE' },
  { name: 'Uniqueness',            tableKey: 'UNIQUENESS_SCORE' },
  { name: 'Consistency',           tableKey: 'CONSISTENCY_SCORE' },
  { name: 'Accuracy',              tableKey: 'ACCURACY_SCORE' },
  { name: 'Referential Integrity', tableKey: 'REFERENTIAL_INTEGRITY_SCORE' },
];

// GET_SUMMARY's register-wide row in the dimensions cursor.
export const DQ_OVERALL_DIMENSION: string = 'OVERALL';

// How NPC learned the right value (SBR_AUDIT_LOG.CHANNEL), in chart and legend order.
export const NPC_CORRECTION_CHANNELS: string[] = ['PORTAL', 'BULK', 'SURVEY'];
export const NPC_CORRECTION_CHANNEL_COLOR: Record<string, string> = {
  PORTAL: '#A29374',
  BULK: '#0D4261',
  SURVEY: '#129B82',
};
export const NPC_CORRECTION_CHANNEL_LABEL: Record<string, string> = {
  PORTAL: 'Portal edit',
  BULK: 'Bulk change',
  SURVEY: 'Survey return',
};

// Regulator dot colours: each source code takes its regulator's colour (MOCI_CP and MOCI_PRI are MOCI's, MOM_FARM is MOM's).
export const NPC_CORRECTION_REGULATOR_COLOR: Record<string, string> = {
  MOCI: '#A29374',
  MOCI_CP: '#A29374',
  MOCI_PRI: '#A29374',
  QFC: '#0D4261',
  QFZ: '#129B82',
  QSTP: '#8A1538',
  MOM_FARM: '#8067A4',
};
export const NPC_CORRECTION_REGULATOR_FALLBACK_COLOR: string = '#64748B';

export const NPC_CORRECTION_STATUS_OPTIONS: { value: 'AHEAD' | 'CAUGHT_UP' | 'ALL'; label: string }[] = [
  { value: 'AHEAD', label: 'Still ahead' },
  { value: 'CAUGHT_UP', label: 'Regulator caught up' },
  { value: 'ALL', label: 'All' },
];

export const NPC_CORRECTIONS_PAGE_SIZE: number = 20;

// The indicator is rebuilt by every full pipeline run; older than this and the page says it may be out of date.
export const NPC_CORRECTIONS_STALE_DAYS: number = 3;

// Columns the corrections table can sort on (SBR_DQ_API's corr_sort_expr keys).
export const NPC_CORRECTIONS_SORTABLE: string[] = ['ESTABLISHMENT_NAME_ENU', 'COLUMN_NAME', 'REGULATOR_CODE', 'CHANNEL', 'APPROVED_AT', 'SINCE'];
