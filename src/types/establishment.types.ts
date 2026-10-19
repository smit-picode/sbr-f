import type { AuditMeta } from './ui.types';

export interface SbrEstablishment {
  ID: number;
  SBR_ID: number;
  SOURCE_CODE: string | null;
  MOCI_ORG_ID: string | null;
  MOCI_CR_NUM: string | null;
  MOCI_CP_NUM: string | null;
  QFC_NUMBER: string | null;
  QFZ_SOURCE_ID: string | null;
  QSTP_REG_NUM: string | null;
  QSTP_TAX_REG_NUM: string | null;
  QSTP_PARENT_REG_NUM: string | null;
  FARM_NO: string | null;
  EID: string | null;
  EID_SOURCE: string | null;
  NAME_ENU: string | null;
  NAME_ENU_SOURCE: string | null;
  TRADE_NAME_ENU: string | null;
  TRADE_NAME_ENU_SOURCE: string | null;
  NPC_NAME_ENU: string | null;
  NPC_NAME_ENU_SOURCE: string | null;
  NAME_ARA: string | null;
  NAME_ARA_SOURCE: string | null;
  TRADE_NAME_ARA: string | null;
  TRADE_NAME_ARA_SOURCE: string | null;
  NPC_NAME_ARA: string | null;
  NPC_NAME_ARA_SOURCE: string | null;
  EST_STATUS: 'Active' | 'Inactive' | null;
  EST_STATUS_SOURCE: string | null;
  EST_STATUS_CATEGORY: string | null;
  EST_STATUS_CATEGORY_SOURCE: string | null;
  LEGAL_TYPE: string | null;
  LEGAL_TYPE_SOURCE: string | null;
  SECTOR_ID: string | null;
  SECTOR_ID_SOURCE: string | null;
  ISIC_CODE: string | null;
  ISIC_CODE_SOURCE: string | null;
  ISIC_CODE_CONFIDENCE?: number | null;
  // Branch / holding
  MAIN_BRANCH_FLG: string | null;
  MAIN_BRANCH_FLG_SOURCE: string | null;
  MAIN_BRANCH_SBR_ID: number | null;
  MAIN_BRANCH_SBR_ID_SOURCE: string | null;
  HOLDING_COMPANY_FLG: string | null;
  HOLDING_COMPANY_FLG_SOURCE: string | null;
  EMPLOYMENT_COUNT: number | null;
  EMPLOYMENT_COUNT_SOURCE: string | null;
  // micro / small / medium / large, the register's own size band
  EMPLOYMENT_SIZE_CATEGORY?: string | null;
  // CR dates
  CR_ISSUE_DATE: string | null;
  CR_EXPIRY_DATE: string | null;
  CR_CANCEL_DATE: string | null;
  CP_ISSUE_DATE: string | null;
  CP_END_DATE: string | null;
  CP_CANCEL_DATE: string | null;
  REG_DATE: string | null;
  REG_EXPIRY_DATE: string | null;
  REG_CANCEL_DATE: string | null;
  VALID_FROM: string | null;
  VALID_TO: string | null;
  ASSOCIATED_ENTERPRISE_ID?: number | null;
  ASSOCIATED_ENTERPRISE_ID_SOURCE?: string | null;
  // True when an open change request targets this record (list endpoint only)
  HAS_PENDING_REQUEST?: boolean;
  PENDING_FIELDS?: Record<string, number>;
}

// Rows from GET /establishments/attachable
export interface AttachableEstablishment {
  ID: number;
  SBR_ID: number;
  NAME_ENU: string | null;
  NAME_ARA: string | null;
  MOCI_CR_NUM: string | null;
  EST_STATUS: string | null;
  SECTOR_ID: string | null;
  LEGAL_TYPE: string | null;
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
  employmentSizeCategory?: string;
  columnFilters?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type EstablishmentStripItem = { icon: React.ReactNode; label: string; value: React.ReactNode | null; fieldKey: string; source?: string | null };

export type EstablishmentLegalUnitRef = { source: string; table: string; idValue: string; current: boolean };

export interface EstablishmentFieldEntry {
  k: string;
  label: string;
  value: React.ReactNode;
  source: string | null;
  mono: boolean;
  show: boolean;
}

export type EstablishmentFormState = Omit<Partial<SbrEstablishment>, 'ID' | 'SBR_ID' | 'VALID_FROM' | 'VALID_TO'>;

export type EstablishmentHistoryVersion = SbrEstablishment & {
  audit?: AuditMeta | null;
  request?: boolean;
  status?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
};
