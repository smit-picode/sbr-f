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
}

// Values of the backend's SNAPSHOT_ENTITY allow-list (underscore, not hyphen).
export type SnapshotEntity = 'establishments' | 'enterprises' | 'enterprise_groups' | 'contacts' | 'addresses';

export interface SnapshotListParams {
  page?: number;
  limit?: number;
}

export interface SnapshotTableParams extends SnapshotListParams {
  id: number;
  entity: SnapshotEntity;
}

export interface CreateSnapshotBody {
  name: string;
  description?: string;
}

// A frozen row is the full base-table row plus SNAPSHOT_ID; its columns differ per entity.
export type SnapshotRow = Record<string, unknown> & { SNAPSHOT_ID: number };
