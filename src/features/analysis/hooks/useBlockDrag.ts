'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface BlockDragState {
  id: string;
  over: string | null;
  after: boolean;
  x: number;
  y: number;
}

const EDGE_PX = 80;
const SCROLL_STEP_PX = 14;

// Pointer events instead of HTML5 drag-and-drop, which never fires for touch or pen input.
export function useBlockDrag(onDrop: (id: string, overId: string, after: boolean) => void) {
  const [drag, setDrag] = useState<BlockDragState | null>(null);
  const current = useRef(drag);
  current.current = drag;
  const dropRef = useRef(onDrop);
  dropRef.current = onDrop;

  const start = useCallback((id: string, e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    setDrag({ id, over: null, after: false, x: e.clientX, y: e.clientY });
  }, []);

  const dragId = drag?.id;
  useEffect(() => {
    if (!dragId) return;
    const scroller = document.querySelector('main');
    let lastY = current.current?.y ?? window.innerHeight / 2;
    let raf = 0;

    const move = (e: PointerEvent) => {
      lastY = e.clientY;
      const slot = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest<HTMLElement>('[data-block-slot]');
      let over: string | null = null;
      let after = false;
      if (slot) {
        over = slot.dataset.blockSlot ?? null;
        const r = slot.getBoundingClientRect();
        after = slot.dataset.full === 'true'
          ? e.clientY > r.top + r.height / 2
          : (e.clientX > r.left + r.width / 2) !== (document.documentElement.dir === 'rtl');
      }
      setDrag((d) => (d ? { ...d, over, after, x: e.clientX, y: e.clientY } : d));
    };
    const autoScroll = () => {
      if (scroller && lastY < EDGE_PX) scroller.scrollBy(0, -SCROLL_STEP_PX);
      else if (scroller && lastY > window.innerHeight - EDGE_PX) scroller.scrollBy(0, SCROLL_STEP_PX);
      raf = requestAnimationFrame(autoScroll);
    };
    const end = () => {
      const d = current.current;
      if (d?.over && d.over !== d.id) dropRef.current(d.id, d.over, d.after);
      setDrag(null);
    };
    const cancel = () => setDrag(null);
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') cancel(); };

    raf = requestAnimationFrame(autoScroll);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('keydown', key);
    document.body.style.userSelect = 'none';
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('keydown', key);
      document.body.style.userSelect = '';
    };
  }, [dragId]);

  return { drag, start };
}
