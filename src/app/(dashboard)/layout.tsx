'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAppDispatch } from '@/hooks';
import { hydrateAuth, setPermissions } from '@/features/auth/authSlice';
import { useGetMyPermissionsQuery } from '@/features/auth/api/authApi';

function PermissionLoader() {
  const dispatch = useAppDispatch();
  const { data } = useGetMyPermissionsQuery();

  useEffect(() => {
    if (data?.data) {
      dispatch(setPermissions(data.data));
    }
  }, [data, dispatch]);

  return null;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('sbr_token');
    if (!token) {
      router.replace('/login');
      return;
    }
    dispatch(hydrateAuth());
    setReady(true);
  }, [dispatch, router]);

  // Shown only for the instant it takes to read the token and hydrate auth, before the real
  // Sidebar/PageHeader mount — mirrors that real shell (same sidebar gradient, dark banner
  // in place of PageHeader, white cards) instead of generic gray bars, so this doesn't flash
  // as an off-theme placeholder on every hard refresh/direct-link load.
  if (!ready) return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F7F8FA' }}>
      <div
        className="w-[236px] shrink-0"
        style={{ background: 'linear-gradient(180deg, #87795D 0%, #87795D 42%, #A29374 68%, #C0AC86 100%)' }}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-[58px] bg-white border-b border-slate-200 shrink-0" />
        <div className="flex-1 overflow-hidden p-6 space-y-4">
          <div className="shimmer shimmer-dark min-h-[172px] w-full rounded-3xl" />
          <div className="flex flex-wrap gap-x-8 gap-y-3 rounded-lg bg-white px-5 py-4 shadow-card">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="h-8 w-8 shimmer rounded-lg" />
                <div className="space-y-1.5">
                  <div className="h-2.5 w-16 shimmer rounded" />
                  <div className="h-3.5 w-24 shimmer rounded" />
                </div>
              </div>
            ))}
          </div>
          <div className="h-64 w-full shimmer rounded-lg" />
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <PermissionLoader />
      {children}
    </DashboardLayout>
  );
}
