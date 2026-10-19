import type { SamplingApiSelectionGroup, SamplingDesign, SamplingGroup, SamplingGroupMethod, SamplingSelectionGroup, SamplingNode, SamplingStrataRequest, SamplingUnit, DesignV1 } from '@/types';
import {
  SAMPLING_DEFAULT_ALLOCATION, SAMPLING_DEFAULT_AUX, SAMPLING_DEFAULT_COLUMNS, SAMPLING_DEFAULT_EST_COLUMNS,
  SAMPLING_DEFAULT_SEED, SAMPLING_EMPLOYMENT_BANDS,
} from '../constants';
import { apiFilterFields, newGroup, newNodeId, pruneFields, reId, toApiFilter } from './filterTree';

const emptyFilter = (): SamplingGroup => ({ ...newGroup('and'), id: newNodeId() });

export function newSelectionGroup(method: SamplingGroupMethod, name: string): SamplingSelectionGroup {
  return {
    id: newNodeId(),
    name,
    method,
    filter: emptyFilter(),
    strata: method === 'random' ? [{ column: 'SIZE_CLASS' }] : [],
    manualIds: '',
    allocation: { ...SAMPLING_DEFAULT_ALLOCATION, overrides: {} },
  };
}

export function defaultDesign(unit: SamplingUnit = 'enterprise', seed: number = SAMPLING_DEFAULT_SEED, groupName = 'Random sample'): SamplingDesign {
  return {
    version: 2,
    snapshotId: null,
    unit,
    filter: emptyFilter(),
    groups: [newSelectionGroup('random', groupName)],
    auxColumn: SAMPLING_DEFAULT_AUX,
    seed,
    columns: SAMPLING_DEFAULT_COLUMNS[unit],
    estColumns: SAMPLING_DEFAULT_EST_COLUMNS,
    contacts: { include: true, tags: [], fallback: 'ALL' },
  };
}

// A design saved before selection groups existed: one establishment random group.
function fromV1(v1: DesignV1, ids: (n: SamplingNode) => SamplingNode): SamplingDesign {
  const base = defaultDesign('enterprise', v1.seed);
  const group = newSelectionGroup('random', 'Random sample');
  group.strata = v1.strata ?? [];
  group.allocation = {
    method: v1.method, sizeMode: v1.sizeMode, sampleSize: v1.sampleSize, targetCv: v1.targetCv,
    minPerStratum: v1.minPerStratum, reservePct: v1.reservePct, overrides: {},
  };
  return {
    ...base,
    snapshotId: v1.snapshotId,
    filter: ids(v1.filter) as SamplingGroup,
    groups: [group],
    auxColumn: v1.auxColumn,
  };
}

// Any stored or loaded design as the current shape or null; a loaded file gets fresh node ids.
export function migrateDesign(raw: unknown, freshIds = false): SamplingDesign | null {
  const d = raw as Omit<Partial<SamplingDesign>, 'version'> & { version?: number };
  if (!d || typeof d !== 'object' || d.filter?.kind !== 'group') return null;
  const ids = freshIds ? reId : (n: SamplingNode) => n;
  if (d.version === 1) return fromV1(d as unknown as DesignV1, ids);
  if (d.version !== 2 || !Array.isArray(d.groups) || !d.groups.length) return null;
  const base = defaultDesign('enterprise');
  const wasEnterprise = d.unit !== 'establishment';
  return {
    ...base,
    ...d,
    unit: 'enterprise',
    columns: wasEnterprise && d.columns ? d.columns : base.columns,
    filter: ids(d.filter) as SamplingGroup,
    groups: d.groups.map((g) => ({ ...newSelectionGroup(g.method, g.name), ...g, filter: ids(g.filter) as SamplingGroup })),
    contacts: { ...base.contacts, ...d.contacts },
  } as SamplingDesign;
}

// Ids as typed: separated by commas, spaces, semicolons or new lines; anything else is reported.
export function parseIds(text: string): { ids: number[]; invalid: string[] } {
  const tokens = text.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
  const ids: number[] = [];
  const invalid: string[] = [];
  const seen = new Set<number>();
  for (const tok of tokens) {
    if (/^\d+$/.test(tok)) {
      const n = Number(tok);
      if (!seen.has(n)) { seen.add(n); ids.push(n); }
    } else invalid.push(tok);
  }
  return { ids, invalid };
}

export function toApiGroups(groups: SamplingSelectionGroup[]): SamplingApiSelectionGroup[] {
  return groups.map((g) => {
    if (g.method === 'manual') return { method: 'manual', ids: parseIds(g.manualIds).ids };
    const filter = toApiFilter(g.filter);
    if (g.method === 'census') return { method: 'census', filter };
    return { method: 'random', filter, strata: g.strata };
  });
}

// The usual business-survey split: every large unit, a random sample of the rest by size class.
export function presetCensusLargePlusRandom(names: { census: string; random: string }): SamplingSelectionGroup[] {
  const census = newSelectionGroup('census', names.census);
  census.filter = {
    ...emptyFilter(),
    rules: [{ id: newNodeId(), kind: 'condition', column: 'EMPLOYMENT', operator: 'greater_or_equal', value: String(SAMPLING_EMPLOYMENT_BANDS[2]), values: [] }],
  };
  const random = newSelectionGroup('random', names.random);
  random.strata = [{ column: 'ISIC_SECTION' }, { column: 'SIZE_CLASS' }];
  return [census, random];
}

// The design without conditions, strata, aux field or columns the frame no longer offers.
export function pruneDesign(design: SamplingDesign, known: Set<string>, estKnown: Set<string> | null): { design: SamplingDesign; removed: string[] } {
  const removed = new Set<string>();
  const keep = (set: Set<string>) => (c: string) => set.has(c) || !removed.add(c);
  const out: SamplingDesign = {
    ...design,
    filter: pruneFields(design.filter, known, removed),
    groups: design.groups.map((g) => ({ ...g, filter: pruneFields(g.filter, known, removed), strata: g.strata.filter((s) => keep(known)(s.column)) })),
    auxColumn: design.auxColumn && !keep(known)(design.auxColumn) ? null : design.auxColumn,
    columns: design.columns.filter(keep(known)),
    estColumns: estKnown ? design.estColumns.filter(keep(estKnown)) : design.estColumns,
  };
  return { design: out, removed: [...removed] };
}

// Every field a counted request names: its filters, strata and auxiliary field.
export function requestFields(req: SamplingStrataRequest): string[] {
  const out = apiFilterFields(req.filter);
  req.groups.forEach((g) => { apiFilterFields(g.filter, out); (g.strata ?? []).forEach((s) => out.push(s.column)); });
  if (req.auxColumn) out.push(req.auxColumn);
  return out;
}

// An uploaded ids file as text for the hand picked box, without a header line.
export function idsFromFile(text: string): string {
  const lines = text.split(/\r?\n/);
  const first = lines.findIndex((l) => l.trim() !== '');
  if (first >= 0 && !/\d/.test(lines[first])) lines.splice(first, 1);
  return lines.join('\n').trim();
}

// A one-column CSV showing what to upload: the key column's name, then a few made-up ids.
export function idsTemplateCsv(keyColumn: string, rows: number): string {
  const ids = Array.from({ length: rows }, () => `99${String(Math.floor(Math.random() * 1e7)).padStart(7, '0')}`);
  return [keyColumn, ...ids].join('\r\n') + '\r\n';
}
