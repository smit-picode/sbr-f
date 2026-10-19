// Joined SBR_USER reference returned by the audit-log endpoint
export interface AuditUserRef {
  ID: number;
  NAME: string;
  EMAIL: string;
}

export interface AuditLog {
  ID: number;
  TABLE_NAME: string;
  PREV_RECORD_ID: number | null;
  NEW_RECORD_ID: number | null;
  OPERATION: string;
  CHANGE_DATA: string | null;
  CHANGE_REASON: string | null;
  CHANGED_BY: number;
  APPROVED_BY: number | null;
  APPROVAL_DATE: string | null;
  APPROVAL_REASON: string | null;
  STATUS: string;
  CREATED_AT: string;
  changedByUser?: AuditUserRef | null;
  approvedByUser?: AuditUserRef | null;
}

// One entry of the Audit Log "All users" / "All approvers" dropdowns
export interface AuditLogActorOption {
  USER_ID: number;
  NAME: string | null;
  EMAIL: string | null;
  CNT: number;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  tableName?: string;
  recordId?: number;
  changedBy?: number;
  approvedBy?: number;
  dateFrom?: string;
  dateTo?: string;
  // Only the logged-in user's own rows: changes they submitted or decided.
  mine?: boolean;
  columnFilters?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AuditMemberDetail { ENTERPRISE_ID?: number; NAME?: string | null }
