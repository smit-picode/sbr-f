export const ESTABLISHMENTS_FIELD_LABELS: Record<string, string> = {
  NAME_ENU: 'Regulatory Name (English)',
  NAME_ARA: 'Regulatory Name (Arabic)',
  NAMES: 'Regulatory Name',
  EST_STATUS: 'Est. Status',
  EST_STATUS_CATEGORY: 'Est. Status Category',
  SECTOR_ID: 'Sector',
  ISIC_CODE: 'ISIC Code',
  MAIN_BRANCH_FLG: 'Main Branch Flag',
  EMPLOYMENT_COUNT: 'Employment Count',
  MAIN_BRANCH_SBR_ID: 'Main Branch SBR ID',
  ROLE: 'Role',
  SOURCE_CODE: 'Source Code',
};

export const EST_STATUS_OPTIONS: (string | null)[] = ['Active', 'Inactive', null];

export const EST_STATUS_VALUES = { ACTIVE: 'Active', INACTIVE: 'Inactive' } as const;

export const EST_STATUS_SELECT_OPTIONS: string[] = [EST_STATUS_VALUES.ACTIVE, EST_STATUS_VALUES.INACTIVE];
export const MAIN_BRANCH_FLG_OPTIONS: string[] = ['MAIN', 'BRANCH'];
export const ESTABLISHMENTS_SOURCE_CODE_OPTIONS: string[] = ['MOCI', 'QFC', 'QFZ', 'QSTP', 'MOM_FARM'];

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

export const ESTABLISHMENT_FILTER_COLUMNS: { value: string; label: string }[] = [
  { value: 'SBR_ID', label: 'SBR ID' },
  { value: 'NAME_ENU', label: 'Name (EN)' },
  { value: 'NAME_ARA', label: 'Name (AR)' },
  { value: 'TRADE_NAME_ENU', label: 'Trade name (EN)' },
  { value: 'TRADE_NAME_ARA', label: 'Trade name (AR)' },
  { value: 'NPC_NAME_ENU', label: 'NPC name (EN)' },
  { value: 'NPC_NAME_ARA', label: 'NPC name (AR)' },
  { value: 'EST_STATUS', label: 'Status' },
  { value: 'EST_STATUS_CATEGORY', label: 'Status category' },
  { value: 'SECTOR_ID', label: 'Sector' },
  { value: 'LEGAL_TYPE', label: 'Legal type' },
  { value: 'ISIC_CODE', label: 'ISIC code' },
  { value: 'EMPLOYMENT_COUNT', label: 'Employment count' },
  { value: 'MAIN_BRANCH_FLG', label: 'Branch flag' },
  { value: 'MAIN_BRANCH_SBR_ID', label: 'Main branch SBR ID' },
  { value: 'SOURCE_CODE', label: 'Source' },
  { value: 'MOCI_CR_NUM', label: 'MOCI CR' },
];

export const ESTABLISHMENT_LOCKED_FIELDS: string[] = [
  'MOCI_ORG_ID',
  'SOURCE_CODE',
  'MOCI_CR_NUM',
  'MOCI_CP_NUM',
  'QFZ_SOURCE_ID',
  'CR_ISSUE_DATE', 'CR_EXPIRY_DATE', 'CR_CANCEL_DATE',
  'CP_ISSUE_DATE', 'CP_END_DATE', 'CP_CANCEL_DATE',
  'REG_DATE', 'REG_EXPIRY_DATE', 'REG_CANCEL_DATE',
  'MAIN_BRANCH_FLG',
];

const SOURCE_FIELD_SUFFIX = '_SOURCE';

export const isEstablishmentFieldEditable = (field: string): boolean =>
  !field.endsWith(SOURCE_FIELD_SUFFIX) && !ESTABLISHMENT_LOCKED_FIELDS.includes(field);

export const ESTABLISHMENTS_SORTABLE_COLUMNS: string[] = [
  'SBR_ID', 'NAME_ENU', 'NAME_ARA', 'EST_STATUS', 'SECTOR_ID', 'LEGAL_TYPE',
  'SOURCE_CODE', 'MOCI_CR_NUM',
];

export const SHOW_ESTABLISHMENT_SURVEY_SECTIONS: boolean = true;
