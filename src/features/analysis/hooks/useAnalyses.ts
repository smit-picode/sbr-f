'use client';

import type { Analysis } from '@/types';
import { useAppSelector } from '@/hooks';
import { ANALYSIS_PERMISSIONS } from '../constants';

export interface AnalysisAccess {
  email: string;
  isSuperAdmin: boolean;
  canViewSection: boolean;
  canCreate: boolean;
  canExportUnsuppressed: boolean;
  canEditAnalysis: (a: Analysis) => boolean;
  // Delete and re-share are the owner's (or a super admin's), as SBR_ANALYSIS_API enforces.
  canManage: (a: Analysis) => boolean;
  isOwner: (a: Analysis) => boolean;
  isSharedWithMe: (a: Analysis) => boolean;
}

// Per-analysis access comes from the server (`access`); the user's module permissions gate editing on top.
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
