'use client';

import type { AnalysisFrame } from '@/types';
import { useGetAnalysisFramesQuery } from '../api/analysisApi';
import { getAnalysisFrames, setAnalysisFrames } from '../utils/frames';

// Frames rarely change within a session, so this does not refetch on every mount or focus.
export function useAnalysisFrames(options?: { skip?: boolean }): { frames: AnalysisFrame[]; isLoading: boolean } {
  const { data, isLoading } = useGetAnalysisFramesQuery(undefined, { refetchOnMountOrArgChange: false, refetchOnFocus: false, skip: options?.skip });
  if (data?.data) setAnalysisFrames(data.data);
  return { frames: getAnalysisFrames(), isLoading };
}
