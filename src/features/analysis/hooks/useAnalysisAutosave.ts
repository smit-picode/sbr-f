'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Analysis, AutosaveStatus } from '@/types';
import { useAppDispatch } from '@/hooks';
import { toDefinition, useUpdateAnalysisMutation } from '../api/analysisApi';
import { ANALYSIS_AUTOSAVE_MS } from '../constants';
import { markAnalysisSaved } from '../store/analysesSlice';

const snapshotOf = (a: Analysis) => JSON.stringify({ name: a.name, description: a.description, definition: toDefinition(a) });

// Saves the working copy after a pause in editing, one at a time so rowVersion stays fresh.
export function useAnalysisAutosave(analysis: Analysis | undefined, enabled: boolean, onConflict: () => void) {
  const dispatch = useAppDispatch();
  const [updateAnalysis] = useUpdateAnalysisMutation();
  const [status, setStatus] = useState<AutosaveStatus>('saved');
  const saved = useRef<{ id: string; snapshot: string } | null>(null);
  const latest = useRef(analysis);
  latest.current = analysis;
  const inFlight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failed = useRef<string | null>(null);

  // A freshly loaded (or reloaded) analysis is the saved baseline.
  const resetBaseline = useCallback((a: Analysis) => {
    saved.current = { id: a.id, snapshot: snapshotOf(a) };
    failed.current = null;
    setStatus('saved');
  }, []);

  const save = useCallback(async () => {
    const a = latest.current;
    if (!a || !enabled || inFlight.current || saved.current?.id !== a.id) return;
    const snapshot = snapshotOf(a);
    if (snapshot === saved.current.snapshot) { setStatus('saved'); return; }
    // The server requires a name; wait until the field is filled in again.
    if (!a.name.trim()) { setStatus('pending'); return; }
    inFlight.current = true;
    setStatus('saving');
    try {
      const res = await updateAnalysis({
        id: a.id,
        body: { name: a.name.trim(), description: a.description, definition: toDefinition(a), rowVersion: a.rowVersion },
      }).unwrap();
      if (res.data) dispatch(markAnalysisSaved({ id: a.id, rowVersion: res.data.rowVersion, updatedAt: res.data.updatedAt }));
      saved.current = { id: a.id, snapshot };
      inFlight.current = false;
      // Edits made while this request was out go in the next save.
      if (latest.current && snapshotOf(latest.current) !== snapshot) setStatus('pending');
      else setStatus('saved');
    } catch (err) {
      inFlight.current = false;
      if ((err as { status?: number })?.status === 409) {
        setStatus('conflict');
        onConflict();
      } else {
        failed.current = snapshot;
        setStatus('error');
      }
    }
  }, [enabled, updateAnalysis, dispatch, onConflict]);

  useEffect(() => {
    if (!analysis || !enabled || saved.current?.id !== analysis.id) return;
    const snapshot = snapshotOf(analysis);
    // A failed save is retried on the next edit, not in a loop.
    if (snapshot === saved.current.snapshot || snapshot === failed.current) return;
    setStatus((s) => (s === 'saving' ? s : 'pending'));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void save(); }, ANALYSIS_AUTOSAVE_MS);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [analysis, enabled, save, status]);

  // Leaving must not drop the last edits: save pending changes now and warn on tab close.
  useEffect(() => {
    const dirty = () => !!latest.current && saved.current?.id === latest.current.id && snapshotOf(latest.current) !== saved.current.snapshot;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (enabled && (dirty() || inFlight.current)) e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      if (enabled && dirty()) void save();
    };
  }, [enabled, save]);

  return { status, resetBaseline, saveNow: save };
}
