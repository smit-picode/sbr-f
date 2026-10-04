import type { AnalysisFrame } from '@/types';

// Stand-in for the snapshots API, sized from the real extracts (109,682 → 110,307 → 112,384 → 115,186).
export const ANALYSIS_FRAMES: AnalysisFrame[] = [
  { id: 'live', label: 'Live frame', asOf: '2026-09-16', kind: 'live' },
  { id: 'f-2026-07', label: 'Jul 2026', asOf: '2026-07-20', kind: 'frozen' },
  { id: 'f-2026-05', label: 'May 2026', asOf: '2026-05-07', kind: 'frozen' },
  { id: 'f-2026-04', label: 'Apr 2026', asOf: '2026-04-06', kind: 'frozen' },
];

// Chronological order, oldest first — the index is the frame's position in the unit histories.
export const ANALYSIS_FRAME_CHRONO: string[] = ['f-2026-04', 'f-2026-05', 'f-2026-07', 'live'];

export function frameIndex(frameId: string): number {
  const i = ANALYSIS_FRAME_CHRONO.indexOf(frameId);
  return i === -1 ? ANALYSIS_FRAME_CHRONO.length - 1 : i;
}

export function frameLabel(frameId: string | null | undefined): string {
  return ANALYSIS_FRAMES.find((f) => f.id === frameId)?.label ?? 'Live frame';
}
