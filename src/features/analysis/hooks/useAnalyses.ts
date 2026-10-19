'use client';

import type { AnalysisAccess } from '@/types';
import { useAppSelector } from '@/hooks';
import { ANALYSIS_PERMISSIONS } from '../constants';

// Per analysis access comes from the server; the user's module permissions gate editing.
export function useAnalysisAccess(): AnalysisAccess {
  const user = useAppSelector((s) => s.auth.user);
  const permissions = useAppSelector((s) => s.auth.permissions);
  const isSuperAdmin = user?.role?.toUpperCase() === 'SUPER_ADMIN';
  const has = (key: string) => isSuperAdmin || permissions.some((p) => p.permissionName?.toLowerCase() === key);
  const canEditModule = has(ANALYSIS_PERMISSIONS.edit);

  return {
    email: user?.email ?? '',
    isSuperAdmin,
    canViewSection: has(ANALYSIS_PERMISSIONS.view),
    canCreate: canEditModule,
    canExportUnsuppressed: has(ANALYSIS_PERMISSIONS.exportUnsuppressed),
    canEditAnalysis: (a) => canEditModule && (a.access === 'owner' || a.access === 'edit'),
    canManage: (a) => a.access === 'owner' || isSuperAdmin,
    isOwner: (a) => a.access === 'owner',
    isSharedWithMe: (a) => a.access !== 'owner',
  };
}
