import type { BulkChangeEntityType } from '../types';

export type BulkChangeTableKey = 'Establishments' | 'Contacts' | 'Addresses';

export interface BulkChangeTableOption {
  key: BulkChangeTableKey;
  label: string;
  entityType: BulkChangeEntityType;
  navKey: string;
  icon: 'Building2' | 'Users' | 'MapPin';
}

export const BULK_CHANGE_TABLES: BulkChangeTableOption[] = [
  { key: 'Establishments', label: 'Establishments', entityType: 'ESTABLISHMENT', navKey: 'nav.establishments', icon: 'Building2' },
  { key: 'Contacts', label: 'Contacts', entityType: 'CONTACT', navKey: 'nav.contacts', icon: 'Users' },
  { key: 'Addresses', label: 'Addresses', entityType: 'ADDRESS', navKey: 'nav.addresses', icon: 'MapPin' },
];

export const ENTITY_TYPE_BY_TABLE: Record<BulkChangeTableKey, BulkChangeEntityType> = {
  Establishments: 'ESTABLISHMENT',
  Contacts: 'CONTACT',
  Addresses: 'ADDRESS',
};

export const TABLE_BY_ENTITY_TYPE: Record<BulkChangeEntityType, BulkChangeTableKey> = {
  ESTABLISHMENT: 'Establishments',
  CONTACT: 'Contacts',
  ADDRESS: 'Addresses',
};

export const BULK_CHANGE_ID_COLUMN: Record<BulkChangeEntityType, string> = {
  ESTABLISHMENT: 'SBR_ID',
  CONTACT: 'ID',
  ADDRESS: 'ID',
};

export const BULK_CHANGE_MAX_ROWS = 200000;

export const BULK_CHANGE_MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;

export const BULK_CHANGE_ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

export const BULK_VALIDATE_RETRY_DELAYS_MS: number[] = [5000, 10000];

export const BULK_TRANSIENT_FAILURE_STATUSES: (string | number)[] = ['FETCH_ERROR', 'TIMEOUT_ERROR', 502, 503, 504];

// Rows-per-page default for both bulk-change lists.
export interface BulkChangeFilterState {
  page: number;
  limit: number;
  entityType?: BulkChangeEntityType;
}

export const BULK_CHANGE_DEFAULT_FILTERS: BulkChangeFilterState = {
  page: 1,
  limit: 10,
};

export const BULK_CHANGE_STATUS_CLASSES: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
  PARTIALLY_APPROVED: 'bg-sky-50 text-sky-700',
  PARTIALLY_REJECTED: 'bg-orange-50 text-orange-700',
  FAILED: 'bg-slate-100 text-slate-600',
};

export const BULK_CHANGE_STATUS_DEFAULTS: Record<string, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PARTIALLY_APPROVED: 'Partially approved',
  PARTIALLY_REJECTED: 'Partially rejected',
  FAILED: 'Failed',
};

export const BULK_CHANGE_VALIDATION_DEFAULTS: Record<string, string> = {
  ID_MISSING: 'The record identifier is required.',
  ID_NOT_NUMERIC: 'The record identifier must be a positive whole number.',
  RECORD_NOT_FOUND: 'No active record matches this identifier.',
  DUPLICATE_ID: 'This record appears more than once in the file.',
  UNKNOWN_COLUMN: 'This column is not part of the template.',
  NOT_EDITABLE: 'This column cannot be changed.',
  INVALID_ENUM: 'Not one of the allowed values.',
  INVALID_INTEGER: 'Must be a whole number.',
  BELOW_MIN: 'Value is below the minimum allowed.',
  TOO_LONG: 'Value is too long.',
  NO_CHANGES: 'This row matches the stored record — nothing to change.',
  ROW_TOO_LARGE: 'This row changes too much data to submit at once.',
};
