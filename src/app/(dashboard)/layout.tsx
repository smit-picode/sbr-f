'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAppDispatch } from '@/hooks';
import { hydrateAuth } from '@/features/auth/authSlice';

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
    <div className="flex flex-col h-screen" style={{ background: '#F5F5F5' }}>
      <div className="h-14 bg-white border-b border-slate-200 shrink-0" />
      <div className="h-14 shrink-0" style={{ background: 'linear-gradient(to right, #A71D3A 0%, #6B1428 40%, #1a3a52 100%)' }} />
      <div className="flex-1 p-6 space-y-4">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-96 bg-slate-100 rounded animate-pulse" />
        <div className="h-64 bg-white border border-slate-200 rounded-lg animate-pulse" />
      </div>
    </div>
  );

  return <DashboardLayout>{children}</DashboardLayout>;
}
