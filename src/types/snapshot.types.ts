// Shapes returned by GET/POST /snapshots (SBR_SNAPSHOTS_API). Counts are cached at freeze time.
export interface SnapshotLiveCounts {
  ESTABLISHMENT_COUNT: number;
  ADDRESS_COUNT: number;
  CONTACT_COUNT: number;
  ENTERPRISE_COUNT: number;
  ENTERPRISE_GROUP_COUNT: number;
}

export interface SnapshotSummary extends SnapshotLiveCounts {
  SNAPSHOT_ID: number;
  SNAPSHOT_NAME: string;
  DESCRIPTION: string | null;
  STATUS: string;
  CREATED_AT: string;
  FROZEN_BY_USER_ID: number | null;
  FROZEN_BY_NAME: string | null;
  FROZEN_BY_EMAIL?: string | null;
}

// Values of the backend's SNAPSHOT_ENTITY allow-list (underscore, not hyphen).
export type SnapshotEntity = 'establishments' | 'enterprises' | 'enterprise_groups' | 'contacts' | 'addresses';

export interface SnapshotListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface SnapshotTableParams extends SnapshotListParams {
  id: number;
  entity: SnapshotEntity;
  // SBR_QUERY_PKG contract: a JSON array of {column, operator, value}; any frozen column.
  columnFilters?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateSnapshotBody {
  name: string;
  description?: string;
}

// A frozen row is the full base-table row plus SNAPSHOT_ID; its columns differ per entity.
export type SnapshotRow = Record<string, unknown> & { SNAPSHOT_ID: number };

export interface SnapshotExportRequest {
  path: string;
  params?: Record<string, string | undefined>;
  fileName: string;
}

export interface SnapshotTableQueryState {
  columnFilters?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SnapshotEntityDef {
  entity: SnapshotEntity;
  countKey: keyof SnapshotLiveCounts;
  i18nKey: string;
  label: string;
  // Same per-entity hue the Create page has always used for its stat tiles.
  tone: string;
}

export type SnapshotColumnKind = 'id' | 'mono' | 'text' | 'number' | 'date' | 'status' | 'source' | 'enterpriseId' | 'badge' | 'mainFlag' | 'unitRef' | 'unitCount' | 'tags';

// [row key, column label key, English fallback, cell kind] — rows are raw frozen base-table rows.
export type SnapshotColumnSpec = [string, string, string, SnapshotColumnKind];

export type SnapshotExportMode = 'table' | 'tables';
