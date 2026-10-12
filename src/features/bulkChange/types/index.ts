// Friendly entity type the procedure dispatches on (SBR_PORTAL_PKG.SUBMIT_CHANGE).
export type BulkChangeEntityType = 'ESTABLISHMENT' | 'CONTACT' | 'ADDRESS';

export type BulkChangeStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'PARTIALLY_APPROVED'
  | 'PARTIALLY_REJECTED'
  | 'FAILED';

export type BulkChangeDecision = 'APPROVED' | 'REJECTED';

export interface BulkChangeTaskSummary {
  ID: string;
  BATCH_ID: number;
  ENTITY_TYPE: BulkChangeEntityType;
  TABLE_NAME: string;
  SUBMITTED_BY: string;
  SUBMITTED_AT: string;
  RECORDS: number;
  CHANGES: number;
  STATUS: BulkChangeStatus;
  DECIDED_BY: string | null;
  DECIDED_AT: string | null;
  PENDING_COUNT?: number;
  APPROVED_COUNT?: number;
  REJECTED_COUNT?: number;
}

export interface BulkChangeColumn {
  key: string;
  label: string;
}

export interface BulkChangeFieldDiff {
  key: string;
  value: string | number | null;
  oldValue: string | number | null;
  changed: boolean;
}

export interface BulkChangeRecordRow {
  auditLogId: number;
  id: number;
  status: string;
  fields: BulkChangeFieldDiff[];
}

// A row SUBMIT_BULK could not create at all.
export interface BulkChangeFailedItem {
  index: number;
  status: 'FAILED';
  error_code?: number;
  error?: string;
}

export interface BulkChangeTaskDetail extends BulkChangeTaskSummary {
  REASON: string | null;
  FILE_NAME: string | null;
  COLUMNS: BulkChangeColumn[];
  ROWS: BulkChangeRecordRow[];
  FAILED_ITEMS: BulkChangeFailedItem[];
}

// Upload wizard ─────────────────────────────────────────────────────────── One parsed spreadsheet row
export interface BulkChangeItemInput {
  rowNumber: number;
  id: number;
  changeData: Record<string, string | number | null>;
}

// Machine-readable problem codes from the server-side validation pass
export type BulkChangeValidationCode =
  | 'ID_MISSING'
  | 'ID_NOT_NUMERIC'
  | 'RECORD_NOT_FOUND'
  | 'DUPLICATE_ID'
  | 'UNKNOWN_COLUMN'
  | 'NOT_EDITABLE'
  | 'INVALID_ENUM'
  | 'INVALID_INTEGER'
  | 'BELOW_MIN'
  | 'TOO_LONG'
  | 'NO_CHANGES'
  | 'ROW_TOO_LARGE';

export interface BulkChangeValidationIssue {
  rowNumber: number;
  field: string | null;
  code: BulkChangeValidationCode;
  message: string;
}

export interface BulkChangeValidationResult {
  totalRows: number;
  validRows: number;
  errorRows: number;
  issues: BulkChangeValidationIssue[];
  rows: BulkChangeRecordRow[];
  columns: BulkChangeColumn[];
}

// Result of SUBMIT_BULK, as returned by POST /bulk-change.
export interface BulkChangeSubmitResponse {
  ID: string;
  BATCH_ID: number;
  submitted: number;
  failed: number;
  items: Array<{
    index: number;
    audit_log_id?: number;
    status: 'PENDING' | 'FAILED';
    error_code?: number;
    error?: string;
  }>;
}

// Result of DECIDE_BULK, as returned by POST /bulk-change/:id/decide.
export interface BulkChangeDecideResponse {
  ID: string;
  BATCH_ID: number;
  decision: BulkChangeDecision;
  total: number;
  succeeded: number;
  failed: number;
  items: Array<{
    audit_log_id?: number;
    index?: number;
    status: string;
    error_code?: number;
    error?: string;
  }>;
}

// Column dictionary served by GET /bulk-change/template/:entityType
export interface BulkChangeTemplateColumn {
  key: string;
  type: 'string' | 'integer' | 'enum';
  required: boolean;
  mandatory: boolean;
  note: string | null;
  allowed: string[] | null;
  maxLength?: number | null;
  min?: number | null;
}

export interface BulkChangeTemplate {
  entityType: BulkChangeEntityType;
  idColumn: string;
  columns: BulkChangeTemplateColumn[];
}
