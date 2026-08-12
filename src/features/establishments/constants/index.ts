// Field Labels for error messages and form display
export const ESTABLISHMENTS_FIELD_LABELS: Record<string, string> = {
  NAME_ENU: 'Regulatory Name (English)',
  NAME_ARA: 'Regulatory Name (Arabic)',
  // Pseudo-field: the shared "English or Arabic name required" rule (see NAMES_FIELD in
  // EditEstablishmentModal) — listed once in the error summary rather than per input.
  NAMES: 'Regulatory Name',
  EST_STATUS: 'Est. Status',
  SECTOR_ID: 'Sector',
  MAIN_BRANCH_FLG: 'Main Branch Flag',
  EMPLOYMENT_COUNT: 'Employment Count',
  MAIN_BRANCH_SBR_ID: 'Main Branch SBR ID',
  ROLE: 'Role',
  SOURCE_CODE: 'Source Code',
};

// Enum Options from backend
export const EST_STATUS_OPTIONS: (string | null)[] = ['Active', 'Inactive', null];
export const SECTOR_ID_OPTIONS: string[] = ['Private', 'Mixed-Private', 'Mixed-Government'];
export const MAIN_BRANCH_FLG_OPTIONS: string[] = ['MAIN', 'BRANCH'];
export const ESTABLISHMENTS_SOURCE_CODE_OPTIONS: string[] = ['MOCI', 'QFC', 'QFZ', 'QSTP', 'MOM_FARM'];

// Legal Type SUGGESTIONS, deliberately not a closed enum. The 2026-08-11 requirements call
// asked for a dropdown of the known values while still allowing a value that is not in the
// list, because no verified exhaustive list of Qatari legal types exists. So this drives a
// datalist (type-ahead suggestions on a normal text input), NOT a Select, and LEGAL_TYPE is
// deliberately absent from the validate() checks — anything the user types is accepted.
// Values are the distinct LEGAL_TYPE values currently present on active establishments.
export const LEGAL_TYPE_SUGGESTIONS: string[] = [
  'Sole Proprietorship', 'Partnership', 'Branch', 'WLL', 'LLC', 'Single Person Company',
];

// Max length validations from backend validator
export const ESTABLISHMENTS_MAX_LENGTHS: Record<string, number> = {
  NAME_ENU: 500,
  NAME_ARA: 500,
  NAME_ENU_SOURCE: 50,
  NAME_ARA_SOURCE: 50,
  TRADE_NAME_ENU: 500,
  TRADE_NAME_ARA: 500,
  TRADE_NAME_ENU_SOURCE: 50,
  TRADE_NAME_ARA_SOURCE: 50,
  NPC_NAME_ENU: 500,
  NPC_NAME_ARA: 500,
  NPC_NAME_ENU_SOURCE: 50,
  NPC_NAME_ARA_SOURCE: 50,
  EST_STATUS_SOURCE: 50,
  EST_STATUS_CATEGORY: 50,
  EST_STATUS_CATEGORY_SOURCE: 50,
  LEGAL_TYPE: 50,
  LEGAL_TYPE_SOURCE: 50,
  SECTOR_ID_SOURCE: 50,
  ISIC_CODE: 20,
  ISIC_CODE_SOURCE: 50,
  EMPLOYMENT_COUNT_SOURCE: 50,
  MAIN_BRANCH_FLG_SOURCE: 50,
  MAIN_BRANCH_SBR_ID_SOURCE: 50,
  HOLDING_COMPANY_FLG: 1,
  HOLDING_COMPANY_FLG_SOURCE: 50,
  MOCI_ORG_ID: 100,
  MOCI_CR_NUM: 100,
  MOCI_CP_NUM: 100,
  QFC_NUMBER: 100,
  QFZ_SOURCE_ID: 100,
  QSTP_REG_NUM: 100,
  QSTP_TAX_REG_NUM: 100,
  QSTP_PARENT_REG_NUM: 100,
  FARM_NO: 100,
  EID: 200,
  EID_ORIG_SOURCE: 50,
};

export const ESTABLISHMENTS_DEFAULT_FILTERS = {
  page: 1,
  limit: 10,
  search: '',
  estStatus: '',
  sectorId: '',
  isicCode: '',
  sourceCode: '',
  mainBranchFLG: '',
} as const;

// Columns offered in the dynamic "Column filters" builder. `value` must match a key in
// the backend ESTABLISHMENT_FILTER_COLUMNS allow-list (establishments.controller).
export const ESTABLISHMENT_FILTER_COLUMNS: { value: string; label: string }[] = [
  { value: 'SBR_ID', label: 'SBR ID' },
  { value: 'NAME_ENU', label: 'Name (EN)' },
  { value: 'NAME_ARA', label: 'Name (AR)' },
  { value: 'EST_STATUS', label: 'Status' },
  { value: 'SECTOR_ID', label: 'Sector' },
  { value: 'LEGAL_TYPE', label: 'Legal type' },
  { value: 'SOURCE_CODE', label: 'Source' },
  { value: 'MOCI_CR_NUM', label: 'MOCI CR' },
];

// Fields that are LOCKED (not user-editable). Everything else is editable.
// These map to the "Is Editable = false" variables: identifiers, regulator IDs,
// main regulator (SOURCE_CODE), all CR/CP/registration dates, and the branch flag.
export const ESTABLISHMENT_LOCKED_FIELDS: string[] = [
  'MOCI_ORG_ID',      // Organisation ID
  'SOURCE_CODE',      // Main Regulator
  'MOCI_CR_NUM',      // Commercial Registration ID (CR)
  'MOCI_CP_NUM',      // Commercial Permit ID (CP)
  'CR_ISSUE_DATE', 'CR_EXPIRY_DATE', 'CR_CANCEL_DATE',
  'CP_ISSUE_DATE', 'CP_END_DATE', 'CP_CANCEL_DATE',
  'REG_DATE', 'REG_EXPIRY_DATE', 'REG_CANCEL_DATE',
  'MAIN_BRANCH_FLG',  // Branch Flag
];

// Every `*_SOURCE` column is provenance the database owns — it records which system or user
// last set the paired value, so the application must never write it. Matched by suffix rather
// than listed one by one: SBR_ESTABLISHMENTS carries 17 of them today and the pipeline adds
// more over time, and a suffix rule cannot fall out of date the way a hand-kept list would.
// Requirement from the 2026-08-11 requirements call ("all source columns read-only, all over
// the project"). The paired non-source field stays editable; only the provenance is locked.
const SOURCE_FIELD_SUFFIX = '_SOURCE';

export const isEstablishmentFieldEditable = (field: string): boolean =>
  !field.endsWith(SOURCE_FIELD_SUFFIX) && !ESTABLISHMENT_LOCKED_FIELDS.includes(field);

// Columns SBR_ESTABLISHMENTS_API.GET_LIST accepts for full-dataset sorting — must match
// ESTABLISHMENTS_SORTABLE_COLUMNS in sbr-backend/src/utils/enums.ts exactly. The table shows
// 50+ columns but only these are real, indexable columns the procedure's dynamic ORDER BY
// can sort by; everything else is disabled via DataTable's `sortableColumns` prop.
export const ESTABLISHMENTS_SORTABLE_COLUMNS: string[] = [
  'SBR_ID', 'NAME_ENU', 'NAME_ARA', 'EST_STATUS', 'SECTOR_ID', 'LEGAL_TYPE',
  'SOURCE_CODE', 'MOCI_CR_NUM',
];
