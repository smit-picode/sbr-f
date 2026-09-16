import { useEffect, useRef, useState } from 'react';

/**
 * Finds the nearest ancestor Dialog's content node for a Popover to portal into (see
 * popover.tsx's `PopoverContentProps.container` note for why this is needed).
 *
 * Attach the returned `ref` to a DOM node that stays a genuine descendant of the Dialog before
 * the Popover opens — the trigger's wrapper div, not the Popover's own (portaled) content.
 * `container` starts `null` and resolves after mount (refs aren't attached during render), which
 * is fine: Radix's Portal only reads `container` at the moment it actually renders (the popover
 * opening), by which point this has already settled.
 */
export function useNearestDialogContainer<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setContainer(ref.current?.closest<HTMLElement>('[role="dialog"]') ?? null);
  }, []);

  return { ref, container };
}
