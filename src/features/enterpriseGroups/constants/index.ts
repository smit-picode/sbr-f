// Field labels for the create/edit modals' validation summary. NAMES is the shared
// "group name in EN or AR" rule that spans both name inputs.
export const ENTERPRISE_GROUP_FIELD_LABELS: Record<string, string> = {
  NAMES: 'Group Name',
  NAME_ENU: 'Group Name (EN)',
  NAME_ARA: 'Group Name (AR)',
  UCI_NAME: 'UCI Name',
  MEMBERS: 'Member Enterprises',
  GROUP_HEAD: 'Group Head',
  GROUP_START_DATE: 'Group Start Date',
};

export const ENTERPRISE_GROUP_DEFAULT_FILTERS = {
  page:   1,
  limit:  10,
  search: '',
  status: '',
  type:   '',
} as const;

export const ENTERPRISE_GROUP_FILTER_COLUMNS: { value: string; label: string }[] = [
  { value: 'ENTERPRISE_GROUP_ID',  label: 'Group ID' },
  { value: 'NAME_ENU',             label: 'Name (EN)' },
  { value: 'NAME_ARA',             label: 'Name (AR)' },
  { value: 'UCI_NAME',             label: 'UCI Name' },
  { value: 'STATUS',               label: 'Status' },
  { value: 'PRINCIPAL_ISIC_2DIGIT', label: 'ISIC Code' },
];

export const ENTERPRISE_GROUP_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '',         label: 'All statuses' },
  { value: 'Active',   label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

export const ENTERPRISE_GROUP_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: '',                  label: 'All types' },
  { value: 'Domestic',          label: 'Domestic' },
  { value: 'Multinational',     label: 'Multinational' },
  { value: 'Foreign-controlled', label: 'Foreign-controlled' },
];

export const ENTERPRISE_GROUP_UCI_TYPE_OPTIONS: string[] = ['Enterprise', 'Natural Person', 'Government', 'Foreign Entity', 'Other'];

export const ENTERPRISE_GROUP_UCI_COUNTRY_OPTIONS: string[] = [
  'Qatar',
  'United Kingdom',
  'Germany',
  'United States',
  'France',
  'India',
  'United Arab Emirates',
  'Saudi Arabia',
  'Kuwait',
  'Switzerland',
  'Singapore',
  'Other',
];

// value is what gets submitted — SBR_ENTERPRISE_GROUPS.HOLDING_COMPANY_FLG is VARCHAR2(1),
// so it must be 'Y'/'N' (matches the backend ENTERPRISE_GROUP_HOLDING_FLG enum exactly).
// label keeps the same "Yes"/"No" text the user has always seen — this only changes the
// wire value, not the UI. A modal previously submitted the literal words 'Yes'/'No', which
// raised ORA-12899 (value too large for a 1-char column) at approval time, so a newly
// created Enterprise Group with Holding Company set could never be approved.
export const ENTERPRISE_GROUP_HOLDING_OPTIONS: { label: string; value: string }[] = [
  { label: 'Yes', value: 'Y' },
  { label: 'No', value: 'N' },
];

// The DB stores the canonical NUMBER business key (7001); the UI has always shown "EGR-7001", so
// the prefix is added at render time only. Kept local to this feature rather than in the shared
// utils/format.ts, which every other tab imports.
export const ENTERPRISE_GROUP_CODE_PREFIX = 'EGR-';

export const formatGroupCode = (id: number | string | null | undefined): string =>
  id === null || id === undefined || id === '' ? '' : `${ENTERPRISE_GROUP_CODE_PREFIX}${id}`;

// Users may type either "7001" or "EGR-7001"; the backend matches the numeric column, so drop the
// prefix before it goes into the search param.
export const stripGroupCodePrefix = (term: string): string =>
  term.replace(new RegExp(`^${ENTERPRISE_GROUP_CODE_PREFIX}`, 'i'), '');
