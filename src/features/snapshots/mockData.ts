import type { Snapshot, SbrEstablishment, SbrEnterprise, SbrContact, SbrAddress } from '@/types';

// Frontend-only placeholder data (NPC-153's freeze procedure hasn't been delivered by the
// DB engineer yet). Generated rather than hand-written so each snapshot's tab count always
// matches its actual row count — no separate "counts" field to drift out of sync.

const NAME_STEMS = [
  'psi solo', 'theta recycling', 'zayin authority', 'he manufacturing', 'omega restaurants',
  'delta construction', 'omicron contracting', 'upsilon investments', 'beta services',
  'acme trading', 'zeta', 'kappa logistics', 'sigma holdings', 'lambda foods', 'rho energy',
];
const SUFFIXES = ['co', 'branch', 'a', 'group', ''];
const SOURCE_CODES = ['MOCI', 'QFC', 'QFZ', 'QSTP', 'MOM_FARM'] as const;
const LEGAL_TYPES = ['LLC', 'WLL', 'Single Person Company', 'Branch', 'Partnership'];
const SECTORS = ['Private', 'Mixed-Private', 'State Owned'];
const ZONES = ['Doha', 'Al Wakrah', 'Al Rayyan', 'Al Khor'];

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length];
}

function companyName(i: number): string {
  const stem = pick(NAME_STEMS, i);
  const suffix = pick(SUFFIXES, Math.floor(i / NAME_STEMS.length));
  return suffix ? `${stem} ${suffix}` : stem;
}

export function generateMockEstablishments(count: number, sbrIdStart: number): SbrEstablishment[] {
  return Array.from({ length: count }, (_, i) => {
    const sbrId = sbrIdStart + i;
    const name = companyName(i);
    return {
      ID: sbrId, SBR_ID: sbrId, SOURCE_CODE: pick(SOURCE_CODES, i),
      MOCI_ORG_ID: `1${10000 + sbrId}`, MOCI_CR_NUM: String(99999 - i), MOCI_CP_NUM: null,
      QFC_NUMBER: null, QFZ_SOURCE_ID: null, QSTP_REG_NUM: null, QSTP_TAX_REG_NUM: null,
      QSTP_PARENT_REG_NUM: null, FARM_NO: null, EID: null, EID_SOURCE: null,
      NAME_ENU: name, NAME_ENU_SOURCE: 'MOCI',
      TRADE_NAME_ENU: `Sharika ${name.replace(/\b\w/g, (c) => c.toUpperCase())}`, TRADE_NAME_ENU_SOURCE: null,
      NPC_NAME_ENU: name, NPC_NAME_ENU_SOURCE: 'MOCI',
      NAME_ARA: null, NAME_ARA_SOURCE: null, TRADE_NAME_ARA: null, TRADE_NAME_ARA_SOURCE: null,
      NPC_NAME_ARA: null, NPC_NAME_ARA_SOURCE: null,
      EST_STATUS: i % 5 === 0 ? 'Inactive' : 'Active', EST_STATUS_SOURCE: null,
      EST_STATUS_CATEGORY: i % 5 === 0 ? 'Closed' : null, EST_STATUS_CATEGORY_SOURCE: null,
      LEGAL_TYPE: pick(LEGAL_TYPES, i), LEGAL_TYPE_SOURCE: null,
      SECTOR_ID: pick(SECTORS, i), SECTOR_ID_SOURCE: null,
      ISIC_CODE: null, ISIC_CODE_SOURCE: null,
      MAIN_BRANCH_FLG: i % 3 === 0 ? 'MAIN' : 'BRANCH', MAIN_BRANCH_FLG_SOURCE: null,
      MAIN_BRANCH_SBR_ID: null, MAIN_BRANCH_SBR_ID_SOURCE: null,
      HOLDING_COMPANY_FLG: null, HOLDING_COMPANY_FLG_SOURCE: null,
      EMPLOYMENT_COUNT: 5 + (i % 40), EMPLOYMENT_COUNT_SOURCE: null,
      CR_ISSUE_DATE: null, CR_EXPIRY_DATE: null, CR_CANCEL_DATE: null,
      CP_ISSUE_DATE: null, CP_END_DATE: null, CP_CANCEL_DATE: null,
      REG_DATE: null, REG_EXPIRY_DATE: null, REG_CANCEL_DATE: null,
      VALID_FROM: '2026-06-07T00:00:00.000Z', VALID_TO: null,
    };
  });
}

export function generateMockEnterprises(count: number): SbrEnterprise[] {
  return Array.from({ length: count }, (_, i) => {
    const name = companyName(i);
    return {
      ID: i + 1, ENTERPRISE_ID: 9001 + i, MAIN_ESTABLISHMENT_SBR_ID: 10001 + i,
      NAME_ARA: null, NAME_ARA_SOURCE: null,
      NAME_ENU: name, NAME_ENU_SOURCE: 'MOCI',
      TRADE_NAME_ARA: null, TRADE_NAME_ARA_SOURCE: null, TRADE_NAME_ENU: null, TRADE_NAME_ENU_SOURCE: null,
      STATUS: i % 4 === 0 ? 'Inactive' : 'Active', SECTOR_ID: pick(SECTORS, i), SECTOR_ID_SOURCE: null,
      HOLDING_COMPANY_FLG: null, HOLDING_COMPANY_FLG_SOURCE: null,
      ISIC_CODE: null, ISIC_CODE_SOURCE: null,
      EMPLOYMENT_COUNT: null, ANNUAL_TURNOVER: null, FOREIGN_OWNERSHIP_PCT: null,
      FOREIGN_CONTROLLED_FLG: null, MULTINATIONAL_GROUP_FLG: null, PARENT_ENTITY_COUNTRY: null,
      ECON_ACTIVITY_START_DATE: null, ECON_ACTIVITY_START_DATE_SOURCE: null,
      ENTERPRISE_GROUP_ID: null, MANUAL_OVERRIDE_FLAG: null,
      VALID_FROM: '2026-06-07T00:00:00.000Z', VALID_TO: null,
      CREATED_AT: null, UPDATED_AT: null,
      MAIN_CR: String(10000 + i * 10), LEGAL_TYPE: pick(LEGAL_TYPES, i),
      ESTABLISHMENT_COUNT: 1 + (i % 3),
    };
  });
}

export function generateMockContacts(count: number, maxSbrId: number): SbrContact[] {
  return Array.from({ length: count }, (_, i) => ({
    ID: i + 1, SBR_ID: 1 + (i % maxSbrId),
    CONTACT_NAME: i % 4 === 0 ? `Contact ${i + 1}` : null,
    PHONE: `4400${1000 + i}`, MOBILE: i % 3 === 0 ? `5500${1000 + i}` : null,
    EMAIL: `contact-${1000 + i}@example.qa`, FAX: null,
    PO_BOX: i % 5 === 0 ? String(20000 + i) : null,
    WEBSITE: i % 6 === 0 ? `www.example-${i}.qa` : null,
    ROLE: i % 3 === 0 ? 'Owner' : i % 3 === 1 ? 'Manager' : null,
    SOURCE_CODE: pick(SOURCE_CODES, i), PRIORITY: 1,
    VALID_FROM: '2026-06-02T00:00:00.000Z', VALID_TO: null,
  }));
}

export function generateMockAddresses(count: number, maxSbrId: number): SbrAddress[] {
  return Array.from({ length: count }, (_, i) => ({
    ID: i + 1, SBR_ID: 1 + (i % maxSbrId),
    MUNICIPALITY_ID: pick(ZONES, i), ZONE: String(10 + (i % 60)),
    STREET: String(100 + i * 5), BUILDING_NO: String(1 + (i % 40)),
    UNIT_NO: i % 4 === 0 ? String(1 + (i % 5)) : null,
    FLOOR_NO: i % 3 === 0 ? String(1 + (i % 4)) : null,
    QARS: i % 2 === 0 ? `${4200000000 + i}` : null,
    ELECTRICITY_NO: String(12300 + i),
    LATITUDE: i % 2 === 0 ? (25.1 + i * 0.001).toFixed(3) : null,
    LONGITUDE: i % 2 === 0 ? (51.4 + i * 0.001).toFixed(3) : null,
    SOURCE_CODE: pick(SOURCE_CODES, i), PRIORITY: 1,
    VALID_FROM: '2026-06-02T00:00:00.000Z', VALID_TO: null,
  }));
}

function buildSnapshot(
  id: number, name: string, description: string, frozenAt: string, frozenBy: string,
  counts: { establishments: number; enterprises: number; contacts: number; addresses: number },
): Snapshot {
  return {
    ID: id, NAME: name, DESCRIPTION: description, FROZEN_AT: frozenAt, FROZEN_BY: frozenBy,
    establishments: generateMockEstablishments(counts.establishments, 10),
    enterprises: generateMockEnterprises(counts.enterprises),
    contacts: generateMockContacts(counts.contacts, counts.establishments),
    addresses: generateMockAddresses(counts.addresses, counts.establishments),
  };
}

// Seed data — mirrors the point-in-time frames the DB engineer's design targets.
export const MOCK_SNAPSHOTS: Snapshot[] = [
  buildSnapshot(4, '2025 Annual Business Register', 'Year-end frozen frame for the 2025 statistical business register.', '2025-12-31T00:00:00.000Z', 'admin@sbr.com', { establishments: 38, enterprises: 7, contacts: 25, addresses: 16 }),
  buildSnapshot(3, 'Q1 2026 Sampling Frame', 'Population frame for the Q1 2026 quarterly business survey.', '2026-03-31T00:00:00.000Z', 'analyst@npc.qa', { establishments: 41, enterprises: 8, contacts: 28, addresses: 18 }),
  buildSnapshot(2, 'May 2026 Economic Census Frame', 'Frame snapshot supporting the May 2026 economic census.', '2026-05-15T00:00:00.000Z', 'admin@sbr.com', { establishments: 44, enterprises: 9, contacts: 30, addresses: 19 }),
];

// Current "live" core-table counts — shown on the Create Snapshot page and used for
// whatever a user freezes next. Same source data the seeded snapshots above already used.
export const LIVE_COUNTS = { establishments: 44, enterprises: 9, contacts: 30, addresses: 19 };
