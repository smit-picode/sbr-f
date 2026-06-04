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
  PRIORITY: number | null;
  VALID_FROM: string | null;
  VALID_TO: string | null;
}

export interface ContactFilters {
  page?: number;
  limit?: number;
  sbrId?: number;
  role?: string;
  sourceCode?: string;
  search?: string;
}
