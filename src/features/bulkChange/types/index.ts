// Bulk Change feature types — the wire contract of /api/v1/bulk-change, which fronts the
// DBA's SBR_PORTAL_PKG.SUBMIT_BULK / DECIDE_BULK procedures (NPC-170).
//
// Those procedures are BEST-EFFORT, not atomic: every row commits independently, so a batch
// can be partly submitted or partly decided. That is why STATUS has PARTIALLY_* members and
// why both submit and decide return a per-item outcome — the UI has to be able to say
// "6 of 8 applied" rather than pretending a batch is all-or-nothing.

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
  // Human-facing task code (BLK-3012).
  ID: string;
  // Numeric batch id — what every /bulk-change/:id route is keyed by.
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
  // 0 on the pre-submit preview — no audit-log row exists until the batch is submitted.
  auditLogId: number;
  id: number;
  status: string;
  fields: BulkChangeFieldDiff[];
}

// A row SUBMIT_BULK could not create at all. No audit-log row exists for these, so they are
// kept on the batch itself and surfaced on the review screen.
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

// ── Upload wizard ───────────────────────────────────────────────────────────
// One parsed spreadsheet row, mapped to Oracle column names, as POSTed to the API.
export interface BulkChangeItemInput {
  rowNumber: number;
  id: number;
  changeData: Record<string, string | number | null>;
}

// Machine-readable problem codes from the server-side validation pass, so the UI can translate
// them rather than render a server-built English sentence.
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

// Column dictionary served by GET /bulk-change/template/:entityType — the single source of
// truth for which columns a bulk upload may touch (it comes from the backend's own editable
// column specs, the same ones validation uses).
export interface BulkChangeTemplateColumn {
  key: string;
  type: 'string' | 'integer' | 'enum';
  // "This is the row identifier column" — drives the Setup step's "must match an existing
  // record" text and the Validate step's allowedColumns filter. NOT the same thing as
  // "must have a non-blank value"; see `mandatory` below for that (NPC-258).
  required: boolean;
  // Whether this column must carry a non-blank value for the upload to succeed (NPC-250/251's
  // app-layer required-field rules — Name, Sector, Contact Name, Municipality ID). Independent
  // of `required` above: the ID column is both required and mandatory, but a mandatory business
  // field like NAME_ENU is never the identifier column.
  mandatory: boolean;
  // Explains a conditional requirement (e.g. "Required when EST_STATUS = Inactive") that doesn't
  // fit a flat mandatory/optional badge. Null when there's no such condition.
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
