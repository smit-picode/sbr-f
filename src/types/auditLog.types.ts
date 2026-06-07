export interface AuditLog {
  ID: number;
  TABLE_NAME: string;
  RECORD_ID: number;
  REASON: string;
  CHANGED_BY: string;
  APPROVED_BY: string | null;
  CREATED_AT: string;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  tableName?: string;
  recordId?: number;
  changedBy?: string;
}
