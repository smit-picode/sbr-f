// One regulator source table, as GET /source-catalog returns it.
export interface SourceCatalogRecord {
  SOURCE_NAME: string;
  SOURCE_DESC: string | null;
  TABLE_NAME: string;
  TABLE_DESC: string | null;
}

// The catalog rows grouped into one entry per regulator, for the catalog and tables pages.
export interface SourceRegulator {
  code: string;
  name: string | null;
  tables: { name: string; description: string | null }[];
}

// One regulator on GET /source-catalog/summary, with its stored counts.
export interface SourceCatalogSummaryRecord {
  SOURCE_NAME: string;
  SOURCE_DESC: string | null;
  TABLE_COUNT: number;
  RECORD_COUNT: number | null;
  COUNTS_REFRESHED_AT: string | null;
}

// One table on GET /source-catalog/:source, with its stored row and column counts.
export interface SourceCatalogDetailRecord {
  SOURCE_NAME: string;
  TABLE_NAME: string;
  TABLE_DESC: string | null;
  RECORD_COUNT: number | null;
  COLUMN_COUNT: number | null;
  COUNTS_REFRESHED_AT: string | null;
}

export type SourceColumnKind = 'number' | 'date' | 'text';

// One column the source table viewer shows.
export interface SourceTableColumn {
  COLUMN_NAME: string;
  KIND: SourceColumnKind;
}

export type SourceTableRow = Record<string, string | number | null>;

export interface SourceTableFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
