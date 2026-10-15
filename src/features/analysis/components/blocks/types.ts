import type { AnalysisBlock, AnalysisResolvedQuery, AnalysisPointEvent, AnalysisRenderMode } from '@/types';

export interface BlockViewProps {
  block: AnalysisBlock;
  query: AnalysisResolvedQuery;
  masked: boolean;
  height: number;
  mode: AnalysisRenderMode;
  onPoint?: (e: AnalysisPointEvent) => void;
}
