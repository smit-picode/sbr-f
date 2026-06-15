// Field Labels for error messages and form display
export const LEGAL_UNITS_FIELD_LABELS: Record<string, string> = {
  NAME_ENU: 'Name (English)',
  NAME_ARA: 'Name (Arabic)',
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
export const LEGAL_UNITS_SOURCE_CODE_OPTIONS: string[] = ['MOCI', 'QFC', 'QFZ', 'QSTP', 'MOM_FARM'];

// Max length validations from backend validator
export const LEGAL_UNITS_MAX_LENGTHS: Record<string, number> = {
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
  EID_SOURCE: 50,
  EID_ORIG: 20,
  EID_ORIG_SOURCE: 50,
};

export const LEGAL_UNITS_DEFAULT_FILTERS = {
  page: 1,
  limit: 20,
  search: '',
  estStatus: '',
  sectorId: '',
  isicCode: '',
  sourceCode: '',
  mainBranchFLG: '',
} as const;
