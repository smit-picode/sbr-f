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
  CREATED_AT: string;
  UPDATED_AT: string;
}

export interface SbrRoleWithPermissions extends SbrRole {
  permissions?: SbrPermission[];
}

export interface SbrUser {
  ID: number;
  NAME: string;
  EMAIL: string;
  ROLE_ID: number;
  role?: { ID?: number; ROLE_NAME: string };
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
}

export interface AdminUserFilters {
  page?: number;
  limit?: number;
  search?: string;
}
