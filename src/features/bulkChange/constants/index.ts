// Constants for the "New bulk update" wizard.
//
// The COLUMN DICTIONARY is no longer hardcoded here: it is served by
// GET /bulk-change/template/:entityType, built from the backend's BULK_EDITABLE_COLUMNS —
// the same specs the server validates against. Keeping a second copy in the UI is how a
// template drifts into offering columns the API rejects (it previously offered CR_EXPIRY_DATE
// and ROLE, both of which the single-record editors mark not-editable, and a SECTOR_ID value
// of "Government" that is not in the SECTOR enum).
import type { BulkChangeEntityType } from '../types';

export type BulkChangeTableKey = 'Establishments' | 'Contacts' | 'Addresses';

export interface BulkChangeTableOption {
  key: BulkChangeTableKey;
  label: string;
  // The friendly entity type SBR_PORTAL_PKG.SUBMIT_CHANGE dispatches on.
  entityType: BulkChangeEntityType;
  // Reuses the app-wide nav.* translations instead of duplicating the same three
  // table names under a new key — nav.establishments/contacts/addresses already exist.
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

// Which identifier each entity's spreadsheet must carry.
//
// This is NOT cosmetic. SBR_PORTAL_PKG documents different identifier semantics per entity:
// an establishment has one current row per SBR_ID, but an establishment has MANY contacts and
// MANY addresses, so those two are addressed by the specific record ID being edited. A contacts
// or addresses file keyed only on SBR_ID cannot say which row it means.
export const BULK_CHANGE_ID_COLUMN: Record<BulkChangeEntityType, string> = {
  ESTABLISHMENT: 'SBR_ID',
  CONTACT: 'ID',
  ADDRESS: 'ID',
};

// Batch ceiling enforced by the API (BULK_MAX_ITEMS). Checked client-side too so an oversized
// workbook is rejected before it is parsed and posted.
export const BULK_CHANGE_MAX_ROWS = 1000;

export const BULK_CHANGE_ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

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

// Status -> badge classes. Rectangular (rounded-md) per the design reference; the PARTIALLY_*
// states exist because a bulk decision is best-effort and can legitimately land half-applied.
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

// Default English text for each server validation code, used as the i18n defaultValue.
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
