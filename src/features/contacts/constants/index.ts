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

// Fields the user is allowed to edit (per the "Is Editable" spec).
// Everything else (ROLE, SOURCE_CODE, identifiers, metadata) is shown read-only / disabled.
export const CONTACT_EDITABLE_FIELDS: string[] = [
  'CONTACT_NAME', 'PHONE', 'MOBILE', 'EMAIL', 'WEBSITE', 'FAX', 'PO_BOX', 'PRIORITY',
];
export const isContactFieldEditable = (field: string): boolean => CONTACT_EDITABLE_FIELDS.includes(field);

// Attribute history is offered for exactly the fields the edit modal lets a user change.
// A locked field (SBR_ID, SOURCE_CODE, ROLE, VALID_FROM/VALID_TO) can never be the subject
// of a portal change request, so its per-attribute popover would always come back empty.
// Deliberately delegates to isContactFieldEditable so the two sets cannot drift apart — if
// a field ever needs history WITHOUT being editable, give this its own list instead of
// widening CONTACT_EDITABLE_FIELDS (that list also drives the update payload).
export const isContactFieldHistoryEnabled = (field: string): boolean => isContactFieldEditable(field);

export const CONTACT_DEFAULT_FILTERS = {
  page: 1,
  limit: 10,
  search: '',
  role: '',
  sourceCode: '',
} as const;
