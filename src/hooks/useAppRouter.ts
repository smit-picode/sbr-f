'use client';

import { useMemo } from 'react';
import { useRouter as useNextRouter } from 'next/navigation';
import { isNavigationTo, navigationProgress } from '@/utils/navigationProgress';

// Drop-in for next/navigation's useRouter that also starts the global navigation progress bar.
export function useRouter(): ReturnType<typeof useNextRouter> {
  const router = useNextRouter();
  return useMemo(() => ({
    ...router,
    push: (href, options) => {
      if (isNavigationTo(href)) navigationProgress.start();
      router.push(href, options);
    },
    replace: (href, options) => {
      if (isNavigationTo(href)) navigationProgress.start();
      router.replace(href, options);
    },
    back: () => {
      navigationProgress.start();
      router.back();
    },
    forward: router.forward,
    refresh: router.refresh,
    prefetch: router.prefetch,
  }), [router]);
}
