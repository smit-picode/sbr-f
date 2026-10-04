'use client';

import { useEffect, useRef, useState } from 'react';
import type { AnalysisRequest, AnalysisResolvedQuery, AnalysisResult } from '@/types';
import type { AnalysisWorkerMessage, AnalysisWorkerTask } from '../engine/analysis.worker';

// Dummy-phase stand-in for `POST /analysis/query` — replace this file with the RTK Query endpoint.

const CACHE_LIMIT = 300;
const cache = new Map<string, AnalysisResult>();
const inflight = new Map<string, Promise<AnalysisResult>>();

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL('../engine/analysis.worker.ts', import.meta.url));
  worker.onmessage = (e: MessageEvent<{ id: number; result?: unknown; error?: string }>) => {
    const p = pending.get(e.data.id);
    if (!p) return;
    pending.delete(e.data.id);
    if (e.data.error) p.reject(new Error(e.data.error));
    else p.resolve(e.data.result);
  };
  worker.onerror = (e) => {
    for (const p of pending.values()) p.reject(new Error(e.message || 'Analysis worker failed'));
    pending.clear();
    worker?.terminate();
    worker = null;
  };
  return worker;
}

function post<T>(task: AnalysisWorkerTask): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
    const message: AnalysisWorkerMessage = { id, task };
    getWorker().postMessage(message);
  });
}

export function requestKey(req: AnalysisRequest): string {
  return JSON.stringify(req);
}

// Identical requests share one computation (several blocks often ask for the same data).
export function runAnalysis(req: AnalysisRequest): Promise<AnalysisResult> {
  const key = requestKey(req);
  const hit = cache.get(key);
  if (hit) return Promise.resolve(hit);
  const running = inflight.get(key);
  if (running) return running;
  const p = post<AnalysisResult>({ kind: 'query', request: req })
    .then((result) => {
      cache.set(key, result);
      if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
      return result;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

// Full, unpaged record extract for exports (capped) — the backend will stream this instead.
export function fetchRecordExtract(query: AnalysisResolvedQuery, columns: string[], cap: number) {
  return post<{ rows: Record<string, unknown>[]; total: number }>({ kind: 'export', query, columns, cap });
}

interface ResultState<T> {
  data: T | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
}

// RTK-Query-shaped hook that keeps previous data while refetching, so blocks never flash to a skeleton.
export function useAnalysisResult<T extends AnalysisResult>(req: AnalysisRequest | null): ResultState<T> {
  const key = req ? requestKey(req) : null;
  const [state, setState] = useState<ResultState<T>>(() => {
    const hit = key ? (cache.get(key) as T | undefined) : undefined;
    return { data: hit, isLoading: !!key && !hit, isFetching: !!key && !hit, isError: false };
  });
  const current = useRef(key);

  useEffect(() => {
    current.current = key;
    if (!req || !key) return;
    const hit = cache.get(key) as T | undefined;
    if (hit) {
      setState({ data: hit, isLoading: false, isFetching: false, isError: false });
      return;
    }
    setState((s) => ({ ...s, isLoading: !s.data, isFetching: true, isError: false }));
    runAnalysis(req)
      .then((r) => { if (current.current === key) setState({ data: r as T, isLoading: false, isFetching: false, isError: false }); })
      .catch(() => { if (current.current === key) setState((s) => ({ ...s, isLoading: false, isFetching: false, isError: true })); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}
