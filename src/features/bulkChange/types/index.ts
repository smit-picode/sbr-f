// Bulk Change feature types. No backend/API exists yet (pending DBA procedures) —
// these shapes mirror what the eventual bulk-change API response is expected to look like,
// so mocks.ts can be swapped for a real RTK Query hook without touching the pages.

export interface BulkChangeTaskSummary {
  ID: string;
  SUBMITTED_BY: string;
  SUBMITTED_AT: string;
  TABLE_NAME: string;
  RECORDS: number;
  CHANGES: number;
  STATUS: 'Pending' | 'Approved' | 'Rejected';
  // Only set once STATUS is 'Approved' or 'Rejected'.
  DECIDED_BY?: string;
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
  id: number;
  fields: BulkChangeFieldDiff[];
}

export interface BulkChangeTaskDetail extends BulkChangeTaskSummary {
  REASON: string;
  COLUMNS: BulkChangeColumn[];
  ROWS: BulkChangeRecordRow[];
}

// New-bulk-update wizard (Setup → Upload → Validate → Confirm) — client-only until the
// bulk-change API exists, so these shapes describe wizard state, not a server contract.
export type BulkChangeValidationMessageKey =
  | 'sbrIdMandatory'
  | 'sbrIdNotFound'
  | 'estStatusInvalid'
  | 'sectorInvalid'
  | 'employmentNegative'
  | 'roleInvalid'
  | 'emailInvalid';

export interface BulkChangeValidationIssue {
  row: number;
  field: string;
  messageKey: BulkChangeValidationMessageKey;
}

export interface BulkChangeValidationResult {
  totalRows: number;
  validRows: number;
  errorRows: number;
  issues: BulkChangeValidationIssue[];
  rows: Array<Record<string, string | number>>;
  invalidRowIndexes: Set<number>;
}
