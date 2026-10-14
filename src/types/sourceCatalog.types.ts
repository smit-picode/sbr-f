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

// A column the source table viewer shows; KIND decides its filter operators and how a cell is formatted.
export interface SourceTableColumn {
  COLUMN_NAME: string;
  KIND: 'number' | 'date' | 'text';
}

// A source table row: its shape is the table's own columns.
export type SourceTableRow = Record<string, unknown>;

export interface SourceTableParams {
  table: string;
  page?: number;
  limit?: number;
  columnFilters?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// GET /source-catalog/counts: stored counts, null until the database has counted that source or table.
export interface SourceCatalogCounts {
  sources: { source: string; tableCount: number; recordCount: number | null; refreshedAt: string | null }[];
  tables: { source: string; table: string; recordCount: number | null; columnCount: number | null; refreshedAt: string | null }[];
}
