export interface SbrPermission {
  ID: number;
  PERMISSION_NAME: string;
  CREATED_AT: string;
  UPDATED_AT: string;
}

// A permission is simply granted or not — no view/edit flags
export type RolePermissionAssignment = number;

export interface SbrRole {
  ID: number;
  ROLE_NAME: string;
  IS_SCOPED?: boolean;
  CATEGORY_ID?: number | null;
  CATEGORY?: string | null;
  CATEGORY_ORDER?: number | null;
  USER_COUNT?: number;
  CREATED_AT: string;
  UPDATED_AT: string;
}

export interface RoleCategory {
  ID: number;
  CODE: string;
  NAME_EN: string | null;
  NAME_AR: string | null;
  DISPLAY_ORDER: number | null;
}

export interface SbrRoleWithPermissions extends SbrRole {
  permissions?: SbrPermission[];
}

export interface UserRoleAssignment {
  ID: number;
  ROLE_ID: number;
  SCOPE: string | null;
  EXPIRES_AT: string | null;
  role?: { ID: number; ROLE_NAME: string; IS_SCOPED: boolean };
}

// Payload shape for assigning a role when creating/updating a user
export interface UserRoleInput {
  ROLE_ID: number;
  SCOPE?: string;
  EXPIRES_AT?: string | null;
}

export interface SbrUser {
  ID: number;
  NAME: string;
  EMAIL: string;
  IS_ACTIVE: boolean;
  DELETED_AT?: string | null;
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
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AdminUserFilters {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PermissionNode {
  key: string;
  label: string;
  children?: PermissionNode[];
}

export type AdminTab = 'permissions' | 'roles' | 'users' | 'system-accounts';

// ─── Tree helpers ────────────────────────────────────────────────────────────
export type PermissionTreeNode = { perm: SbrPermission | null; node: PermissionNode; children: PermissionTreeNode[] };

export type PermissionLeafEntry = { perm: SbrPermission; label: string; nodeKey: string };

export interface UsersColumnsOptions {
  t: (key: string, opts?: Record<string, unknown>) => string;
  canViewDetail: boolean;
  canEdit: boolean;
  isUpdating: boolean;
  onView: (user: SbrUser) => void;
  onEdit: (user: SbrUser) => void;
  onToggleLock: (user: SbrUser) => void;
  isSelf: (user: SbrUser) => boolean;
}

// roleId -> expiry date (yyyy-mm-dd, '' = never expires); a key present means the role is assigned
export type RoleSelection = Record<number, string>;
