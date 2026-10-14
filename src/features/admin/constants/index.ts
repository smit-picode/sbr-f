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

export const ALL_ROLES_VALUE: string = '__all__';
export const ALL_STATUS_VALUE: string = '__all__';

export const USER_STATUS_FILTER_OPTIONS: { value: string; i18nKey: string; label: string }[] = [
  { value: 'active',   i18nKey: 'admin.users.statusActive',   label: 'Active'   },
  { value: 'inactive', i18nKey: 'admin.users.statusLocked',   label: 'Locked'   },
];

export const USERS_SORTABLE_COLUMNS: string[] = ['NAME', 'ROLES', 'IS_ACTIVE', 'CREATED_AT'];

export const GLOBAL_SCOPE_VALUE: string = 'GLOBAL';

export const NO_SCOPE_VALUE: string = '__none__';

export const ROLE_NO_CATEGORY_VALUE: string = '__none__';

export const REGULATOR_SCOPE_OPTIONS: string[] = ['MOCI', 'QFC', 'QFZ', 'QSTP', 'GTA', 'KRMA'];
// System accounts (integration API). Token lifetime bounds mirror SBR_SYSTEM_ACCOUNT_API.
export const SYSTEM_ACCOUNTS_PERMISSION: string = 'admin_panel.system_accounts.manage';
export const SYSTEM_ACCOUNT_DEFAULT_TTL_MINUTES: number = 30;
export const SYSTEM_ACCOUNT_MIN_TTL_MINUTES: number = 5;
export const SYSTEM_ACCOUNT_MAX_TTL_MINUTES: number = 240;
export const SYSTEM_ACCOUNT_SECRET_DEFAULT_MONTHS: number = 12;
export const SYSTEM_ACCOUNT_MAX_LIVE_SECRETS: number = 2;
export const SYSTEM_ACCOUNT_STATUS_VALUES = { active: 'Y', inactive: 'N' } as const;
