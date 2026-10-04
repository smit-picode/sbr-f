import type { AnalysisBlock, AnalysisResolvedQuery } from '@/types';

export type AnalysisRenderMode = 'screen' | 'print' | 'present';

export interface AnalysisPointEvent {
  keys: (string | null)[];
  dims: string[];
  clientX: number;
  clientY: number;
  value: number | null;
}

export interface BlockViewProps {
  block: AnalysisBlock;
  query: AnalysisResolvedQuery;
  // Published view: confidential cells are suppressed instead of just flagged
  masked: boolean;
  height: number;
  mode: AnalysisRenderMode;
  onPoint?: (e: AnalysisPointEvent) => void;
}
