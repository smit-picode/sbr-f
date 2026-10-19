export type SurveyId = 'AES' | 'QES' | 'FDI_A' | 'FDI_Q';
export type SurveyFrequency = 'annual' | 'quarterly';
export type ResponseStatus = 'Responded' | 'Partial' | 'Non-response' | 'Pending';
export type ResponseMode = 'Online' | 'Field visit' | 'Phone';
export type SizeBand = 'micro' | 'small' | 'medium' | 'large';
export type AnswerUnit = 'QAR' | 'persons' | '%' | 'text' | 'code';

export interface Survey {
  id: SurveyId;
  name: string;
  short: string;
  freq: SurveyFrequency;
  color: string;
}

// ── API (GET /surveys/...) ──────────────────────────────────────────────────
export interface SurveySampleApiRow {
  SURVEY_ID: SurveyId;
  PERIOD: string;
  SAMPLE_SIZE: number;
  RESPONDED: number;
  PARTIAL: number;
  NON_RESPONSE: number;
  PENDING: number;
}

export interface SurveyResponseApiRow {
  SURVEY_ID: SurveyId;
  PERIOD: string;
  SBR_ID: number;
  NAME_ENU: string | null;
  NAME_ARA: string | null;
  MOCI_CR_NUM: string | null;
  SOURCE_CODE: string | null;
  SECTOR_ID: string | null;
  ISIC_CODE: string | null;
  EMPLOYMENT_COUNT: number | null;
  RESPONSE_STATUS: ResponseStatus;
  COLLECTION_MODE: ResponseMode | null;
  RESPONDED_ON: string | null;
}

export interface SurveyResponseDetailApi extends SurveyResponseApiRow {
  ANSWERS: Record<string, string | number | null> | null;
}

// One sampled period of an establishment (GET /surveys/establishments/:sbrId/participation).
export interface SurveyParticipationApiRow {
  SURVEY_ID: SurveyId;
  PERIOD: string;
  RESPONSE_STATUS: ResponseStatus;
  RESPONDED_ON: string | null;
}

// GET /surveys/establishments/:sbrId/gva: its AES accounts per year and national totals.
export interface SurveyGvaApi {
  ISIC_CODE: string | null;
  ACTIVITY: { SURVEY_YEAR: number; DIVISION: string; TOTAL_TURNOVER: number; INTERMEDIATE_CONSUMPTION: number; UNITS: number }[];
  AES: { SURVEY_YEAR: number; RESPONSE_STATUS: ResponseStatus; TOTAL_TURNOVER: number | null; INTERMEDIATE_CONSUMPTION: number | null }[];
  ECONOMY: { SURVEY_YEAR: number; QUARTER_NUM: number; VALUE_ADDED: number; PRODUCTION: number; INTERMEDIATE_CONSUMPTION: number }[];
}

export type GvaMeasure = 'valueAdded' | 'production' | 'intermediate';
export type GvaAccounts = Record<GvaMeasure, number>;

export interface SurveyResponsesFilter {
  surveyId?: SurveyId;
  period?: string;
}

// The establishment fields the survey screens read.
export interface SurveyFrame {
  SBR_ID: number;
  NAME_ENU: string | null;
  NAME_ARA: string | null;
  MOCI_CR_NUM: string | null;
  SOURCE_CODE: string | null;
  SECTOR_ID: string | null;
  ISIC_CODE: string | null;
  EMPLOYMENT_COUNT: number | null;
}

export interface SampleMembership {
  status: ResponseStatus;
  mode: ResponseMode | null;
  respondedAt: string | null;
}

export interface SampleRow extends SampleMembership {
  surveyId: SurveyId;
  period: string;
  frame: SurveyFrame;
}

export interface SampleSummary {
  size: number;
  responded: number;
  partial: number;
  nonResponse: number;
  pending: number;
  rate: number;
}

export interface SurveySample extends SampleSummary {
  surveyId: SurveyId;
  survey: Survey;
  period: string;
}

export interface DistributionItem {
  key: string;
  count: number;
}

export interface ResponseTally {
  base: number;
  answered: number;
  responded: number;
  partial: number;
  nonResponse: number;
  pending: number;
  rate: number;
  reliable: boolean;
}

export interface CrossTabCell extends ResponseTally {
  section: string;
  band: SizeBand;
}

export interface ActivitySizeCrossTab {
  sections: (ResponseTally & { section: string })[];
  bands: (ResponseTally & { band: SizeBand })[];
  cells: CrossTabCell[];
  minBase: number;
  total: number;
}

export interface SurveyQuestion {
  code: string;
  column: string;
  label: string;
  unit: AnswerUnit;
}

export interface GvaView {
  // Latest year with a complete AES return; null when the establishment never returned one.
  referenceYear: number | null;
  establishment: GvaAccounts | null;
  // National totals for the reference year, only when all four quarters are in V_SVY_TOTAL_ECONOMY.
  economy: GvaAccounts | null;
  // Year the economy totals are for: the reference year, else the latest year with all four quarters.
  economyYear: number | null;
  shareOfEconomy: Record<GvaMeasure, number | null>;
  // The establishment's ISIC section with what its sampled units reported that year; null if none.
  activity: { section: string; units: number; accounts: GvaAccounts } | null;
  shareOfActivity: Record<GvaMeasure, number | null>;
  // What the activity's sampled units reported, as a share of the national total.
  activityShareOfEconomy: Record<GvaMeasure, number | null>;
  trendYears: number[];
  trend: Record<GvaMeasure, number[]>;
}

export type FrameKey = 'SECTOR_ID' | 'SOURCE_CODE' | 'ISIC_CODE';

export type Tally = Omit<ResponseTally, 'rate' | 'reliable'>;
