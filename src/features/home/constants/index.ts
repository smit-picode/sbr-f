export const HOME_EXECUTIVE_PERMISSION = 'home_executive.view';
export const HOME_REVIEWER_PERMISSION = 'home_reviewer.view';
export const HOME_STEWARD_PERMISSION = 'home_steward.view';

export type HomeScreen = 'executive' | 'reviewer' | 'steward';

// One per role (a radio choice in the role editor); a user holding several through different roles gets the first here.
export const HOME_SCREENS: { key: HomeScreen; permission: string; label: string }[] = [
  { key: 'executive', permission: HOME_EXECUTIVE_PERMISSION, label: 'Executive' },
  { key: 'reviewer', permission: HOME_REVIEWER_PERMISSION, label: 'Data reviewer' },
  { key: 'steward', permission: HOME_STEWARD_PERMISSION, label: 'Data steward' },
];

// Permissions that each open one Home dashboard variant. A role holding none of them gets no Home tab.
export const HOME_DASHBOARD_PERMISSIONS: string[] = HOME_SCREENS.map((s) => s.permission);

// EMPLOYMENT_SIZE_CATEGORY values from smallest to largest; anything else follows them, and no category comes last.
export const HOME_SIZE_CLASS_ORDER: string[] = ['micro', 'small', 'medium', 'large'];

// Rows the steward and reviewer homes list; the backend caps them at these numbers too.
export const HOME_RECENT_REQUESTS_LIMIT: number = 10;
export const HOME_OLDEST_REQUESTS_LIMIT: number = 8;

// Change request tables in the order the reviewer home lists them.
export const HOME_REQUEST_TABLES: string[] = ['SBR_ESTABLISHMENTS', 'SBR_ENTERPRISES', 'SBR_ENTERPRISE_GROUPS', 'SBR_CONTACTS', 'SBR_ADDRESSES'];
