import type { ColumnFilterOption } from '@/types';
// Field labels for the modals' validation summary; NAMES is the shared "group name in EN or AR" rule.
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

export const ENTERPRISE_GROUP_FILTER_COLUMNS: ColumnFilterOption[] = [
  { value: 'ENTERPRISE_GROUP_ID',  label: 'Group ID', type: 'number' },
  { value: 'NAME_ENU',             label: 'Name (EN)' },
  { value: 'NAME_ARA',             label: 'Name (AR)' },
  { value: 'UCI_NAME',             label: 'UCI Name' },
  { value: 'STATUS',               label: 'Status', pick: true },
  { value: 'TYPE',                 label: 'Type', pick: true },
  { value: 'UCI_COUNTRY',          label: 'UCI country', pick: true },
  { value: 'UCI_TYPE',             label: 'UCI type', pick: true },
  { value: 'PRINCIPAL_ISIC_2DIGIT', label: 'ISIC Code', pick: true },
  { value: 'TOTAL_EMPLOYEES',      label: 'Total employees', type: 'number' },
  { value: 'GROUP_START_DATE',     label: 'Group start date', type: 'date' },
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

export const ENTERPRISE_GROUP_HOLDING_OPTIONS: { label: string; value: string }[] = [
  { label: 'Yes', value: 'Y' },
  { label: 'No', value: 'N' },
];

export const ENTERPRISE_GROUP_CODE_PREFIX = 'EGR-';

export const formatGroupCode = (id: number | string | null | undefined): string =>
  id === null || id === undefined || id === '' ? '' : `${ENTERPRISE_GROUP_CODE_PREFIX}${id}`;

// Users may type either "7001" or "EGR-7001"
export const stripGroupCodePrefix = (term: string): string =>
  term.replace(new RegExp(`^${ENTERPRISE_GROUP_CODE_PREFIX}`, 'i'), '');
