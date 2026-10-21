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

// Whether the pipeline has applied an approved member yet; null until the member is approved.
export type BulkChangeApplyState = 'APPLIED' | 'PENDING_APPLY' | 'APPLY_FAILED';

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
  // The spreadsheet row of this validation row, so it never depends on the response order.
  rowNumber?: number;
  auditLogId: number;
  id: number;
  status: string;
  fields: BulkChangeFieldDiff[];
  // UPDATE for an edit; INSERT or DELETE for new contacts and tag changes in an integration batch.
  operation?: string | null;
  memberTable?: string | null;
  // Review screen only.
  applyState?: BulkChangeApplyState | null;
  propagatedAt?: string | null;
  applyAttempts?: number;
  lastApplyError?: string | null;
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
  // Approved members the pipeline has not applied yet, and those of them stuck at the retry limit.
  PENDING_APPLY_COUNT: number;
  APPLY_FAILED_COUNT: number;
  // The latest decision's items that could not be decided or applied.
  DECIDE_FAILED_ITEMS: Array<{ audit_log_id?: number; status: string; error_code?: number; error?: string }>;
}

// Upload wizard: one parsed spreadsheet row
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
  | 'ROW_TOO_LARGE'
  | 'PENDING_CHANGE'
  // A warning, not an error: an approved change to the same column is not applied yet.
  | 'PENDING_APPLY';

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
    index?: number;
    rowNumber?: number;
    id?: number;
    audit_log_id?: number;
    status: 'PENDING' | 'FAILED';
    error_code?: number;
    error?: string;
  }>;
}

// One row a submit could not create a change request for.
export interface BulkChangeSubmitFailure {
  rowNumber?: number;
  error: string;
}

// Result of DECIDE_BULK, as returned by POST /bulk-change/:id/decide.
export interface BulkChangeDecideResponse {
  ID: string;
  BATCH_ID: number;
  decision: BulkChangeDecision;
  total: number;
  succeeded: number;
  failed: number;
  // Approved and committed, but not yet applied to the register by the pipeline.
  pendingApply: number;
  // True when approved items were handed to the background applier instead of applied in the request.
  queued: boolean;
  runs: number;
  items: Array<{
    audit_log_id?: number;
    index?: number;
    status: string;
    error_code?: number;
    error?: string;
    applied?: boolean;
    run_id?: number;
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

// One current record for the export-and-prefill flow
export type BulkChangeExportRecord = Record<string, string | number | null>;

export interface BulkChangeListFilters {
  page?: number;
  limit?: number;
  entityType?: BulkChangeEntityType;
}

export type BulkChangeTableKey = 'Establishments' | 'Contacts' | 'Addresses';

export interface BulkChangeTableOption {
  key: BulkChangeTableKey;
  label: string;
  entityType: BulkChangeEntityType;
  navKey: string;
  icon: 'Building2' | 'Users' | 'MapPin';
}

// Rows-per-page default for both bulk-change lists.
export interface BulkChangeFilterState {
  page: number;
  limit: number;
  entityType?: BulkChangeEntityType;
}

export interface ParsedWorkbook {
  headers: string[];
  items: BulkChangeItemInput[];
  unknownHeaders: string[];
  missingIdColumn: boolean;
}

export interface ParseRequest {
  file: File;
  idColumn: string;
  allowedColumns: string[];
}
