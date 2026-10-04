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
