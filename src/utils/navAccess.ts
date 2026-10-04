import { NAV_GROUPS, type NavGroup, type NavItem } from '@/constants/navigation';

export interface NavAccess {
  isSuperAdmin: boolean;
  permissionNames: string[];
}

export const hasNavPermission = (key: string, { permissionNames }: NavAccess): boolean =>
  permissionNames.some((name) => name?.toLowerCase() === key.toLowerCase());

export const hasAnyNavPermission = (keys: string[], access: NavAccess): boolean =>
  access.isSuperAdmin || keys.some((key) => hasNavPermission(key, access));

export const isNavItemVisible = (item: NavItem, access: NavAccess): boolean => {
  if (access.isSuperAdmin || item.permKey === '') return true;
  const keys = Array.isArray(item.permKey) ? item.permKey : [item.permKey];
  return keys.some((key) => hasNavPermission(key, access));
};

export const isNavGroupVisible = (group: NavGroup, access: NavAccess): boolean => {
  if (group.id === 'administration') {
    return access.isSuperAdmin || access.permissionNames.some((name) => name?.startsWith('admin_panel.'));
  }
  return group.items.some((item) => isNavItemVisible(item, access));
};

// First page the sidebar would show this user, so a user with no Home tab can still land somewhere usable.
export const getFirstAccessibleHref = (access: NavAccess, excludeHref?: string): string | null => {
  for (const group of NAV_GROUPS) {
    if (!isNavGroupVisible(group, access)) continue;
    const item = group.items.find((i) => i.href !== excludeHref && isNavItemVisible(i, access));
    if (item) return item.href;
  }
  return null;
};
