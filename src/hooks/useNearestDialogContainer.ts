import { useEffect, useRef, useState } from 'react';

// Finds the nearest ancestor Dialog's content node for a Popover to portal into
export function useNearestDialogContainer<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setContainer(ref.current?.closest<HTMLElement>('[role="dialog"]') ?? null);
  }, []);

  return { ref, container };
}
