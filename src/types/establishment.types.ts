export interface SbrEstablishment {
  ID: number;
  SBR_ID: number;
  SOURCE_CODE: string | null;
  // MOCI fields
  MOCI_ORG_ID: string | null;
  MOCI_CR_NUM: string | null;
  MOCI_CP_NUM: string | null;
  // Other source identifiers
  QFC_NUMBER: string | null;
  QFZ_SOURCE_ID: string | null;
  QSTP_REG_NUM: string | null;
  QSTP_TAX_REG_NUM: string | null;
  QSTP_PARENT_REG_NUM: string | null;
  FARM_NO: string | null;
  EID: string | null;
  EID_SOURCE: string | null;
  EID_ORIG: string | null;
  EID_ORIG_SOURCE: string | null;
  // Names — English
  NAME_ENU: string | null;
  NAME_ENU_SOURCE: string | null;
  TRADE_NAME_ENU: string | null;
  TRADE_NAME_ENU_SOURCE: string | null;
  NPC_NAME_ENU: string | null;
  NPC_NAME_ENU_SOURCE: string | null;
  // Names — Arabic
  NAME_ARA: string | null;
  NAME_ARA_SOURCE: string | null;
  TRADE_NAME_ARA: string | null;
  TRADE_NAME_ARA_SOURCE: string | null;
  NPC_NAME_ARA: string | null;
  NPC_NAME_ARA_SOURCE: string | null;
  // Status
  EST_STATUS: 'Active' | 'Inactive' | null;
  EST_STATUS_SOURCE: string | null;
  EST_STATUS_CATEGORY: string | null;
  EST_STATUS_CATEGORY_SOURCE: string | null;
  // Classification
  LEGAL_TYPE: string | null;
  LEGAL_TYPE_SOURCE: string | null;
  SECTOR_ID: string | null;
  SECTOR_ID_SOURCE: string | null;
  ISIC_CODE: string | null;
  ISIC_CODE_SOURCE: string | null;
  // Branch / holding
  MAIN_BRANCH_FLG: string | null;
  MAIN_BRANCH_FLG_SOURCE: string | null;
  MAIN_BRANCH_SBR_ID: number | null;
  MAIN_BRANCH_SBR_ID_SOURCE: string | null;
  HOLDING_COMPANY_FLG: string | null;
  HOLDING_COMPANY_FLG_SOURCE: string | null;
  // Employment
  EMPLOYMENT_COUNT: number | null;
  EMPLOYMENT_COUNT_SOURCE: string | null;
  // CR dates
  CR_ISSUE_DATE: string | null;
  CR_EXPIRY_DATE: string | null;
  CR_CANCEL_DATE: string | null;
  // CP dates
  CP_ISSUE_DATE: string | null;
  CP_END_DATE: string | null;
  CP_CANCEL_DATE: string | null;
  // Registration dates
  REG_DATE: string | null;
  REG_EXPIRY_DATE: string | null;
  REG_CANCEL_DATE: string | null;
  // Validity
  VALID_FROM: string | null;
  VALID_TO: string | null;
  // The enterprise this establishment belongs to (returned by the detail endpoint only)
  ASSOCIATED_ENTERPRISE_ID?: number | null;
  // True when an open change request targets this record (list endpoint only)
  HAS_PENDING_REQUEST?: boolean;
  // Per-field count of PENDING requests (detail endpoint only)
  PENDING_FIELDS?: Record<string, number>;
}

export interface EstablishmentFilters {
  page?: number;
  limit?: number;
  search?: string;
  estStatus?: string;
  sectorId?: string;
  isicCode?: string;
  sourceCode?: string;
  mainBranchFLG?: string;
  columnFilters?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
