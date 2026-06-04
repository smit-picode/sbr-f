// Field Labels for error messages and form display
export const CONTACT_FIELD_LABELS: Record<string, string> = {
  CONTACT_NAME: 'Contact Name',
  EMAIL: 'Email',
  PHONE: 'Phone',
  MOBILE: 'Mobile',
  FAX: 'Fax',
  PO_BOX: 'PO Box',
  WEBSITE: 'Website',
  ROLE: 'Role',
  PRIORITY: 'Priority',
  SOURCE_CODE: 'Source Code',
};

// Enum Options from backend
export const CONTACT_ROLE_OPTIONS: string[] = ['Owner', 'Manager'];
export const CONTACT_SOURCE_CODE_OPTIONS: string[] = ['MOCI', 'MOCI_CP', 'QFZ', 'QSTP', 'LEGACY_SBR', 'NORAH_AES', 'NORAH_QES', 'CALL_CENTER'];

// Filter dropdown options (with "All" option)
export const CONTACT_ROLE_FILTER_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Owner', value: 'Owner' },
  { label: 'Manager', value: 'Manager' },
];

export const CONTACT_DEFAULT_FILTERS = {
  page: 1,
  limit: 20,
  search: '',
  role: '',
  sourceCode: '',
} as const;
