type Listener = (active: boolean) => void;

const listeners = new Set<Listener>();
let active = false;

function emit(next: boolean) {
  if (active === next) return;
  active = next;
  listeners.forEach((l) => l(next));
}

// App-wide "a page is on its way" signal, driven by useRouter (hooks/useAppRouter) and link clicks.
export const navigationProgress = {
  start: () => emit(true),
  done: () => emit(false),
  isActive: () => active,
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};

// True when `href` points somewhere other than the current page (so no progress bar for no-op navigations).
export function isNavigationTo(href: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const next = new URL(href, window.location.href);
    if (next.origin !== window.location.origin) return false;
    return next.pathname !== window.location.pathname || next.search !== window.location.search;
  } catch {
    return false;
  }
}
