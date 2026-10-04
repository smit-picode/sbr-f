'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { isNavigationTo, navigationProgress } from '@/utils/navigationProgress';

const TRICKLE_MS = 180;
const SAFETY_TIMEOUT_MS = 12000;
const FADE_MS = 260;

// Thin top bar: starts on any navigation, trickles towards 90%, completes when the URL changes.
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const timers = useRef<{ trickle?: ReturnType<typeof setInterval>; safety?: ReturnType<typeof setTimeout>; fade?: ReturnType<typeof setTimeout> }>({});

  useEffect(() => {
    const clear = () => {
      clearInterval(timers.current.trickle);
      clearTimeout(timers.current.safety);
      clearTimeout(timers.current.fade);
    };
    const unsubscribe = navigationProgress.subscribe((active) => {
      clear();
      if (active) {
        setVisible(true);
        setWidth(8);
        timers.current.trickle = setInterval(() => setWidth((w) => (w < 90 ? w + (90 - w) * 0.12 : w)), TRICKLE_MS);
        timers.current.safety = setTimeout(() => navigationProgress.done(), SAFETY_TIMEOUT_MS);
      } else {
        setWidth(100);
        timers.current.fade = setTimeout(() => { setVisible(false); setWidth(0); }, FADE_MS);
      }
    });

    // Plain <a>/<Link> clicks never go through useRouter, so catch them here.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      if (isNavigationTo(a.href)) navigationProgress.start();
    };
    const onPopState = () => navigationProgress.start();
    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', onPopState);
    return () => {
      clear();
      unsubscribe();
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  // The new route has rendered once the URL it reports has changed.
  useEffect(() => {
    if (navigationProgress.isActive()) navigationProgress.done();
  }, [pathname, searchParams]);

  if (!visible) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[120] h-[3px]" aria-hidden>
      <div
        className="h-full bg-adaam shadow-[0_0_10px_var(--color-adaam)] transition-[width,opacity] ease-out"
        style={{ width: `${width}%`, opacity: width >= 100 ? 0 : 1, transitionDuration: width >= 100 ? `${FADE_MS}ms` : `${TRICKLE_MS}ms` }}
      />
    </div>
  );
}
