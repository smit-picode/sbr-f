export interface SbrEnterprise {
  ID: number;
  ENTERPRISE_ID: number;
  MAIN_LEGAL_UNIT_SBR_ID: number | null;
  NAME_ARA: string | null;
  NAME_ARA_SOURCE: string | null;
  NAME_ENU: string | null;
  NAME_ENU_SOURCE: string | null;
  TRADE_NAME_ARA: string | null;
  TRADE_NAME_ARA_SOURCE: string | null;
  TRADE_NAME_ENU: string | null;
  TRADE_NAME_ENU_SOURCE: string | null;
  STATUS: string | null;            // 'Active' | 'Inactive'
  SECTOR_ID: string | null;         // 'Private' | 'Mixed-Private' | 'Mixed-Government'
  SECTOR_ID_SOURCE: string | null;
  HOLDING_COMPANY_FLG: string | null;
  HOLDING_COMPANY_FLG_SOURCE: string | null;
  ISIC_CODE: string | null;
  ISIC_CODE_SOURCE: string | null;
  EMPLOYMENT_COUNT: number | null;
  ANNUAL_TURNOVER: number | null;
  FOREIGN_OWNERSHIP_PCT: number | null;
  FOREIGN_CONTROLLED_FLG: string | null;
  MULTINATIONAL_GROUP_FLG: string | null;
  PARENT_ENTITY_COUNTRY: string | null;
  ECON_ACTIVITY_START_DATE: string | null;
  ECON_ACTIVITY_START_DATE_SOURCE: string | null;
  ENTERPRISE_GROUP_ID: number | null;
  MANUAL_OVERRIDE_FLAG: string | null;
  VALID_FROM: string | null;
  VALID_TO: string | null;
  CREATED_AT: string | null;
  UPDATED_AT: string | null;
  // Derived in the API from the head establishment / member count
  MAIN_CR: string | null;
  LEGAL_TYPE: string | null;
  ESTABLISHMENT_COUNT: number;
  HAS_PENDING_REQUEST?: boolean;
}

export interface EnterpriseFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sectorId?: string;
  columnFilters?: string;
}

// ── Enterprise detail (Enterprise 360) ──────────────────────────────────────
import type { SbrContact } from './contact.types';
import type { SbrAddress } from './address.types';

export interface EnterpriseEstablishment {
  ID: number;
  SBR_ID: number;
  NAME_ENU: string | null;
  NAME_ARA: string | null;
  MOCI_CR_NUM: string | null;
  LEGAL_TYPE: string | null;
  SECTOR_ID: string | null;
  EST_STATUS: string | null;
  EMPLOYMENT_COUNT: number | null;
  ISIC_CODE: string | null;
  MAIN_BRANCH_FLG: string | null;
  MAIN_BRANCH_SBR_ID: number | null;
  contacts: SbrContact[];
  addresses: SbrAddress[];
  PENDING_FIELDS?: Record<string, number>;
}

export interface EnterpriseSecondaryActivity {
  ISIC_CODE: string;
  FROM_SBR_ID: number;
}

export interface EnterpriseLifecycleEvent {
  TYPE: string;
  TITLE: string;
  DATE: string | null;
  REF: string;
}

export interface EnterpriseChangeHistoryUser {
  ID: number;
  NAME: string | null;
  EMAIL: string | null;
}

export interface EnterpriseChangeHistoryEntry {
  ID: number;
  TABLE_NAME: string;
  NEW_RECORD_ID: number | null;
  PREV_RECORD_ID: number | null;
  OPERATION: string;
  STATUS?: string;
  REASON: string;
  CREATED_AT: string;
  APPROVAL_DATE: string | null;
  changedByUser?: EnterpriseChangeHistoryUser | null;
  approvedByUser?: EnterpriseChangeHistoryUser | null;
}

export interface EnterpriseProfilingChange {
  ID: number;
  ACTION: 'ADD' | 'REMOVE';
  SBR_ID: number | null;
  NAME: string | null;
  CR: string | null;
  REASON: string;
  CREATED_AT: string;
  changedByUser?: EnterpriseChangeHistoryUser | null;
  approvedByUser?: EnterpriseChangeHistoryUser | null;
}

export interface EnterpriseDetail {
  enterprise: SbrEnterprise;
  establishments: EnterpriseEstablishment[];
  secondaryActivities: EnterpriseSecondaryActivity[];
  lifecycleEvents: EnterpriseLifecycleEvent[];
  changeHistory: EnterpriseChangeHistoryEntry[];
  profilingChanges: EnterpriseProfilingChange[];
}
