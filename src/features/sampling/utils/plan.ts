import type { SamplingAllocationEntry, SamplingSelectionGroup, SamplingStratum, SamplingPlan, Allocation, AllocationStratum, Precision } from '@/types';
import { allocate, precision, sizeForTargetCv } from './allocation';

// Per random group: allocation, precision and solved size; the backend keeps a copy (parity check).
export function planGroups(groups: Pick<SamplingSelectionGroup, 'method' | 'allocation'>[], rows: SamplingStratum[]): SamplingPlan {
  const allocations: Record<number, Allocation> = {};
  const precisions: Record<number, Precision> = {};
  const solved: Record<number, number | null> = {};
  const entries: SamplingAllocationEntry[] = [];
  groups.forEach((g, i) => {
    const own = rows.filter((r) => r.GROUP_NO === i + 1);
    if (g.method !== 'random') {
      own.forEach((r) => entries.push({ key: r.STRATUM_KEY, n: r.N, reserve: 0 }));
      return;
    }
    const st: AllocationStratum[] = own.map((r) => ({ key: r.STRATUM_KEY, N: r.N, mean: r.AUX_MEAN, sd: r.AUX_SD }));
    solved[i] = g.allocation.sizeMode === 'cv' && st.length ? sizeForTargetCv(st, g.allocation, g.allocation.targetCv / 100) : null;
    const size = g.allocation.sizeMode === 'cv' ? (solved[i] ?? st.reduce((a, s) => a + s.N, 0)) : g.allocation.sampleSize;
    allocations[i] = allocate(st, { ...g.allocation, sampleSize: size });
    precisions[i] = precision(st, allocations[i]);
    allocations[i].strata.filter((a) => a.n + a.reserve > 0).forEach((a) => entries.push({ key: a.key, n: a.n, reserve: a.reserve }));
  });
  return {
    allocations, precisions, solved, entries,
    main: entries.reduce((a, e) => a + e.n, 0),
    reserve: entries.reduce((a, e) => a + e.reserve, 0),
  };
}
