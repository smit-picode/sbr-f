export const CONTACT_FIELD_LABELS: Record<string, string> = {
  CONTACT_NAME: 'Contact Name',
  EMAIL: 'Email',
  PHONE: 'Phone',
  MOBILE: 'Mobile',
  FAX: 'Fax',
  PO_BOX: 'PO Box',
  WEBSITE: 'Website',
  ROLE: 'Role',
  SOURCE_CODE: 'Source Code',
};

export const CONTACT_ROLE_OPTIONS: string[] = ['Owner', 'Manager'];
// NPC-330: the sources SBR_CONTACTS actually carries. MANUAL = typed in on the portal or by a tag file.
export const CONTACT_SOURCE_CODE_OPTIONS: string[] = ['MOCI', 'MOCI_CP', 'QFZ', 'QSTP', 'MANUAL'];

export const CONTACT_ROLE_FILTER_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Owner', value: 'Owner' },
  { label: 'Manager', value: 'Manager' },
];

export const CONTACT_EDITABLE_FIELDS: string[] = [
  'CONTACT_NAME', 'PHONE', 'MOBILE', 'EMAIL', 'WEBSITE', 'FAX', 'PO_BOX',
];
export const isContactFieldEditable = (field: string): boolean => CONTACT_EDITABLE_FIELDS.includes(field);

// Attribute history is offered for exactly the fields the edit modal lets a user change.
export const isContactFieldHistoryEnabled = (field: string): boolean => isContactFieldEditable(field);

export const CONTACT_DEFAULT_FILTERS = {
  page: 1,
  limit: 10,
  search: '',
  role: '',
  sourceCode: '',
  tagCode: '',
} as const;
