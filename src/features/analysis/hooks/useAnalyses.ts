'use client';

import { useEffect } from 'react';
import type { Analysis } from '@/types';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { ANALYSIS_PERMISSIONS, ANALYSIS_STORAGE_KEY } from '../constants';
import { buildSeedAnalyses, SEED_OWNER_ME } from '../mock/seedAnalyses';
import { hydrateAnalyses } from '../store/analysesSlice';

// Loads saved analyses once (localStorage, else the seeds) and writes every change back.
export function useAnalysesStore(): { items: Analysis[]; hydrated: boolean } {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.analyses.items);
  const hydrated = useAppSelector((s) => s.analyses.hydrated);
  const email = useAppSelector((s) => s.auth.user?.email) ?? 'you@example.org';

  useEffect(() => {
    if (hydrated) return;
    let saved: Analysis[] | null = null;
    try {
      const raw = localStorage.getItem(ANALYSIS_STORAGE_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch {
      saved = null;
    }
    const list = (saved ?? buildSeedAnalyses()).map((a) =>
      a.ownerEmail === SEED_OWNER_ME ? { ...a, ownerEmail: email, ownerName: nameFromEmail(email) } : a
    );
    dispatch(hydrateAnalyses(list));
  }, [hydrated, dispatch, email]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full or blocked — analyses stay in memory for this session.
    }
  }, [items, hydrated]);

  return { items, hydrated };
}

export function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? email;
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((p, i) => (i === 0 ? p.charAt(0).toUpperCase() + p.slice(1) : `${p.charAt(0).toUpperCase()}.`))
    .join(' ');
}

export interface AnalysisAccess {
  email: string;
  canCreate: boolean;
  canExportUnsuppressed: boolean;
  canEditAnalysis: (a: Analysis) => boolean;
  isOwner: (a: Analysis) => boolean;
  isSharedWithMe: (a: Analysis) => boolean;
  canView: (a: Analysis) => boolean;
  myRoles: { id: string; label: string }[];
}

const normalizeRole = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '_');

export function useAnalysisAccess(): AnalysisAccess {
  const user = useAppSelector((s) => s.auth.user);
  const permissions = useAppSelector((s) => s.auth.permissions);
  const roles = useAppSelector((s) => s.auth.roles);
  const email = user?.email ?? 'you@example.org';
  const isSuper = user?.role?.toUpperCase() === 'SUPER_ADMIN';
  const has = (key: string) => isSuper || permissions.some((p) => p.permissionName?.toLowerCase() === key);

  const isOwner = (a: Analysis) => a.ownerEmail === email;
  const roleKeys = new Set([...roles.flatMap((r) => [String(r.ID), normalizeRole(r.ROLE_NAME)]), ...(user?.role ? [normalizeRole(user.role)] : [])]);
  // A user share names this user; a role share reaches everyone holding that role.
  const matches = (s: Analysis['shares'][number]) =>
    s.kind === 'user' ? s.id.toLowerCase() === email.toLowerCase() : roleKeys.has(s.id) || roleKeys.has(normalizeRole(s.id)) || roleKeys.has(normalizeRole(s.label));
  const shareFor = (a: Analysis) => {
    const mine = a.shares.filter(matches);
    return mine.find((s) => s.access === 'edit') ?? mine[0];
  };

  return {
    email,
    canCreate: has(ANALYSIS_PERMISSIONS.edit),
    canExportUnsuppressed: has(ANALYSIS_PERMISSIONS.exportUnsuppressed),
    isOwner,
    isSharedWithMe: (a) => !isOwner(a) && !!shareFor(a),
    canView: (a) => isSuper || isOwner(a) || !!shareFor(a),
    canEditAnalysis: (a) => isSuper || isOwner(a) || shareFor(a)?.access === 'edit',
    myRoles: roles.map((r) => ({ id: String(r.ID), label: r.ROLE_NAME })),
  };
}
