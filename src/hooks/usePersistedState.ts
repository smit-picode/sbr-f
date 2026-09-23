import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';

// Drop-in replacement for useState that survives the unmount/remount a list page goes through
// when a row navigates to its own detail route and the user comes back — a plain useState resets
// to its default the moment the component unmounts, with nothing left to restore from. Restoring
// happens via this lazy initializer (not a mount effect) so the value is correct on the very
// first render; persisting happens inside the returned setter itself (not a separate effect
// watching the state) so there is no ordering race between "restore" and "persist" to lose to.
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  computeOverride?: () => T | undefined
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    const override = computeOverride?.();
    if (override !== undefined) return override;
    try {
      const saved = sessionStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch {
      // Corrupt or inaccessible sessionStorage falls back to the default — never blocks the page.
    }
    return defaultValue;
  });

  const setPersisted = useCallback<Dispatch<SetStateAction<T>>>((update) => {
    setValue((prev) => {
      const next = typeof update === 'function' ? (update as (prev: T) => T)(prev) : update;
      try {
        sessionStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Ignore — e.g. private browsing with storage blocked.
      }
      return next;
    });
  }, [key]);

  return [value, setPersisted];
}
