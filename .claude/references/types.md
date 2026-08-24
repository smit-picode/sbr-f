# TypeScript Types Reference

All types imported from `@/types` (barrel index at `src/types/index.ts`).

## ApiResponse<T>
```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  total?: number;   // present on paginated responses
  page?: number;
  limit?: number;
}
```

## SbrFrame
```typescript
interface SbrFrame {
  ID: number;
  SBR_ID: number;
  SOURCE_CODE: string | null;
  MOCI_ORG_ID: string | null;
  MOCI_CR_NUM: string | null;
  MOCI_CP_NUM: string | null;
  QFC_NUMBER: string | null;
  QFZ_SOURCE_ID: string | null;
  NAME_ARA: string | null;
  NAME_ENU: string | null;
  TRADE_NAME_ARA: string | null;
  TRADE_NAME_ENU: string | null;
  NPC_NAME_ARA: string | null;
  NPC_NAME_ENU: string | null;
  EST_STATUS: string | null;       // 'Active' | 'Inactive'
  LEGAL_TYPE: string | null;
  SECTOR_ID: string | null;        // 'Private' | 'Mixed-Private' | 'State Owned'
  ISIC_CODE: string | null;
  EMPLOYMENT_COUNT: number | null;
  MAIN_BRANCH_FLG: string | null;  // 'MAIN' | 'BRANCH'
  VALID_FROM: string | null;
  VALID_TO: string | null;
}

interface FrameFilters {
  page?: number; limit?: number;
  nameSearch?: string; estStatus?: string; sectorId?: string;
  isicCode?: string; sourceCode?: string; mainBranchFLG?: string;
}
```

## SbrContact
```typescript
interface SbrContact {
  ID: number;
  SBR_ID: number;
  PHONE: string | null;
  MOBILE: string | null;
  EMAIL: string | null;
  FAX: string | null;
  PO_BOX: string | null;
  WEBSITE: string | null;
  CONTACT_NAME: string | null;
  ROLE: string | null;             // 'Owner' | 'Manager'
  SOURCE_CODE: string;
  PRIORITY: number;
  VALID_FROM: string;
  VALID_TO: string | null;
}

interface ContactFilters {
  page?: number; limit?: number;
  sbrId?: number; role?: string; sourceCode?: string;
  phone?: string; email?: string; contactName?: string;
}
```

## SbrAddress
```typescript
interface SbrAddress {
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
  SOURCE_CODE: string;
  PRIORITY: number;
  VALID_FROM: string;
  VALID_TO: string | null;
}

interface AddressFilters {
  page?: number; limit?: number;
  sbrId?: number; sourceCode?: string; municipalityId?: string;
  zone?: string; street?: string; qars?: string;
}
```

## AuditLog
```typescript
interface AuditLog {
  ID: number;
  TABLE_NAME: string;    // 'SBR_FRAME' | 'SBR_CONTACTS' | 'SBR_ADDRESSES'
  RECORD_ID: number;
  CHANGED_FIELDS: string;   // JSON string: { FIELD: { old, new } }
  CHANGED_BY: string;
  CHANGED_AT: string;
}

interface AuditLogFilters {
  page?: number; limit?: number;
  tableName?: string; recordId?: number; changedBy?: string;
}
```
