'use client';

import { skipToken } from '@reduxjs/toolkit/query';
import type { AnalysisRequest, AnalysisResolvedQuery, AnalysisResult, AnalysisRecordsResult, AnalysisResultState } from '@/types';
import { store } from '@/store';
import { ANALYSIS_EXPORT_CONCURRENCY, ANALYSIS_RECORDS_MAX_PAGE_SIZE } from '../constants';
import { analysisApi, useRunAnalysisQueryQuery } from './analysisApi';

// Imperative query for exports; shares RTK Query's cache with blocks already on screen.
export async function runAnalysis(req: AnalysisRequest): Promise<AnalysisResult> {
  const sub = store.dispatch(analysisApi.endpoints.runAnalysisQuery.initiate(req));
  try {
    const res = await sub.unwrap();
    if (!res.data) throw new Error('Empty analysis result');
    return res.data;
  } finally {
    sub.unsubscribe();
  }
}

// The API pages 100 records at a time, so an extract fetches a few pages at once up to the cap.
export async function fetchRecordExtract(
  query: AnalysisResolvedQuery,
  columns: string[],
  cap: number,
  onProgress?: (loaded: number, total: number) => void,
): Promise<{ rows: Record<string, unknown>[]; total: number }> {
  const pageSize = ANALYSIS_RECORDS_MAX_PAGE_SIZE;
  const page = (n: number) =>
    runAnalysis({ kind: 'records', query: { ...query, columns }, page: n, pageSize, sortBy: null, sortDir: 'asc' }) as Promise<AnalysisRecordsResult>;

  const first = await page(1);
  const wanted = Math.min(first.total, cap);
  const pages = Math.ceil(wanted / pageSize);
  const byPage: Record<string, unknown>[][] = [first.rows];
  onProgress?.(first.rows.length, wanted);

  let next = 2;
  let loaded = first.rows.length;
  const worker = async () => {
    while (next <= pages) {
      const n = next++;
      const r = await page(n);
      byPage[n - 1] = r.rows;
      loaded += r.rows.length;
      onProgress?.(Math.min(loaded, wanted), wanted);
    }
  };
  await Promise.all(Array.from({ length: Math.min(ANALYSIS_EXPORT_CONCURRENCY, Math.max(0, pages - 1)) }, worker));
  return { rows: byPage.flat().slice(0, wanted), total: first.total };
}

// Keeps the previous result while a changed request loads, so blocks never flash a skeleton.
export function useAnalysisResult<T extends AnalysisResult>(req: AnalysisRequest | null): AnalysisResultState<T> {
  const { data, isLoading, isFetching, isError } = useRunAnalysisQueryQuery(req ?? skipToken, {
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });
  return { data: (req ? data?.data : undefined) as T | undefined, isLoading, isFetching, isError };
}
