import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';

// Drop-in useState that survives list-to-detail navigation by persisting to sessionStorage.
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
    }
    return defaultValue;
  });

  const setPersisted = useCallback<Dispatch<SetStateAction<T>>>((update) => {
    setValue((prev) => {
      const next = typeof update === 'function' ? (update as (prev: T) => T)(prev) : update;
      try {
        sessionStorage.setItem(key, JSON.stringify(next));
      } catch {
      }
      return next;
    });
  }, [key]);

  return [value, setPersisted];
}
