'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// /admin now lives in the sidebar as three child tabs — land on Users and let
// AdminTabPage's permission fallback redirect to the first visible tab.
export function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/users');
  }, [router]);

  return null;
}
