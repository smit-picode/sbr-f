import type { SnapshotEntity, SnapshotLiveCounts } from '@/types';

export interface SnapshotEntityDef {
  entity: SnapshotEntity;
  countKey: keyof SnapshotLiveCounts;
  i18nKey: string;
  label: string;
  // Same per-entity hue the Create page has always used for its stat tiles.
  tone: string;
}

export const SNAPSHOT_ENTITIES: SnapshotEntityDef[] = [
  { entity: 'establishments', countKey: 'ESTABLISHMENT_COUNT', i18nKey: 'nav.establishments', label: 'Establishments', tone: 'bg-red-50 text-red-600' },
  { entity: 'enterprises', countKey: 'ENTERPRISE_COUNT', i18nKey: 'nav.enterprises', label: 'Enterprises', tone: 'bg-amber-50 text-amber-600' },
  { entity: 'enterprise_groups', countKey: 'ENTERPRISE_GROUP_COUNT', i18nKey: 'nav.enterpriseGroups', label: 'Enterprise Groups', tone: 'bg-dune-tint text-dune-deep' },
  { entity: 'contacts', countKey: 'CONTACT_COUNT', i18nKey: 'nav.contacts', label: 'Contacts', tone: 'bg-emerald-50 text-emerald-600' },
  { entity: 'addresses', countKey: 'ADDRESS_COUNT', i18nKey: 'nav.addresses', label: 'Addresses', tone: 'bg-blue-50 text-blue-600' },
];

export const SNAPSHOT_DEFAULT_PAGE_SIZE = 20;
// The backend caps `limit` at 100 and the detail header needs the clicked snapshot's row.
export const SNAPSHOT_LOOKUP_LIMIT = 100;

export const SNAPSHOT_PERMISSIONS = {
  view: 'snapshots.view',
  create: 'snapshots.create',
};

export const SNAPSHOT_NAME_MAX_LENGTH = 200;
export const SNAPSHOT_DESCRIPTION_MAX_LENGTH = 2000;
