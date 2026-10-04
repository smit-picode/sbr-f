import type { AnalysisRequest, AnalysisResolvedQuery } from '@/types';
import { exportRecords, runAnalysisRequest } from './query';

// Runs the dummy engine off the main thread so skeletons keep animating while the register is built.
export type AnalysisWorkerTask =
  | { kind: 'query'; request: AnalysisRequest }
  | { kind: 'export'; query: AnalysisResolvedQuery; columns: string[]; cap: number };

export interface AnalysisWorkerMessage {
  id: number;
  task: AnalysisWorkerTask;
}

const ctx = self as unknown as { onmessage: ((e: MessageEvent<AnalysisWorkerMessage>) => void) | null; postMessage: (m: unknown) => void };

ctx.onmessage = (e) => {
  const { id, task } = e.data;
  try {
    const result = task.kind === 'query' ? runAnalysisRequest(task.request) : exportRecords(task.query, task.columns, task.cap);
    ctx.postMessage({ id, result });
  } catch (err) {
    ctx.postMessage({ id, error: err instanceof Error ? err.message : String(err) });
  }
};
