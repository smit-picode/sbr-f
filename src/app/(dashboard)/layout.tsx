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

  if (!ready) return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F7F8FA' }}>
      <div
        className="w-[236px] shrink-0"
        style={{ background: 'linear-gradient(180deg, #6B1428 0%, #6B1428 42%, #7E1830 68%, #A71D3A 100%)' }}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-[58px] bg-white border-b border-slate-200 shrink-0" />
        <div className="flex-1 p-6 space-y-4">
          <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-96 bg-slate-100 rounded animate-pulse" />
          <div className="h-64 bg-white border border-slate-200 rounded-lg animate-pulse" />
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
