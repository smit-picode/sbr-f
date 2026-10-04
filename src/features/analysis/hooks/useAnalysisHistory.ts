'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Analysis } from '@/types';
import { useAppDispatch } from '@/hooks';
import { upsertAnalysis } from '../store/analysesSlice';

const HISTORY_LIMIT = 100;
// Keystrokes on the same field within this window collapse into one undo step.
const COALESCE_MS = 900;

export function useAnalysisHistory(analysis: Analysis | undefined) {
  const dispatch = useAppDispatch();
  const past = useRef<Analysis[]>([]);
  const future = useRef<Analysis[]>([]);
  const last = useRef<{ key: string; at: number } | null>(null);
  const current = useRef(analysis);
  current.current = analysis;
  const [, force] = useState(0);

  useEffect(() => {
    past.current = [];
    future.current = [];
    last.current = null;
    force((n) => n + 1);
  }, [analysis?.id]);

  const commit = useCallback((next: Analysis, coalesceKey?: string) => {
    const prev = current.current;
    if (!prev) return;
    const now = Date.now();
    const coalesce = coalesceKey && last.current?.key === coalesceKey && now - last.current.at < COALESCE_MS;
    if (!coalesce) {
      past.current = [...past.current.slice(-HISTORY_LIMIT + 1), prev];
      future.current = [];
    }
    last.current = coalesceKey ? { key: coalesceKey, at: now } : null;
    dispatch(upsertAnalysis({ ...next, updatedAt: new Date().toISOString() }));
    force((n) => n + 1);
  }, [dispatch]);

  const undo = useCallback(() => {
    const prev = past.current[past.current.length - 1];
    const cur = current.current;
    if (!prev || !cur) return false;
    past.current = past.current.slice(0, -1);
    future.current = [cur, ...future.current];
    last.current = null;
    dispatch(upsertAnalysis(prev));
    force((n) => n + 1);
    return true;
  }, [dispatch]);

  const redo = useCallback(() => {
    const next = future.current[0];
    const cur = current.current;
    if (!next || !cur) return false;
    future.current = future.current.slice(1);
    past.current = [...past.current, cur];
    last.current = null;
    dispatch(upsertAnalysis(next));
    force((n) => n + 1);
    return true;
  }, [dispatch]);

  return { commit, undo, redo, canUndo: past.current.length > 0, canRedo: future.current.length > 0 };
}
