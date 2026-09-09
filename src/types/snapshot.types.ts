import type { SbrEstablishment } from './establishment.types';
import type { SbrEnterprise } from './enterprise.types';
import type { SbrContact } from './contact.types';
import type { SbrAddress } from './address.types';

// Frontend-only mock model (NPC-153 procedure for this feature is pending from the DB
// engineer) — a Frozen Frame captures the live core tables at a point in time. Entity
// counts are always derived from the array lengths below, never stored separately, so a
// tab's row count and its badge can never drift apart.
export interface Snapshot {
  ID: number;
  NAME: string;
  DESCRIPTION: string | null;
  FROZEN_AT: string;
  FROZEN_BY: string;
  establishments: SbrEstablishment[];
  enterprises: SbrEnterprise[];
  contacts: SbrContact[];
  addresses: SbrAddress[];
}

export interface SnapshotCounts {
  establishments: number;
  enterprises: number;
  contacts: number;
  addresses: number;
}
