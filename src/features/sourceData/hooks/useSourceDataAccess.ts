import { useAppSelector } from '@/hooks';
import { SOURCE_VIEW_DATA_PERMISSION } from '../constants';

// Whether the user may open the raw source tables, on top of seeing the catalog.
export function useSourceDataAccess(): boolean {
  const user = useAppSelector((s) => s.auth.user);
  const permissions = useAppSelector((s) => s.auth.permissions);
  if (user?.role?.toUpperCase() === 'SUPER_ADMIN') return true;
  return permissions.some((p) => p.permissionName?.toLowerCase() === SOURCE_VIEW_DATA_PERMISSION);
}
