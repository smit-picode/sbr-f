export const ADMIN_FIELD_LABELS: Record<string, string> = {
  PERMISSION_NAME: 'Permission Name',
  ROLE_NAME: 'Role Name',
  NAME: 'User Name',
  EMAIL: 'Email Address',
  PASSWORD: 'Password',
  ROLE_ID: 'Role',
};

export const ADMIN_MAX_LENGTHS: Record<string, number> = {
  PERMISSION_NAME: 200,
  ROLE_NAME: 100,
  NAME: 200,
  EMAIL: 254,
  PASSWORD: 100,
};

export const ADMIN_DEFAULT_FILTERS: { page: number; limit: number; search: string } = {
  page: 1,
  limit: 20,
  search: '',
};

// Select sentinel for "No scope (all regulators)" — maps to the backend's GLOBAL scope
export const NO_SCOPE_VALUE: string = '__none__';

// Backend sentinel stored for unscoped role assignments
export const GLOBAL_SCOPE_VALUE: string = 'GLOBAL';
