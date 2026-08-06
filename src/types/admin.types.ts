export interface SbrPermission {
  ID: number;
  PERMISSION_NAME: string;
  CREATED_AT: string;
  UPDATED_AT: string;
}

// A permission is simply granted or not — no view/edit flags
export type RolePermissionAssignment = number; // permissionId

export interface SbrRole {
  ID: number;
  ROLE_NAME: string;
  // true = assignments may carry a regulator scope; false = always global
  IS_SCOPED?: boolean;
  // Number of distinct users currently assigned this role (computed by the list endpoint)
  USER_COUNT?: number;
  CREATED_AT: string;
  UPDATED_AT: string;
}

export interface SbrRoleWithPermissions extends SbrRole {
  permissions?: SbrPermission[];
}

export interface UserRoleAssignment {
  ID: number;
  ROLE_ID: number;
  SCOPE: string;
  EXPIRES_AT: string | null;
  role?: { ID: number; ROLE_NAME: string; IS_SCOPED: boolean };
}

// Payload shape for assigning a role when creating/updating a user
export interface UserRoleInput {
  ROLE_ID: number;
  SCOPE?: string;
  EXPIRES_AT?: string | null;
}

export interface RegulatorScope {
  ID: number;
  CODE: string;
  NAME: string;
}

export interface SbrUser {
  ID: number;
  NAME: string;
  EMAIL: string;
  IS_ACTIVE: boolean;
  roleAssignments?: UserRoleAssignment[];
  CREATED_AT: string;
  UPDATED_AT: string;
}

export interface AdminPermissionFilters {
  page?: number;
  limit?: number;
  search?: string;
}

export interface AdminRoleFilters {
  page?: number;
  limit?: number;
  search?: string;
  // Server-side sort — sortBy must be one of ROLES_SORTABLE_COLUMNS (matches the
  // backend allowlist in src/utils/enums.ts)
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AdminUserFilters {
  page?: number;
  limit?: number;
  search?: string;
  // Narrows the list to users holding this role (SBR_ROLE.ID)
  roleId?: number;
  // Narrows the list by account status — must match USER_STATUS_FILTER in the backend enums
  status?: string;
  // Server-side sort — sortBy must be one of USERS_SORTABLE_COLUMNS (matches the
  // backend allowlist in src/utils/enums.ts)
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
