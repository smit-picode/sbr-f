// Legal Units is a derived, read-only ledger (no separate table) — each row is synthesised
// backend-side from an establishment SCD2 version. See sbr-backend legalUnits.controller.ts.
export interface LegalUnit {
  LEGAL_UNIT_ID:        number;
  ESTABLISHMENT_SBR_ID: number;
  ESTABLISHMENT_NAME:   string | null;
  SOURCE_SYSTEM:        string;
  SOURCE_TABLE:         string;
  IDENTIFIER_TYPE:      string;
  IDENTIFIER_VALUE:     string;
  VALID_FROM:           string | null;
  VALID_TO:             string | null;
  SCD_COMMENT:          string | null;
}

export interface LegalUnitFilters {
  page?:          number;
  limit?:         number;
  search?:        string;
  source?:        string;
  recordFilter?:  string;
  columnFilters?: string;
}
