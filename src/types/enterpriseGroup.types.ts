export interface SbrEnterpriseGroup {
  ID:                       number;
  ENTERPRISE_GROUP_ID:      string;
  GROUP_HEAD_ENTERPRISE_ID: number | null;
  NAME_ENU:                 string | null;
  NAME_ARA:                 string | null;
  TRADE_NAME_ENU:           string | null;
  TRADE_NAME_ARA:           string | null;
  RESIDENT_HEAD_OFFICE_FLG: string | null;
  UCI_NAME:                 string | null;
  UCI_TYPE:                 string | null;
  UCI_COUNTRY:              string | null;
  UCI_IDENTIFIER:           string | null;
  FOREIGN_CONTROLLED_GROUP_FLG: string | null;
  MULTINATIONAL_GROUP_FLG:  string | null;
  PRINCIPAL_ISIC_2DIGIT:    string | null;
  HOLDING_COMPANY_FLG:      string | null;
  STATUS:                   string | null;
  GROUP_START_DATE:         string | null;
  TOTAL_EMPLOYEES:          number | null;
  TOTAL_TURNOVER:           number | null;
  GROUP_DATA_SOURCES:       string | null;
  CREATED_AT:               string | null;
  UPDATED_AT:               string | null;
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
  sortBy?:        string;
  sortOrder?:     'asc' | 'desc';
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
