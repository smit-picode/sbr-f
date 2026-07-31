// Field labels for the create/edit modals' validation summary. NAMES is the shared
// "group name in EN or AR" rule that spans both name inputs.
export const ENTERPRISE_GROUP_FIELD_LABELS: Record<string, string> = {
  NAMES: 'Group Name',
  NAME_ENU: 'Group Name (EN)',
  NAME_ARA: 'Group Name (AR)',
  UCI_NAME: 'UCI Name',
  MEMBERS: 'Member Enterprises',
  GROUP_HEAD: 'Group Head',
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

export const ENTERPRISE_GROUP_HOLDING_OPTIONS: string[] = ['Yes', 'No'];
