import type {
  AnalysisAggregateResult,
  AnalysisEntity,
  AnalysisCompletenessResult,
  AnalysisFilter,
  AnalysisFlowResult,
  AnalysisMeasure,
  AnalysisRecordsResult,
  AnalysisRequest,
  AnalysisResolvedQuery,
  AnalysisResult,
  AnalysisResultRow,
} from '@/types';
import {
  ANALYSIS_DISCLOSURE,
  ANALYSIS_ENTITIES,
  ANALYSIS_FIELDS,
  ANALYSIS_FRAME_DIMENSION,
  ANALYSIS_OTHER_KEY,
  FLOW_CEASED,
  FLOW_NEW,
  FLOW_OUTSIDE,
} from '../constants';
import { ANALYSIS_FRAME_CHRONO } from '../mock/frames';
import { fieldGetter, getFrameRows, type AnalysisGetter, type AnalysisRow } from '../mock/generate';

// Pure in-browser stand-in for the analysis endpoint; its request/result shapes are the backend contract.

const SERIES_CAP = 10;
const SEP = '\u0001';

export function keyOf(v: unknown): string | null {
  if (v == null || v === '') return null;
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return String(v);
}

function compileFilter(entity: AnalysisEntity, f: AnalysisFilter): (r: AnalysisRow) => boolean {
  const get = fieldGetter(entity, f.field);
  switch (f.op) {
    case 'in': {
      const set = new Set(f.values ?? []);
      return (r) => set.has(keyOf(get(r)));
    }
    case 'not_in': {
      const set = new Set(f.values ?? []);
      return (r) => !set.has(keyOf(get(r)));
    }
    case 'between':
      return (r) => {
        const v = get(r);
        if (typeof v !== 'number') return false;
        return (f.min == null || v >= f.min) && (f.max == null || v <= f.max);
      };
    case 'contains': {
      const needle = (f.text ?? '').toLowerCase();
      return (r) => String(get(r) ?? '').toLowerCase().includes(needle);
    }
    case 'empty':
      return (r) => keyOf(get(r)) == null;
    case 'not_empty':
      return (r) => keyOf(get(r)) != null;
  }
}

function applicableFilters(q: AnalysisResolvedQuery): AnalysisFilter[] {
  const fields = new Set(ANALYSIS_ENTITIES[q.entity].fields);
  return q.filters.filter((f) => fields.has(f.field));
}

function filterRows(entity: AnalysisEntity, rows: AnalysisRow[], filters: AnalysisFilter[]): AnalysisRow[] {
  if (!filters.length) return rows;
  const preds = filters.map((f) => compileFilter(entity, f));
  return rows.filter((r) => preds.every((p) => p(r)));
}

export function frameRowsFor(q: AnalysisResolvedQuery, frame: string): AnalysisRow[] {
  return filterRows(q.entity, getFrameRows(q.entity, frame), applicableFilters(q));
}

function numbers(rows: AnalysisRow[], get: AnalysisGetter): number[] {
  const out: number[] = [];
  for (const r of rows) {
    const v = get(r);
    if (typeof v === 'number' && !Number.isNaN(v)) out.push(v);
  }
  return out;
}

function measure(entity: AnalysisEntity, rows: AnalysisRow[], m: AnalysisMeasure): { value: number | null; dominant: boolean } {
  if (m.agg === 'count' || !m.field) return { value: rows.length, dominant: false };
  const get = fieldGetter(entity, m.field);
  if (m.agg === 'count_distinct') {
    const s = new Set<string>();
    for (const r of rows) { const k = keyOf(get(r)); if (k != null) s.add(k); }
    return { value: s.size, dominant: false };
  }
  const nums = numbers(rows, get);
  if (!nums.length) return { value: null, dominant: false };
  switch (m.agg) {
    case 'sum': {
      let sum = 0;
      let max = 0;
      for (const n of nums) { sum += n; if (n > max) max = n; }
      return { value: sum, dominant: sum > 0 && nums.length > 1 && max / sum > ANALYSIS_DISCLOSURE.dominance };
    }
    case 'avg':
      return { value: Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10, dominant: false };
    case 'median': {
      const s = [...nums].sort((a, b) => a - b);
      const mid = Math.floor(s.length / 2);
      return { value: s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2, dominant: false };
    }
    // A reduce, not Math.min(...nums): spreading 100k+ values overflows the call stack.
    case 'min':
      return { value: nums.reduce((a, b) => (b < a ? b : a), nums[0]), dominant: false };
    case 'max':
      return { value: nums.reduce((a, b) => (b > a ? b : a), nums[0]), dominant: false };
  }
}

function compareKeys(field: string, a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (a === ANALYSIS_OTHER_KEY || a == null) return 1;
  if (b === ANALYSIS_OTHER_KEY || b == null) return -1;
  if (field === ANALYSIS_FRAME_DIMENSION) return ANALYSIS_FRAME_CHRONO.indexOf(a) - ANALYSIS_FRAME_CHRONO.indexOf(b);
  const order = ANALYSIS_FIELDS[field]?.order;
  if (order) return order.indexOf(a) - order.indexOf(b);
  return a.localeCompare(b, undefined, { numeric: true });
}

interface Tagged { row: AnalysisRow; frame: string }

function taggedRows(q: AnalysisResolvedQuery, frame: string): Tagged[] {
  const frames = q.dimensions.includes(ANALYSIS_FRAME_DIMENSION) ? ANALYSIS_FRAME_CHRONO : [frame];
  const out: Tagged[] = [];
  for (const f of frames) for (const row of frameRowsFor(q, f)) out.push({ row, frame: f });
  return out;
}

type DimGetter = (t: Tagged) => string | null;

function dimGetters(q: AnalysisResolvedQuery): DimGetter[] {
  return q.dimensions.map((dim) => {
    if (dim === ANALYSIS_FRAME_DIMENSION) return (t: Tagged) => t.frame;
    const get = fieldGetter(q.entity, dim);
    return (t: Tagged) => keyOf(get(t.row));
  });
}

// Keeps the top categories of each dimension (by unit count); the rest fold into "Other" or drop.
function keepSets(q: AnalysisResolvedQuery, rows: Tagged[]): (Set<string | null> | null)[] {
  const getters = dimGetters(q);
  return q.dimensions.map((dim, i) => {
    if (dim === ANALYSIS_FRAME_DIMENSION) return null;
    const cap = i === 0 ? q.limit : q.seriesLimit === undefined ? SERIES_CAP : q.seriesLimit;
    if (cap == null) return null;
    const counts = new Map<string | null, number>();
    for (const t of rows) { const k = getters[i](t); counts.set(k, (counts.get(k) ?? 0) + 1); }
    if (counts.size <= cap) return null;
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, cap).map(([k]) => k);
    return new Set(top);
  });
}

function group(q: AnalysisResolvedQuery, rows: Tagged[], keep: (Set<string | null> | null)[]) {
  const getters = dimGetters(q);
  const groups = new Map<string, { keys: (string | null)[]; rows: AnalysisRow[] }>();
  outer: for (const t of rows) {
    const keys: (string | null)[] = [];
    for (let i = 0; i < q.dimensions.length; i++) {
      let k = getters[i](t);
      const set = keep[i];
      if (set && !set.has(k)) {
        if (!q.otherBucket && i === 0) continue outer;
        k = ANALYSIS_OTHER_KEY;
      }
      keys.push(k);
    }
    const id = keys.join(SEP);
    let g = groups.get(id);
    if (!g) { g = { keys, rows: [] }; groups.set(id, g); }
    g.rows.push(t.row);
  }
  return groups;
}

function flagRows(rows: AnalysisResultRow[], dims: number): void {
  const min = ANALYSIS_DISCLOSURE.minCell;
  // Secondary suppression: a lone confidential cell is recoverable from the total, so hide its smallest neighbour too.
  const lines: Map<string, AnalysisResultRow[]>[] = [];
  if (dims === 1) lines.push(new Map([['all', rows]]));
  if (dims === 2) {
    for (const axis of [0, 1]) {
      const m = new Map<string, AnalysisResultRow[]>();
      for (const r of rows) { const k = String(r.keys[axis]); if (!m.has(k)) m.set(k, []); m.get(k)!.push(r); }
      lines.push(m);
    }
  }
  const small = (n: number | undefined) => !!n && n < min;
  for (const r of rows) if (!r.flag && (small(r.n) || small(r.prevN))) r.flag = 'min';
  for (let pass = 0; pass < 4; pass++) {
    let changed = false;
    for (const m of lines) {
      for (const line of m.values()) {
        const flagged = line.filter((r) => r.flag);
        if (flagged.length !== 1 || line.length < 2) continue;
        const candidate = line.filter((r) => !r.flag).sort((a, b) => a.n - b.n)[0];
        if (candidate) { candidate.flag = 'secondary'; changed = true; }
      }
    }
    if (!changed) break;
  }
}

function runAggregate(q: AnalysisResolvedQuery): AnalysisAggregateResult {
  const rows = taggedRows(q, q.frame);
  const keep = keepSets(q, rows);
  const groups = group(q, rows, keep);
  const measures = q.measures.length ? q.measures : [{ id: 'm', agg: 'count' as const, field: null }];

  const allRows = rows.map((t) => t.row);
  const total = { values: measures.map((m) => measure(q.entity, allRows, m).value), n: allRows.length } as AnalysisAggregateResult['total'];

  let out: AnalysisResultRow[] = [...groups.values()].map((g) => {
    const ms = measures.map((m) => measure(q.entity, g.rows, m));
    const row: AnalysisResultRow = { keys: g.keys, values: ms.map((x) => x.value), n: g.rows.length };
    if (ms.some((x) => x.dominant)) row.flag = 'dominance';
    return row;
  });

  const compareTo = q.dimensions.includes(ANALYSIS_FRAME_DIMENSION) ? null : q.compareTo;
  if (compareTo && compareTo !== q.frame) {
    const prevRows = taggedRows(q, compareTo);
    const prevGroups = group(q, prevRows, keep);
    const prevAll = prevRows.map((t) => t.row);
    total.prev = measures.map((m) => measure(q.entity, prevAll, m).value);
    total.prevN = prevAll.length;
    const seen = new Set<string>();
    for (const r of out) {
      const id = r.keys.join(SEP);
      seen.add(id);
      const pg = prevGroups.get(id);
      r.prev = pg ? measures.map((m) => measure(q.entity, pg.rows, m).value) : measures.map(() => 0);
      r.prevN = pg?.rows.length ?? 0;
    }
    for (const [id, pg] of prevGroups) {
      if (seen.has(id)) continue;
      out.push({ keys: pg.keys, values: measures.map(() => 0), n: 0, prev: measures.map((m) => measure(q.entity, pg.rows, m).value), prevN: pg.rows.length });
    }
  }

  out = sortRows(q, out);
  if (q.dimensions.length === 1 || q.dimensions.length === 2) flagRows(out, q.dimensions.length);
  return { kind: 'aggregate', dimensions: q.dimensions, measures, rows: out, total, frame: q.frame, compareTo: compareTo && compareTo !== q.frame ? compareTo : null };
}

function sortRows(q: AnalysisResolvedQuery, rows: AnalysisResultRow[]): AnalysisResultRow[] {
  if (!q.dimensions.length) return rows;
  const byValue = q.sort === 'value_desc' || q.sort === 'value_asc';
  const dir = q.sort === 'value_asc' || q.sort === 'key_asc' ? 1 : -1;
  const rank = q.dimensions.map((dim, i) => {
    const totals = new Map<string | null, number>();
    for (const r of rows) totals.set(r.keys[i], (totals.get(r.keys[i]) ?? 0) + (r.values[0] ?? 0));
    const keys = [...totals.keys()];
    // Ordered dimensions (frames, size classes, years) always keep their natural order.
    const natural = dim === ANALYSIS_FRAME_DIMENSION || !!ANALYSIS_FIELDS[dim]?.order || dim === 'reg_year';
    keys.sort((a, b) => {
      if (a === ANALYSIS_OTHER_KEY || b === ANALYSIS_OTHER_KEY || a == null || b == null) return compareKeys(dim, a, b);
      if (natural && (i > 0 || !byValue || dim === ANALYSIS_FRAME_DIMENSION)) return compareKeys(dim, a, b);
      if (byValue && i === 0) return dir * ((totals.get(a) ?? 0) - (totals.get(b) ?? 0));
      if (i > 0) return (totals.get(b) ?? 0) - (totals.get(a) ?? 0);
      return dir * compareKeys(dim, a, b);
    });
    return new Map(keys.map((k, idx) => [k, idx]));
  });
  return [...rows].sort((a, b) => {
    for (let i = 0; i < rank.length; i++) {
      const d = (rank[i].get(a.keys[i]) ?? 0) - (rank[i].get(b.keys[i]) ?? 0);
      if (d) return d;
    }
    return 0;
  });
}

function columnPicker(entity: AnalysisEntity, columns: string[]) {
  const getters = columns.map((c) => fieldGetter(entity, c));
  return (row: AnalysisRow) => {
    const o: Record<string, unknown> = {};
    columns.forEach((c, i) => { o[c] = getters[i](row); });
    return o;
  };
}

function runRecords(q: AnalysisResolvedQuery, page: number, pageSize: number, sortBy: string | null, sortDir: 'asc' | 'desc'): AnalysisRecordsResult {
  let rows = frameRowsFor(q, q.frame);
  const columns = q.columns.length ? q.columns : ANALYSIS_ENTITIES[q.entity].defaultColumns;
  if (sortBy) {
    const dir = sortDir === 'asc' ? 1 : -1;
    const numeric = ANALYSIS_FIELDS[sortBy]?.type === 'number' || ANALYSIS_FIELDS[sortBy]?.type === 'id';
    const get = fieldGetter(q.entity, sortBy);
    rows = [...rows].sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      return dir * (numeric ? (va as number) - (vb as number) : String(va).localeCompare(String(vb), undefined, { numeric: true }));
    });
  }
  const start = (page - 1) * pageSize;
  return {
    kind: 'records',
    columns,
    rows: rows.slice(start, start + pageSize).map(columnPicker(q.entity, columns)),
    total: rows.length,
    page,
    pageSize,
  };
}

function isFilled(v: unknown): boolean {
  return typeof v === 'boolean' ? v : keyOf(v) != null;
}

function runCompleteness(q: AnalysisResolvedQuery): AnalysisCompletenessResult {
  const rows = frameRowsFor(q, q.frame);
  const fields = q.columns.length ? q.columns : ['isic_section', 'sector', 'employment', 'municipality', 'has_coordinates', 'has_email'];
  const dim = q.dimensions[0];
  const buckets = new Map<string | null, AnalysisRow[]>();
  if (dim) {
    const get = fieldGetter(q.entity, dim);
    for (const r of rows) { const k = keyOf(get(r)); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k)!.push(r); }
  }
  let groups = [...buckets.keys()].sort((a, b) => (buckets.get(b)!.length - buckets.get(a)!.length));
  if (q.limit != null && groups.length > q.limit) groups = groups.slice(0, q.limit);
  const cols = [...groups.map((g) => buckets.get(g)!), rows];
  return {
    kind: 'completeness',
    fields,
    groups,
    cells: fields.map((f) => {
      const get = fieldGetter(q.entity, f);
      return cols.map((c) => (c.length ? c.filter((r) => isFilled(get(r))).length / c.length : 0));
    }),
    groupN: cols.map((c) => c.length),
  };
}

function runFlow(q: AnalysisResolvedQuery): AnalysisFlowResult {
  const from = q.compareTo && q.compareTo !== q.frame ? q.compareTo : ANALYSIS_FRAME_CHRONO[0];
  const to = q.frame;
  const idOf = fieldGetter(q.entity, ANALYSIS_ENTITIES[q.entity].idField);
  const dimGet = q.dimensions[0] ? fieldGetter(q.entity, q.dimensions[0]) : null;
  const k = (r: AnalysisRow) => (dimGet ? keyOf(dimGet(r)) : null);
  const allA = new Map(getFrameRows(q.entity, from).map((r) => [idOf(r), r]));
  const allB = new Map(getFrameRows(q.entity, to).map((r) => [idOf(r), r]));
  const inA = new Map(frameRowsFor(q, from).map((r) => [idOf(r), r]));
  const inB = new Map(frameRowsFor(q, to).map((r) => [idOf(r), r]));
  let births = 0, deaths = 0, movedIn = 0, movedOut = 0, unchanged = 0;
  const links = new Map<string, { from: string | null; to: string | null; value: number }>();
  const addLink = (a: string | null, b: string | null) => {
    const id = `${a}${SEP}${b}`;
    const l = links.get(id);
    if (l) l.value++;
    else links.set(id, { from: a, to: b, value: 1 });
  };

  for (const [id, a] of inA) {
    const b = inB.get(id);
    if (b) {
      const ka = k(a);
      const kb = k(b);
      if (ka === kb) unchanged++;
      else addLink(ka, kb);
    } else if (allB.has(id)) { movedOut++; addLink(k(a), FLOW_OUTSIDE); }
    else { deaths++; addLink(k(a), FLOW_CEASED); }
  }
  for (const [id, b] of inB) {
    if (inA.has(id)) continue;
    if (allA.has(id)) { movedIn++; addLink(FLOW_OUTSIDE, k(b)); }
    else { births++; addLink(FLOW_NEW, k(b)); }
  }

  return {
    kind: 'flow',
    frame: to,
    compareTo: from,
    start: inA.size,
    births,
    deaths,
    movedIn,
    movedOut,
    end: inB.size,
    unchanged,
    links: [...links.values()].sort((a, b) => b.value - a.value),
  };
}

export function runAnalysisRequest(req: AnalysisRequest): AnalysisResult {
  switch (req.kind) {
    case 'aggregate': return runAggregate(req.query);
    case 'records': return runRecords(req.query, req.page, req.pageSize, req.sortBy, req.sortDir);
    case 'completeness': return runCompleteness(req.query);
    case 'flow': return runFlow(req.query);
  }
}

export function exportRecords(q: AnalysisResolvedQuery, columns: string[], cap: number): { rows: Record<string, unknown>[]; total: number } {
  const rows = frameRowsFor(q, q.frame);
  return { rows: rows.slice(0, cap).map(columnPicker(q.entity, columns)), total: rows.length };
}
