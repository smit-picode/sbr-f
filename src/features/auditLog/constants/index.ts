import type { AuditLogFilters, ColumnFilterOption } from '@/types';

export const AUDIT_LOG_DEFAULT_FILTERS: AuditLogFilters = { page: 1, limit: 10 };

// Values stay as the real table names (sent to the backend); labels are display-only.
export const AUDIT_LOG_TABLE_VALUES: string[] = ['SBR_ESTABLISHMENTS', 'SBR_ENTERPRISES', 'SBR_CONTACTS', 'SBR_ADDRESSES'];

// Must match SBR_AUDIT_LOG_API's filter whitelist; labels are fallbacks for the filter names.
export const AUDIT_LOG_FILTER_COLUMNS: ColumnFilterOption[] = [
  { value: 'TABLE_NAME', label: 'Table', pick: true },
  { value: 'OPERATION', label: 'Operation', pick: true },
  { value: 'STATUS', label: 'Status', pick: true },
  { value: 'CHANGED_BY', label: 'Changed by', pick: true },
  { value: 'APPROVED_BY', label: 'Approved by', pick: true },
  { value: 'CHANGE_REASON', label: 'Reason' },
  { value: 'APPROVAL_REASON', label: 'Approval reason' },
  { value: 'CREATED_AT', label: 'Created at', type: 'date' },
  { value: 'APPROVAL_DATE', label: 'Approval date', type: 'date' },
  { value: 'PREV_RECORD_ID', label: 'Prev Record ID', type: 'number' },
  { value: 'NEW_RECORD_ID', label: 'New Record ID', type: 'number' },
  { value: 'ID', label: 'Audit entry ID', type: 'number' },
];
