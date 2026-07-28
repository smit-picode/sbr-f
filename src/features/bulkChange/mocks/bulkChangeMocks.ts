// Static preview data for the Bulk Change feature — mirrors the client reference UI.
// No backend/API exists for this feature yet (pending DBA procedures); swap for a real
// RTK Query hook once the API lands. Shared by the list, history and review pages so they
// all stay in sync while everything is mocked.
import type { BulkChangeTaskSummary, BulkChangeTaskDetail, BulkChangeRecordRow } from '../types';

export const MOCK_BULK_TASKS: BulkChangeTaskSummary[] = [
  { ID: 'BLK-3012', SUBMITTED_BY: 'mohsen.a@npc.gov.qa', SUBMITTED_AT: '18/07/2026, 10:22:00', TABLE_NAME: 'Establishments', RECORDS: 8,  CHANGES: 11, STATUS: 'Pending' },
  { ID: 'BLK-3009', SUBMITTED_BY: 'analyst@npc.qa',      SUBMITTED_AT: '15/07/2026, 14:05:00', TABLE_NAME: 'Contacts',       RECORDS: 23, CHANGES: 31, STATUS: 'Pending' },
];

export const MOCK_BULK_HISTORY: BulkChangeTaskSummary[] = [
  { ID: 'BLK-2998', SUBMITTED_BY: 'mohsen.a@npc.gov.qa', SUBMITTED_AT: '30/06/2026, 09:40:00', TABLE_NAME: 'Establishments', RECORDS: 40, CHANGES: 52, STATUS: 'Approved', DECIDED_BY: 'admin@sbr.com' },
  { ID: 'BLK-2990', SUBMITTED_BY: 'analyst@npc.qa',      SUBMITTED_AT: '21/06/2026, 11:12:00', TABLE_NAME: 'Addresses',      RECORDS: 12, CHANGES: 12, STATUS: 'Rejected', DECIDED_BY: 'admin@sbr.com' },
];

const COMMON_COLUMNS = [
  { key: 'SBR_ID', label: 'SBR_ID' },
  { key: 'NAME_ENU', label: 'NAME_ENU' },
  { key: 'EST_STATUS', label: 'EST_STATUS' },
  { key: 'SECTOR_ID', label: 'SECTOR_ID' },
  { key: 'EMPLOYMENT_COUNT', label: 'EMPLOYMENT_COUNT' },
  { key: 'CR_EXPIRY_DATE', label: 'CR_EXPIRY_DATE' },
];

// Sample confirm-table rows reused across every mocked task — no backend to source real
// per-task rows from yet, so every task shows the same illustrative diff set.
const SAMPLE_ROWS: BulkChangeRecordRow[] = [
  {
    id: 47,
    fields: [
      { key: 'SBR_ID', value: 47, oldValue: null, changed: false },
      { key: 'NAME_ENU', value: 'acme trading & logistics co', oldValue: 'acme trading co', changed: true },
      { key: 'EST_STATUS', value: 'Active', oldValue: null, changed: false },
      { key: 'SECTOR_ID', value: 'Private', oldValue: null, changed: false },
      { key: 'EMPLOYMENT_COUNT', value: 40, oldValue: 25, changed: true },
      { key: 'CR_EXPIRY_DATE', value: '2027-03-31', oldValue: '2026-03-31', changed: true },
    ],
  },
  {
    id: 48,
    fields: [
      { key: 'SBR_ID', value: 48, oldValue: null, changed: false },
      { key: 'NAME_ENU', value: 'theta recycling co', oldValue: null, changed: false },
      { key: 'EST_STATUS', value: 'Inactive', oldValue: 'Active', changed: true },
      { key: 'SECTOR_ID', value: 'Private', oldValue: null, changed: false },
      { key: 'EMPLOYMENT_COUNT', value: 12, oldValue: null, changed: false },
      { key: 'CR_EXPIRY_DATE', value: null, oldValue: null, changed: false },
    ],
  },
  {
    id: 53,
    fields: [
      { key: 'SBR_ID', value: 53, oldValue: null, changed: false },
      { key: 'NAME_ENU', value: 'gamma logistics group', oldValue: 'gamma logistics co', changed: true },
      { key: 'EST_STATUS', value: 'Active', oldValue: null, changed: false },
      { key: 'SECTOR_ID', value: 'Mixed-Private', oldValue: 'Private', changed: true },
      { key: 'EMPLOYMENT_COUNT', value: 40, oldValue: null, changed: false },
      { key: 'CR_EXPIRY_DATE', value: null, oldValue: null, changed: false },
    ],
  },
  {
    id: 54,
    fields: [
      { key: 'SBR_ID', value: 54, oldValue: null, changed: false },
      { key: 'NAME_ENU', value: 'delta media group', oldValue: null, changed: false },
      { key: 'EST_STATUS', value: 'Active', oldValue: null, changed: false },
      { key: 'SECTOR_ID', value: 'Mixed-Private', oldValue: null, changed: false },
      { key: 'EMPLOYMENT_COUNT', value: 18, oldValue: null, changed: false },
      { key: 'CR_EXPIRY_DATE', value: null, oldValue: null, changed: false },
    ],
  },
];

export const MOCK_BULK_DETAILS: Record<string, BulkChangeTaskDetail> = {
  'BLK-3012': {
    ID: 'BLK-3012',
    SUBMITTED_BY: 'mohsen.a@npc.gov.qa',
    SUBMITTED_AT: '18/07/2026, 10:22:00',
    TABLE_NAME: 'Establishments',
    RECORDS: 8,
    CHANGES: 11,
    STATUS: 'Pending',
    REASON: 'Correcting sector classification for 8 units flagged in the Q2 review — reclassifying from Private to Mixed-Government per updated ownership records.',
    COLUMNS: COMMON_COLUMNS,
    ROWS: SAMPLE_ROWS,
  },
  'BLK-3009': {
    ID: 'BLK-3009',
    SUBMITTED_BY: 'analyst@npc.qa',
    SUBMITTED_AT: '15/07/2026, 14:05:00',
    TABLE_NAME: 'Contacts',
    RECORDS: 23,
    CHANGES: 31,
    STATUS: 'Pending',
    REASON: 'Bulk-updating stale phone numbers verified against the latest QFZ registrar export.',
    COLUMNS: COMMON_COLUMNS,
    ROWS: SAMPLE_ROWS,
  },
  'BLK-2998': {
    ID: 'BLK-2998',
    SUBMITTED_BY: 'mohsen.a@npc.gov.qa',
    SUBMITTED_AT: '30/06/2026, 09:40:00',
    TABLE_NAME: 'Establishments',
    RECORDS: 40,
    CHANGES: 52,
    STATUS: 'Approved',
    DECIDED_BY: 'admin@sbr.com',
    REASON: 'Standardising legal-type values to the canonical list after the MoCI schema alignment.',
    COLUMNS: COMMON_COLUMNS,
    ROWS: SAMPLE_ROWS,
  },
  'BLK-2990': {
    ID: 'BLK-2990',
    SUBMITTED_BY: 'analyst@npc.qa',
    SUBMITTED_AT: '21/06/2026, 11:12:00',
    TABLE_NAME: 'Addresses',
    RECORDS: 12,
    CHANGES: 12,
    STATUS: 'Rejected',
    DECIDED_BY: 'admin@sbr.com',
    REASON: 'Applying corrected zone numbers from the municipality survey.',
    COLUMNS: COMMON_COLUMNS,
    ROWS: SAMPLE_ROWS,
  },
};
