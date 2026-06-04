export interface SbrAddress {
  ID: number;
  SBR_ID: number;
  MUNICIPALITY_ID: string | null;
  ZONE: string | null;
  STREET: string | null;
  BUILDING_NO: string | null;
  UNIT_NO: string | null;
  FLOOR_NO: string | null;
  QARS: string | null;
  ELECTRICITY_NO: string | null;
  LONGITUDE: string | null;
  LATITUDE: string | null;
  SOURCE_CODE: string | null;
  PRIORITY: number | null;
  VALID_FROM: string | null;
  VALID_TO: string | null;
}

export interface AddressFilters {
  page?: number;
  limit?: number;
  sbrId?: number;
  sourceCode?: string;
  municipalityId?: string;
  search?: string;
}
