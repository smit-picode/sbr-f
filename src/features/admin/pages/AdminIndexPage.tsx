'use client';
import { useEffect } from 'react';
import { useRouter } from '@/hooks/useAppRouter';

// /admin now lives in the sidebar as three child tabs
export function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/users');
  }, [router]);

  return null;
}
