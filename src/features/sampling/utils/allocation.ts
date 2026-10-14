// sbr-backend keeps a copy of this file and plan.ts to draw samples for system accounts: run its check:sampling-parity after changing either.
import type { SamplingAllocationMethod, SamplingStratumOverride } from '@/types';

export interface AllocationStratum {
  key: string;
  N: number;
  mean: number | null;
  sd: number | null;
}

export interface AllocationOptions {
  method: SamplingAllocationMethod;
  sampleSize: number;
  minPerStratum: number;
  reservePct: number;
  overrides: Record<string, SamplingStratumOverride>;
}

export type AllocationWarning =
  | 'fixedExceedSize'      // take-all and hand-set strata alone exceed the sample size
  | 'minimumsExceedSize'   // the per-stratum minimums alone exceed what is left
  | 'noVariance'           // Neyman had no spread to work with and fell back to proportional
  | 'sizeAboveFrame';      // more units asked for than the population holds

export interface StratumAllocation {
  key: string;
  N: number;
  n: number;
  reserve: number;
  // Why n is what it is, when it is not the method's own share.
  fixed: 'takeAll' | 'manual' | null;
  bound: 'max' | 'min' | null;
  sdUsed: number | null;
  weight: number | null;
}

export interface Allocation {
  strata: StratumAllocation[];
  requested: number;
  total: number;
  reserveTotal: number;
  population: number;
  warnings: AllocationWarning[];
}

const clampInt = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(v)));

// Stand-in SD for a stratum without its own: the size-weighted mean of the others (see docs/sample-builder.md in NPC_SBR for why).
export function typicalSd(strata: AllocationStratum[]): number | null {
  let n = 0, sum = 0;
  for (const s of strata) {
    if (s.sd == null || s.N <= 0) continue;
    n += s.N;
    sum += s.N * s.sd;
  }
  return n > 0 ? sum / n : null;
}

// Shares of `budget` in proportion to `w` within [lo, hi]; strata crossing a bound are fixed there and the rest re-shared.
function boundedShares(budget: number, w: number[], lo: number[], hi: number[]): { x: number[]; bound: ('max' | 'min' | null)[] } {
  const k = w.length;
  const x = new Array<number>(k).fill(0);
  const bound = new Array<'max' | 'min' | null>(k).fill(null);
  const active = new Set<number>(Array.from({ length: k }, (_, i) => i));
  let left = budget;
  for (let guard = 0; guard <= 2 * k + 1 && active.size > 0; guard++) {
    let W = 0;
    for (const i of active) W += w[i];
    for (const i of active) x[i] = W > 0 ? (left * w[i]) / W : left / active.size;
    const over = [...active].filter((i) => x[i] > hi[i]);
    const under = over.length ? [] : [...active].filter((i) => x[i] < lo[i]);
    const fix = over.length ? over : under;
    if (!fix.length) break;
    for (const i of fix) {
      x[i] = over.length ? hi[i] : lo[i];
      bound[i] = over.length ? 'max' : 'min';
      left -= x[i];
      active.delete(i);
    }
  }
  return { x, bound };
}

// Whole numbers that add up to `target`: floors, then +1 for the largest remainders that still fit under hi.
function roundToTotal(x: number[], target: number, hi: number[]): number[] {
  const out = x.map((v) => Math.floor(v + 1e-9));
  let missing = target - out.reduce((a, b) => a + b, 0);
  const order = x.map((v, i) => ({ i, frac: v - out[i] })).sort((a, b) => b.frac - a.frac || a.i - b.i);
  // Two passes only guard against float drift; the first one always suffices when x sums to target.
  for (let pass = 0; pass < 2 && missing > 0; pass++) {
    for (const { i } of order) {
      if (missing <= 0) break;
      if (out[i] < hi[i]) { out[i] += 1; missing -= 1; }
    }
  }
  return out;
}

export function allocate(strata: AllocationStratum[], opts: AllocationOptions): Allocation {
  const warnings: AllocationWarning[] = [];
  const population = strata.reduce((a, s) => a + s.N, 0);
  const requested = Math.max(0, Math.round(opts.sampleSize));
  if (requested > population) warnings.push('sizeAboveFrame');
  const target = Math.min(requested, population);
  const fallbackSd = typicalSd(strata);

  const result: StratumAllocation[] = strata.map((s) => ({
    key: s.key, N: s.N, n: 0, reserve: 0, fixed: null, bound: null,
    sdUsed: s.sd ?? fallbackSd, weight: null,
  }));

  // 1. Take-all and hand-set strata.
  let fixedTotal = 0;
  const free: number[] = [];
  strata.forEach((s, i) => {
    const o = opts.overrides[s.key];
    if (o?.takeAll) {
      result[i].n = s.N;
      result[i].fixed = 'takeAll';
    } else if (o?.n != null && Number.isFinite(o.n)) {
      result[i].n = clampInt(o.n, 0, s.N);
      result[i].fixed = 'manual';
    } else {
      free.push(i);
      return;
    }
    fixedTotal += result[i].n;
  });
  let left = target - fixedTotal;
  if (left < 0) { warnings.push('fixedExceedSize'); left = 0; }

  // 2. The method's shares over the free strata, within [minimum, N_h].
  if (free.length) {
    const lo = free.map((i) => Math.min(Math.max(0, Math.round(opts.minPerStratum)), strata[i].N));
    const hi = free.map((i) => strata[i].N);
    const minTotal = lo.reduce((a, b) => a + b, 0);
    let w: number[];
    if (opts.method === 'equal') w = free.map(() => 1);
    else if (opts.method === 'proportional') w = free.map((i) => strata[i].N);
    else {
      w = free.map((i) => strata[i].N * (result[i].sdUsed ?? 0));
      if (w.every((v) => v <= 0)) { warnings.push('noVariance'); w = free.map((i) => strata[i].N); }
    }
    let n: number[];
    let bounds: ('max' | 'min' | null)[];
    if (left <= minTotal) {
      if (left < minTotal) warnings.push('minimumsExceedSize');
      n = lo;
      bounds = lo.map((v) => (v > 0 ? 'min' : null));
    } else {
      const shares = boundedShares(left, w, lo, hi);
      n = roundToTotal(shares.x, left, hi);
      bounds = shares.bound;
    }
    free.forEach((i, j) => {
      result[i].n = n[j];
      result[i].bound = bounds[j];
    });
  }

  // 3. Reserve, design weights.
  for (const r of result) {
    r.reserve = Math.min(Math.ceil((r.n * Math.max(0, opts.reservePct)) / 100), r.N - r.n);
    r.weight = r.n > 0 ? r.N / r.n : null;
  }
  return {
    strata: result,
    requested,
    total: result.reduce((a, r) => a + r.n, 0),
    reserveTotal: result.reduce((a, r) => a + r.reserve, 0),
    population,
    warnings,
  };
}

export interface Precision {
  // Estimated total of the auxiliary field and its standard error / CV under the allocation.
  total: number | null;
  se: number | null;
  cv: number | null;
  // Strata with units but no sample: the total cannot be estimated without bias.
  uncovered: number;
}

export function precision(strata: AllocationStratum[], alloc: Allocation): Precision {
  let total = 0, variance = 0, uncovered = 0, known = false;
  strata.forEach((s, i) => {
    const a = alloc.strata[i];
    if (s.N <= 0) return;
    if (a.n <= 0) { uncovered += 1; return; }
    if (s.mean != null) { total += s.N * s.mean; known = true; }
    const sd = a.sdUsed ?? 0;
    variance += (s.N * s.N * (1 - a.n / s.N) * sd * sd) / a.n;
  });
  if (!known || total <= 0) return { total: known ? total : null, se: null, cv: null, uncovered };
  const se = Math.sqrt(Math.max(0, variance));
  return { total, se, cv: uncovered ? null : se / total, uncovered };
}

// Smallest n whose full allocation reaches the target CV (0.05 = 5%), by bisection; null when even a census misses it.
export function sizeForTargetCv(strata: AllocationStratum[], opts: AllocationOptions, targetCv: number): number | null {
  const population = strata.reduce((a, s) => a + s.N, 0);
  const cvAt = (n: number) => precision(strata, allocate(strata, { ...opts, sampleSize: n })).cv;
  const atCensus = cvAt(population);
  if (atCensus == null || atCensus > targetCv) return null;
  let lo = 1, hi = population;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const cv = cvAt(mid);
    if (cv != null && cv <= targetCv) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
