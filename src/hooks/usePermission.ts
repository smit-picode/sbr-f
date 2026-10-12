import { useAppSelector } from '@/hooks';

// Returns the user's view/edit/search/detail/history rights for a section prefix.
export function usePermission(baseKey: string) {
  const user = useAppSelector((s) => s.auth.user);
  const permissions = useAppSelector((s) => s.auth.permissions);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role?.toUpperCase() === 'SUPER_ADMIN';
  if (isSuperAdmin) return { canView: true, canEdit: true, canCreate: true, canSearch: true, canViewDetail: true, canViewHistory: true, canApprove: true };

  const has = (key: string) =>
    permissions.some((p) => p.permissionName?.toLowerCase() === key.toLowerCase());

  return {
    canView:        has(`${baseKey}.view`),
    canEdit:        has(`${baseKey}.edit`),
    canCreate:      has(`${baseKey}.create`),
    canSearch:      has(`${baseKey}.search`),
    canViewDetail:  has(`${baseKey}.view_detail`),
    canViewHistory: has(`${baseKey}.view_history`),
    canApprove:     has(`${baseKey}.approve`),
  };
}
