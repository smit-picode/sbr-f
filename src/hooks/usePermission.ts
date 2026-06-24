import { useAppSelector } from '@/hooks';

// Returns what the current user can do for a given section.
// baseKey = section prefix e.g. 'establishments', 'contacts', 'addresses', 'audit_log', 'enterprises'
// Checks for <baseKey>.view, <baseKey>.edit, <baseKey>.search, <baseKey>.view_detail,
// <baseKey>.view_history in the user's permission list.
export function usePermission(baseKey: string) {
  const user = useAppSelector((s) => s.auth.user);
  const permissions = useAppSelector((s) => s.auth.permissions);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role?.toUpperCase() === 'SUPER_ADMIN';
  if (isSuperAdmin) return { canView: true, canEdit: true, canSearch: true, canViewDetail: true, canViewHistory: true };

  const has = (key: string) =>
    permissions.some((p) => p.permissionName?.toLowerCase() === key.toLowerCase());

  return {
    canView:        has(`${baseKey}.view`),
    canEdit:        has(`${baseKey}.edit`),
    canSearch:      has(`${baseKey}.search`),
    canViewDetail:  has(`${baseKey}.view_detail`),
    canViewHistory: has(`${baseKey}.view_history`),
  };
}
