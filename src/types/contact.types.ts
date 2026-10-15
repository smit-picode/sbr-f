export interface SbrContact {
  ID: number;
  SBR_ID: number;
  CONTACT_NAME: string | null;
  PHONE: string | null;
  MOBILE: string | null;
  EMAIL: string | null;
  FAX: string | null;
  PO_BOX: string | null;
  WEBSITE: string | null;
  ROLE: string | null;
  SOURCE_CODE: string | null;
  VALID_FROM: string | null;
  VALID_TO: string | null;
  HAS_PENDING_REQUEST?: boolean;
  PENDING_FIELDS?: Record<string, number>;
  // The contact's stable identity, shared by all its versions (ID changes on every edit).
  CONTACT_ID?: number | null;
  // The contact's open tags, comma-separated (display only).
  TAGS?: string | null;
}

export interface ContactFilters {
  page?: number;
  limit?: number;
  sbrId?: number;
  role?: string;
  sourceCode?: string;
  search?: string;
  // Only contacts carrying this tag
  tagCode?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// A contact typed in on an establishment's page, created immediately (no approval).
export interface CreateContactInput {
  sbrId: number;
  CONTACT_NAME?: string;
  ROLE?: string;
  PHONE?: string;
  MOBILE?: string;
  EMAIL?: string;
  FAX?: string;
  PO_BOX?: string;
  WEBSITE?: string;
  comment?: string;
}

export interface CreateContactResult {
  CONTACT_ID: number;
  ID: number | null;
  AUDIT_LOG_ID: number;
}
