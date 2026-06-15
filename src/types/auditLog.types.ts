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
  COLUMN_NAME: string | null;
  REASON: string;
  CHANGED_BY: number;
  APPROVED_BY: number | null;
  APPROVAL_DATE: string | null;
  CREATED_AT: string;
  changedByUser?: AuditUserRef | null;
  approvedByUser?: AuditUserRef | null;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  tableName?: string;
  recordId?: number;
  changedBy?: number;
}
