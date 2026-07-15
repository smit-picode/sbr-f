export interface SbrEnterpriseGroup {
  ID:                  number;
  GROUP_ID:            string;
  NAME_ENU:            string | null;
  NAME_ARA:            string | null;
  UCI_NAME:            string | null;
  UCI_TYPE:            string | null;
  UCI_COUNTRY:         string | null;
  UCI_ID:              string | null;
  ISIC_CODE:           string | null;
  ISIC_DESCRIPTION:    string | null;
  HOLDING_COMPANY_FLG: string | null;
  STATUS:              string | null;
  GROUP_START_DATE:    string | null;
  CREATED_AT:          string | null;
  UPDATED_AT:          string | null;
  // Derived
  TYPE:                string;
  ENTERPRISE_COUNT:    number;
  ESTABLISHMENT_COUNT: number;
  EMPLOYEE_COUNT:      number;
  SECTOR:              string | null;
  DATA_SOURCES:        string | null;
  HAS_PENDING_REQUEST?: boolean;
  PENDING_FIELDS?:      Record<string, number>;
}

export interface EnterpriseGroupFilters {
  page?:          number;
  limit?:         number;
  search?:        string;
  status?:        string;
  type?:          string;
  columnFilters?: string;
}

export interface EnterpriseGroupMember {
  ID:             number;
  ENTERPRISE_ID:  number;
  NAME_ENU:       string | null;
  NAME_ARA:       string | null;
  STATUS:         string | null;
  ISIC_CODE:      string | null;
  SECTOR_ID:      string | null;
  EMPLOYMENT_COUNT: number | null;
  ESTABLISHMENT_COUNT: number;
  ENTERPRISE_GROUP_ID: number | null;
  IS_GROUP_HEAD:  boolean;
}

export interface EnterpriseGroupControlStructure {
  uci: {
    name:    string | null;
    type:    string | null;
    country: string | null;
    id:      string | null;
  };
  group: {
    id:      number;
    groupId: string;
    name:    string | null;
  };
  members: {
    enterpriseId: number;
    name:         string | null;
    isHead:       boolean;
  }[];
}

export interface EnterpriseGroupDetail {
  group:            SbrEnterpriseGroup;
  memberEnterprises: EnterpriseGroupMember[];
  controlStructure: EnterpriseGroupControlStructure;
}
