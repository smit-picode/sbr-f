import type { AnalysisFrame } from '@/types';

// Pure helpers need frames synchronously, so the API list is mirrored here.
let frames: AnalysisFrame[] = [{ id: 'live', label: 'Live frame', asOf: '', kind: 'live' }];
let chrono: string[] = ['live'];

export function setAnalysisFrames(list: AnalysisFrame[]): void {
  if (!list.length) return;
  frames = list;
  // Oldest frozen frame first, live last: the order of "__frame" stacks and default comparisons.
  chrono = [
    ...list.filter((f) => f.kind !== 'live').sort((a, b) => a.asOf.localeCompare(b.asOf) || Number(a.id) - Number(b.id)).map((f) => f.id),
    ...list.filter((f) => f.kind === 'live').map((f) => f.id),
  ];
}

export function getAnalysisFrames(): AnalysisFrame[] {
  return frames;
}

export function frameChrono(): string[] {
  return chrono;
}

export function frameOrder(a: string | null, b: string | null): number {
  return chrono.indexOf(a ?? '') - chrono.indexOf(b ?? '');
}

export function frameLabelOf(id: string): string | undefined {
  return frames.find((f) => f.id === id)?.label;
}

// The oldest frozen frame, the default baseline for comparisons; null while there are no snapshots.
export function oldestFrozenFrame(): string | null {
  return chrono.find((id) => id !== 'live') ?? null;
}
