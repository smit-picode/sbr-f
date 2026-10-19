// GET /data-quality/summary: GET_SUMMARY plus GET_TABLE_SCORES, all keyed on one scored run.
export interface DqLastRun {
  DQ_RUN_ID: number;
  PIPELINE_RUN_ID: number | null;
  STARTED_AT: string | null;
  FINISHED_AT: string | null;
  RULES_RUN: number | null;
  RULES_FAILED: number | null;
  HOURS_SINCE: number | null;
}

export interface DqDimensionScore {
  QUALITY_DIMENSION: string;
  RULES_SCORED: number;
  RULES_EMPTY: number;
  RULES_ERRORED: number;
  WEIGHTED_PCT: number | null;
  QDTI_SCORE_PCT: number | null;
  QDTI_TIER: string | null;
}

export interface DqRule {
  RULE_ID: string;
  FIELD_NAME: string | null;
  SBR_TABLE: string | null;
  SBR_COLUMN: string | null;
  RULE_DESCRIPTION: string | null;
  RULE_TYPE: string | null;
  QUALITY_DIMENSION: string | null;
  WEIGHT: string | null;
  WEIGHT_VALUE: number | null;
  IS_ACTIVE: string | null;
  SQL_STATUS: string | null;
  SQL_NOTES: string | null;
  DQ_RUN_ID: number | null;
  VALID_CNT: number | null;
  TOTAL_CNT: number | null;
  FLAGGED_CNT: number | null;
  PASS_PCT: number | null;
  QDTI_SCORE: number | null;
  QDTI_TIER: string | null;
  ERROR_MESSAGE: string | null;
  FINISHED_AT: string | null;
}

export interface DqTableScore {
  DQ_RUN_ID: number;
  SBR_TABLE: string;
  RULES_CNT: number;
  RULES_SCORED: number;
  COMPLETENESS_SCORE: number | null;
  UNIQUENESS_SCORE: number | null;
  VALIDITY_SCORE: number | null;
  CONSISTENCY_SCORE: number | null;
  REFERENTIAL_INTEGRITY_SCORE: number | null;
  ACCURACY_SCORE: number | null;
  OVERALL_SCORE: number | null;
  LAST_UPDATE_AT: string | null;
}

// lastRun is null when the register has never been scored; every list is then empty.
export interface DqSummary {
  lastRun: DqLastRun | null;
  dimensions: DqDimensionScore[];
  tables: DqTableScore[];
  rules: DqRule[];
}

export type NpcCorrectionStatus = 'AHEAD_OVERRIDDEN' | 'AHEAD_FILLED' | 'CAUGHT_UP';
export type NpcCorrectionListStatus = 'AHEAD' | 'CAUGHT_UP' | 'ALL';

// asOf is null until a full pipeline run has built the indicator.
export interface NpcCorrectionsSummary {
  asOf: string | null;
  kpis: {
    valuesAhead: number;
    overridden: number;
    filled: number;
    establishmentsAhead: number;
    caughtUpSinceJan: number;
    surveySharePct: number;
  };
  byRegulator: { regulator: string; channel: string; values: number }[];
  byField: { table: string; column: string; values: number }[];
  trend: { monthEnd: string; values: number; reconstructed: boolean }[];
}

export interface NpcCorrection {
  SBR_ID: number;
  ESTABLISHMENT_NAME_ENU: string | null;
  ESTABLISHMENT_NAME_ARA: string | null;
  ENTITY_TABLE: string;
  COLUMN_NAME: string;
  REGULATOR_VALUE: string | null;
  NPC_VALUE: string | null;
  REGULATOR_CODE: string;
  STATUS: NpcCorrectionStatus;
  CHANNEL: string;
  CHANNEL_REF: string | null;
  APPROVED_AT: string | null;
  SINCE: string | null;
}

export interface NpcCorrectionsParams {
  status?: NpcCorrectionListStatus;
  page?: number;
  limit?: number;
  columnFilters?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type DqTier = 'Green' | 'Amber' | 'Red';

export interface DqColumnScore {
  column: string;
  fieldName: string | null;
  rules: number;
  pct: number | null;
}
