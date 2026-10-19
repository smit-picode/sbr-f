import type { CreateContactInput } from './contact.types';

// Contact tags: a label a user puts on one contact, with no meaning attached by the register.

export interface ContactTag {
  ID: number;
  CODE: string;
  NAME_EN: string | null;
  NAME_AR: string | null;
  DESCRIPTION_EN: string | null;
  DESCRIPTION_AR: string | null;
  ONE_PER_ESTABLISHMENT: 'Y' | 'N';
  IS_ACTIVE: 'Y' | 'N';
  DISPLAY_ORDER: number | null;
  OPEN_TAGS: number;
}

export interface SaveContactTagInput {
  code: string;
  nameEn?: string | null;
  nameAr?: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  onePerEstablishment?: boolean;
  isActive?: boolean;
  displayOrder?: number | null;
}

// One open contact of an establishment, as GET /establishments/:sbrId/contact-tags returns it.
export interface EstablishmentContact {
  RECORD_ID: number;
  CONTACT_ID: number;
  SBR_ID: number;
  CONTACT_NAME: string | null;
  ROLE: string | null;
  PHONE: string | null;
  MOBILE: string | null;
  FAX: string | null;
  EMAIL: string | null;
  PO_BOX: string | null;
  WEBSITE: string | null;
  SOURCE_CODE: string | null;
  VALID_FROM: string | null;
  TAGS: string | null;
  TAG_COUNT: number;
  // The establishment's overall primary contact: most tags, ties by CONTACT_ID.
  IS_PRIMARY: boolean;
}

export interface EstablishmentContactTag {
  TAG_ROW_ID: number;
  TAG_CODE: string;
  TAG_NAME_EN: string | null;
  TAG_NAME_AR: string | null;
  ONE_PER_ESTABLISHMENT: 'Y' | 'N';
  CONTACT_ID: number;
  CONTACT_RECORD_ID: number;
  TAG_SOURCE_CODE: string;
  REASON: string | null;
  TAGGED_AT: string;
  TAGGED_BY: string | null;
  TAGGED_BY_EMAIL: string | null;
}

export interface EstablishmentContactsData {
  contacts: EstablishmentContact[];
  tags: EstablishmentContactTag[];
}

export interface TagContactResult {
  RESULT: 'TAGGED' | 'MOVED' | 'ALREADY';
  AUDIT_LOG_ID: number | null;
}

export interface BulkTagRow {
  rowNumber?: number;
  SBR_ID: number;
  TAG_CODE: string;
  CONTACT_ID?: number | null;
  EMAIL?: string | null;
  PHONE?: string | null;
  CONTACT_NAME?: string | null;
}

export interface BulkTagResultRow {
  rowNumber: number;
  SBR_ID: number;
  TAG_CODE: string;
  CONTACT_ID: number | null;
  EMAIL: string | null;
  // Dry run: TAG | CREATE_AND_TAG | ALREADY | ERROR; applied adds TAGGED, MOVED, CREATED_ forms.
  action: string;
  message: string | null;
}

export interface BulkTagResult {
  ok: boolean;
  dryRun: boolean;
  rows: BulkTagResultRow[];
}

// One tag version from the history endpoint, newest first; an open row is a tag currently on.
export interface ContactTagHistoryRow {
  TAG_ROW_ID: number;
  TAG_CODE: string;
  TAG_NAME_EN: string | null;
  TAG_NAME_AR: string | null;
  CONTACT_ID: number;
  TAG_SOURCE_CODE: string | null;
  REASON: string | null;
  VALID_FROM: string;
  VALID_TO: string | null;
  SCD2_NOTE: string | null;
  TAGGED_BY: string | null;
  TAGGED_BY_EMAIL: string | null;
}

// A contact typed in on an establishment's page: created at once as MANUAL with a CONTACT_ID.
export type AddContactField = Exclude<keyof CreateContactInput, 'sbrId' | 'comment'>;
