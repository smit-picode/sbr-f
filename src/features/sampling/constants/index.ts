import type {
  SamplingAllocationMethod, SamplingAllocationSettings, SamplingFieldKind, SamplingGroupMethod, SamplingUnit,
} from '@/types';

// Operators SBR_SAMPLING_API accepts (SBR_QUERY_PKG's set, the list operators included).
export const SAMPLING_TEXT_OPERATORS: string[] = [
  'in', 'not_in', 'equals', 'is_not', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty',
];
export const SAMPLING_COMPARE_OPERATORS: string[] = [
  'equals', 'is_not', 'greater_than', 'greater_or_equal', 'less_than', 'less_or_equal', 'between', 'in', 'not_in',
  'is_empty', 'is_not_empty',
];
export const SAMPLING_NO_VALUE_OPERATORS: string[] = ['is_empty', 'is_not_empty'];
export const SAMPLING_LIST_OPERATORS: string[] = ['in', 'not_in'];
// Operators whose value is picked from the field's known values rather than typed.
export const SAMPLING_PICK_OPERATORS: string[] = ['equals', 'is_not', 'in', 'not_in'];

export const samplingOperatorsFor = (kind: SamplingFieldKind): string[] =>
  kind === 'text' ? SAMPLING_TEXT_OPERATORS : SAMPLING_COMPARE_OPERATORS;
export const samplingDefaultOperator = (kind: SamplingFieldKind): string => (kind === 'text' ? 'in' : 'greater_or_equal');

export const SAMPLING_OPERATOR_LABELS: Record<string, string> = {
  equals: 'equals',
  is_not: 'is not',
  in: 'is any of',
  not_in: 'is none of',
  contains: 'contains',
  not_contains: 'does not contain',
  starts_with: 'starts with',
  ends_with: 'ends with',
  is_empty: 'is empty',
  is_not_empty: 'is not empty',
  greater_than: 'greater than',
  greater_or_equal: 'at least',
  less_than: 'less than',
  less_or_equal: 'at most',
  between: 'between',
};

// The package's own limits (SBR_SAMPLING_API), so the page stops a request early.
export const SAMPLING_MAX_DEPTH: number = 5;
export const SAMPLING_MAX_CONDITIONS: number = 200;
export const SAMPLING_MAX_STRATA_FIELDS: number = 4;
export const SAMPLING_MAX_BREAKS: number = 20;
export const SAMPLING_MAX_STRATA: number = 2000;
export const SAMPLING_MAX_GROUPS: number = 20;
export const SAMPLING_MAX_UNITS: number = 100000;
export const SAMPLING_MAX_SEED: number = 999999999;
export const SAMPLING_MAX_COLUMNS: number = 100;

// SBR_SAMPLING_API's stratum key: group, CHR(29), values joined with CHR(31), missing as CHR(30).
export const SAMPLING_KEY_GROUP_SEPARATOR: string = '\u001d';
export const SAMPLING_KEY_SEPARATOR: string = '\u001f';
export const SAMPLING_KEY_NULL: string = '\u001e';

export const SAMPLING_GROUP_METHODS: SamplingGroupMethod[] = ['random', 'census', 'manual'];
export const SAMPLING_METHODS: SamplingAllocationMethod[] = ['neyman', 'proportional', 'equal'];

// The register's size bands (micro 1 to 10, small 11 to 50, medium 51 to 250, large 251 plus).
export const SAMPLING_EMPLOYMENT_BANDS: number[] = [11, 51, 251];

export const SAMPLING_DEFAULT_AUX: string = 'EMPLOYMENT';

// The key column of each unit, shown as the unit's id.
export const SAMPLING_UNIT_KEY: Record<SamplingUnit, string> = { enterprise: 'ENTERPRISE_ID', establishment: 'SBR_ID' };

export const SAMPLING_DEFAULT_COLUMNS: Record<SamplingUnit, string[]> = {
  enterprise: ['NAME', 'NAME_ENU', 'NAME_ARA', 'STATUS', 'SECTOR', 'LEGAL_TYPE', 'ISIC_SECTION', 'ISIC_CLASS', 'EMPLOYMENT',
    'SIZE_CLASS', 'ESTABLISHMENT_COUNT', 'MUNICIPALITY'],
  establishment: ['NAME', 'NAME_ARA', 'MOCI_CR_NUM', 'STATUS', 'SECTOR', 'LEGAL_TYPE', 'ISIC_SECTION', 'ISIC_CLASS', 'EMPLOYMENT',
    'SIZE_CLASS', 'MUNICIPALITY', 'ZONE'],
};
// Establishment fields exported with an enterprise sample.
export const SAMPLING_DEFAULT_EST_COLUMNS: string[] = [
  'NAME', 'NAME_ARA', 'MOCI_CR_NUM', 'STATUS', 'MAIN_BRANCH', 'ISIC_CLASS', 'EMPLOYMENT', 'MUNICIPALITY', 'ZONE',
];

// Contact columns, in export order (GET_CONTACTS returns them all).
export const SAMPLING_CONTACT_COLUMNS: string[] = [
  'SBR_ID', 'CONTACT_ID', 'CONTACT_NAME', 'ROLE', 'PHONE', 'MOBILE', 'EMAIL', 'FAX', 'PO_BOX', 'WEBSITE', 'TAGS', 'IS_PRIMARY', 'MATCH',
];

// Frame fields whose values the page shows with a name (section letters, size classes...).
export const SAMPLING_LABELLED_VALUE_FIELDS: string[] = ['ISIC_SECTION', 'ISIC_DIVISION', 'SIZE_CLASS', 'MUNICIPALITY'];

export const SAMPLING_DESIGN_STORAGE_KEY: string = 'sbr:sampling:design';

export const SAMPLING_DEFAULT_ALLOCATION: SamplingAllocationSettings = {
  method: 'neyman',
  sizeMode: 'size',
  sampleSize: 500,
  targetCv: 5,
  minPerStratum: 2,
  reservePct: 0,
  overrides: {},
};

export const SAMPLING_DEFAULT_SEED: number = 20261007;

// Columns of the analysis views the portal never offers, whether or not they hold data.
export const SAMPLING_HIDDEN_FIELDS: string[] = ['TURNOVER'];

// Rows in the hand picked ids template; its ids are made up and far above any real id.
export const SAMPLING_ID_TEMPLATE_ROWS: number = 5;

// Publishing a drawn sample to system accounts; limits mirror SBR_PUBLISHED_SAMPLE_API.
export const SAMPLING_PUBLISH_PERMISSION: string = 'sampling.publish';
export const SAMPLING_PUBLISH_MAX_NAME: number = 200;
export const SAMPLING_PUBLISH_MAX_DESCRIPTION: number = 1000;
