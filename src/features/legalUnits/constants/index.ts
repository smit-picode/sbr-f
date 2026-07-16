export const LEGAL_UNITS_DEFAULT_FILTERS = {
  page: 1,
  limit: 10,
  search: '',
  source: '',
  recordFilter: '',
} as const;

// Source options reuse the shared SOURCE_CODE_OPTIONS from '@/constants' (same enum as
// Establishments) — no need to duplicate the list here.

export const LEGAL_UNIT_RECORD_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All records' },
  { value: 'current', label: 'Current only' },
  { value: 'historical', label: 'Historical only' },
];

// Columns offered in the dynamic "Column filters" builder. `value` must match a key in
// the backend LEGAL_UNIT_FILTER_COLUMNS allow-list (legalUnits.controller — real
// SBR_LEGAL_UNITS columns).
export const LEGAL_UNIT_FILTER_COLUMNS: { value: string; label: string }[] = [
  { value: 'LEGAL_UNIT_ID', label: 'Legal Unit ID' },
  { value: 'ESTABLISHMENT', label: 'Establishment (SBR ID)' },
  { value: 'SOURCE_SYSTEM', label: 'Source System' },
  { value: 'SOURCE_TABLE', label: 'Source Table' },
  { value: 'IDENTIFIER_TYPE', label: 'Identifier Type' },
  { value: 'IDENTIFIER_VALUE', label: 'Identifier Value' },
  { value: 'SCD_COMMENT', label: 'SCD Comment' },
];
