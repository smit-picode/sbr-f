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
  limit: 10,
  search: '',
};

// Roles list is a master-detail sidebar, not a table, so sorting is offered through a
// dropdown instead of column headers. `value` is the dropdown key; sortBy/sortOrder are sent
// to the API. ROLES_SORT_DEFAULT sends neither, so the backend keeps its ID ASC ordering —
// the order the list has always rendered in.
export const ROLES_SORT_DEFAULT: string = 'default';

export const ROLES_SORT_OPTIONS: {
  value: string;
  i18nKey: string;
  label: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}[] = [
  { value: ROLES_SORT_DEFAULT, i18nKey: 'admin.roles.sortDefault',  label: 'Default'      },
  { value: 'name_asc',   i18nKey: 'admin.roles.sortNameAsc',  label: 'Name (A–Z)',  sortBy: 'ROLE_NAME',  sortOrder: 'asc'  },
  { value: 'name_desc',  i18nKey: 'admin.roles.sortNameDesc', label: 'Name (Z–A)',  sortBy: 'ROLE_NAME',  sortOrder: 'desc' },
  { value: 'newest',     i18nKey: 'admin.roles.sortNewest',   label: 'Newest first', sortBy: 'CREATED_AT', sortOrder: 'desc' },
  { value: 'oldest',     i18nKey: 'admin.roles.sortOldest',   label: 'Oldest first', sortBy: 'CREATED_AT', sortOrder: 'asc'  },
];

// Users list keeps its own defaults so the sort keys don't leak into the Roles/Permissions
// tabs, which share ADMIN_DEFAULT_FILTERS and have no sorting.
export const USERS_DEFAULT_FILTERS: {
  page: number;
  limit: number;
  search: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} = {
  page: 1,
  limit: 10,
  search: '',
};

// Select sentinels for the Users "Role" / "Status" filters meaning "no filter". A Radix
// SelectItem cannot have an empty-string value, hence a sentinel rather than ''.
export const ALL_ROLES_VALUE: string = '__all__';
export const ALL_STATUS_VALUE: string = '__all__';

// Values must match USER_STATUS_FILTER in the backend's src/utils/enums.ts
export const USER_STATUS_FILTER_OPTIONS: { value: string; i18nKey: string; label: string }[] = [
  { value: 'active',   i18nKey: 'admin.users.statusActive',   label: 'Active'   },
  { value: 'inactive', i18nKey: 'admin.users.statusInactive', label: 'Inactive' },
];

// Column ids the Users table exposes as sortable headers. A subset of the backend allowlist
// (USERS_SORTABLE_COLUMNS in src/utils/enums.ts, which also accepts EMAIL): the User column
// renders name + email in one cell and sorts by NAME, so EMAIL has no header of its own.
// ROLES is not sortable — roles come from a joined association, not a column on SBR_USER.
export const USERS_SORTABLE_COLUMNS: string[] = ['NAME', 'IS_ACTIVE', 'CREATED_AT'];

// Select sentinel for "No scope (all regulators)" — maps to the backend's GLOBAL scope
export const NO_SCOPE_VALUE: string = '__none__';

// Backend sentinel stored for unscoped role assignments
export const GLOBAL_SCOPE_VALUE: string = 'GLOBAL';
