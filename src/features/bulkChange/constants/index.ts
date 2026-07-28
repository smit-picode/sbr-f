// Constants for the "New bulk update" wizard — table choices and their column dictionaries.
// No backend/API exists for this feature yet (pending DBA procedures); these mirror the
// fields already exposed by the Establishments/Contacts/Addresses features so validation
// messages and the downloadable template stay consistent with the rest of the app.

export type BulkChangeTableKey = 'Establishments' | 'Contacts' | 'Addresses';

export interface BulkChangeTableOption {
  key: BulkChangeTableKey;
  label: string;
  // Reuses the app-wide nav.* translations instead of duplicating the same three
  // table names under a new key — nav.establishments/contacts/addresses already exist.
  navKey: string;
  icon: 'Building2' | 'Users' | 'MapPin';
}

export const BULK_CHANGE_TABLES: BulkChangeTableOption[] = [
  { key: 'Establishments', label: 'Establishments', navKey: 'nav.establishments', icon: 'Building2' },
  { key: 'Contacts', label: 'Contacts', navKey: 'nav.contacts', icon: 'Users' },
  { key: 'Addresses', label: 'Addresses', navKey: 'nav.addresses', icon: 'MapPin' },
];

export interface BulkChangeDictionaryRow {
  excelHeader: string;
  attribute: string;
  type: string;
  required: boolean;
  allowedValues: string;
}

export const BULK_CHANGE_DICTIONARIES: Record<BulkChangeTableKey, BulkChangeDictionaryRow[]> = {
  Establishments: [
    { excelHeader: 'SBR_ID', attribute: 'Establishment ID', type: 'Integer', required: true, allowedValues: 'Must match an existing record' },
    { excelHeader: 'NAME_ENU', attribute: 'Name (English)', type: 'Text ≤ 500', required: false, allowedValues: 'Any text' },
    { excelHeader: 'EST_STATUS', attribute: 'Establishment status', type: 'Enum', required: false, allowedValues: 'Active · Inactive' },
    { excelHeader: 'SECTOR_ID', attribute: 'Sector', type: 'Enum', required: false, allowedValues: 'Private · Mixed-Private · Mixed-Government · Government' },
    { excelHeader: 'EMPLOYMENT_COUNT', attribute: 'Employees', type: 'Integer ≥ 0', required: false, allowedValues: '0 or greater' },
    { excelHeader: 'CR_EXPIRY_DATE', attribute: 'CR expiry date', type: 'Date', required: false, allowedValues: 'YYYY-MM-DD' },
  ],
  Contacts: [
    { excelHeader: 'SBR_ID', attribute: 'Establishment ID', type: 'Integer', required: true, allowedValues: 'Must match an existing record' },
    { excelHeader: 'CONTACT_NAME', attribute: 'Contact name', type: 'Text ≤ 500', required: false, allowedValues: 'Any text' },
    { excelHeader: 'ROLE', attribute: 'Role', type: 'Enum', required: false, allowedValues: 'Owner · Manager' },
    { excelHeader: 'PHONE', attribute: 'Phone', type: 'Text', required: false, allowedValues: 'Any text' },
    { excelHeader: 'MOBILE', attribute: 'Mobile', type: 'Text', required: false, allowedValues: 'Any text' },
    { excelHeader: 'EMAIL', attribute: 'Email', type: 'Text', required: false, allowedValues: 'Valid email address' },
    { excelHeader: 'WEBSITE', attribute: 'Website', type: 'Text', required: false, allowedValues: 'Any text' },
  ],
  Addresses: [
    { excelHeader: 'SBR_ID', attribute: 'Establishment ID', type: 'Integer', required: true, allowedValues: 'Must match an existing record' },
    { excelHeader: 'MUNICIPALITY_ID', attribute: 'Municipality', type: 'Text', required: false, allowedValues: 'Any text' },
    { excelHeader: 'ZONE', attribute: 'Zone', type: 'Text', required: false, allowedValues: 'Any text' },
    { excelHeader: 'STREET', attribute: 'Street', type: 'Text', required: false, allowedValues: 'Any text' },
    { excelHeader: 'BUILDING_NO', attribute: 'Building no.', type: 'Text', required: false, allowedValues: 'Any text' },
    { excelHeader: 'UNIT_NO', attribute: 'Unit no.', type: 'Text', required: false, allowedValues: 'Any text' },
  ],
};

// Sample "as-uploaded" rows shown in the Validate step — no backend exists yet to parse a
// real workbook, so each table shows a representative preview keyed off its own dictionary.
export const BULK_CHANGE_PREVIEW_ROWS: Record<BulkChangeTableKey, Array<Record<string, string | number>>> = {
  Establishments: [
    { SBR_ID: 47, NAME_ENU: 'acme trading & logistics co', EST_STATUS: 'Active', SECTOR_ID: 'Private', EMPLOYMENT_COUNT: 40, CR_EXPIRY_DATE: '2027-03-31' },
    { SBR_ID: 48, NAME_ENU: 'theta recycling co', EST_STATUS: 'Inactive', SECTOR_ID: 'Private', EMPLOYMENT_COUNT: 12, CR_EXPIRY_DATE: '2026-11-30' },
    { SBR_ID: 53, NAME_ENU: 'gamma logistics group', EST_STATUS: 'Active', SECTOR_ID: 'Mixed-Private', EMPLOYMENT_COUNT: 40, CR_EXPIRY_DATE: '2027-01-15' },
    { SBR_ID: 999999, NAME_ENU: 'unknown co', EST_STATUS: 'Active', SECTOR_ID: 'Private', EMPLOYMENT_COUNT: 5, CR_EXPIRY_DATE: '2026-09-01' },
  ],
  Contacts: [
    { SBR_ID: 47, CONTACT_NAME: 'Ali Hassan', ROLE: 'Owner', PHONE: '44123456', MOBILE: '55123456', EMAIL: 'ali.h@acme.qa', WEBSITE: 'acme.qa' },
    { SBR_ID: 48, CONTACT_NAME: 'Sara Ahmed', ROLE: 'Manager', PHONE: '44234567', MOBILE: '55234567', EMAIL: 'sara.a@theta.qa', WEBSITE: '' },
    { SBR_ID: 999999, CONTACT_NAME: 'Unknown Contact', ROLE: 'Manager', PHONE: '', MOBILE: '55345678', EMAIL: 'bad-email', WEBSITE: '' },
  ],
  Addresses: [
    { SBR_ID: 47, MUNICIPALITY_ID: 'Doha', ZONE: '25', STREET: 'Al Corniche', BUILDING_NO: '12', UNIT_NO: '3' },
    { SBR_ID: 48, MUNICIPALITY_ID: 'Al Rayyan', ZONE: '31', STREET: 'Al Wajba', BUILDING_NO: '5', UNIT_NO: '' },
    { SBR_ID: 999999, MUNICIPALITY_ID: 'Al Wakrah', ZONE: '', STREET: 'Main St', BUILDING_NO: '', UNIT_NO: '' },
  ],
};
