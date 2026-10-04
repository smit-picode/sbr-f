import type { AnalysisEntity } from '@/types';
import { ANALYSIS_FRAME_CHRONO, frameIndex } from './frames';

// Deterministic full-scale dummy register, calibrated on real aggregates only — no real record is used.

// `_p` is the parent establishment of a contact/address row (the curated join).
export type AnalysisRow = Record<string, unknown> & { _b: number; _d: number; _hist?: HistoryEntry[]; _p?: AnalysisRow };
interface HistoryEntry { until: number; values: Record<string, unknown> }

const CONTACT_OWN = new Set(['contact_id', 'role', 'contact_source', 'has_phone', 'has_mobile', 'has_email', 'has_website']);
const ADDRESS_OWN = new Set(['address_id', 'address_source', 'municipality', 'zone', 'has_street', 'has_building', 'has_coordinates']);

export type AnalysisGetter = (r: AnalysisRow) => unknown;

// Child tables reach joined establishment fields through `_p` instead of copying them onto every row.
export function fieldGetter(entity: AnalysisEntity, field: string): AnalysisGetter {
  const own = entity === 'contacts' ? CONTACT_OWN : entity === 'addresses' ? ADDRESS_OWN : null;
  if (own && !own.has(field)) return (r) => (r._p as AnalysisRow)[field];
  return (r) => r[field];
}

const NEVER = 99;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Weighted<T> = [T, number][];

function picker<T>(rng: () => number, items: Weighted<T>) {
  const total = items.reduce((s, [, w]) => s + w, 0);
  const cum: number[] = [];
  let acc = 0;
  for (const [, w] of items) { acc += w / total; cum.push(acc); }
  return () => {
    const r = rng();
    for (let i = 0; i < cum.length; i++) if (r < cum[i]) return items[i][0];
    return items[items.length - 1][0];
  };
}

const SECTION_WEIGHTS: Weighted<string | null> = [
  ['A', 98], ['B', 212], ['C', 5467], ['D', 24], ['E', 125], ['F', 15484], ['G', 34949], ['H', 2865],
  ['I', 10308], ['J', 2488], ['K', 2071], ['L', 1554], ['M', 5199], ['N', 8612], ['O', 40], ['P', 842],
  ['Q', 691], ['R', 1175], ['S', 4919], ['T', 3], ['U', 8], [null, 18098],
];

const SECTION_DIVISIONS: Record<string, [number, number]> = {
  A: [1, 3], B: [5, 9], C: [10, 33], D: [35, 35], E: [36, 39], F: [41, 43], G: [45, 47], H: [49, 53],
  I: [55, 56], J: [58, 63], K: [64, 66], L: [68, 68], M: [69, 75], N: [77, 82], O: [84, 84], P: [85, 85],
  Q: [86, 88], R: [90, 93], S: [94, 96], T: [97, 98], U: [99, 99],
};

// Larger units are more common in construction, admin/support and mining than in retail.
const SECTION_SIZE_SHIFT: Record<string, number> = { B: 3, F: 2.2, N: 1.8, H: 1.5, C: 1.4, Q: 1.3, P: 1.2, G: 0.7, S: 0.6, M: 0.8 };

const MUNICIPALITIES: Weighted<string> = [
  ['Doha', 43899], ['Al Rayyan', 28846], ['Al Wakra', 7260], ['Umm Slal', 3250], ['Al Khor and Al Thakhira', 2027],
  ['Al Daayen', 4530], ['Al Shamal', 478], ['Al Sheehaniya', 956],
];

const ZONES: Record<string, number[]> = {
  Doha: Array.from({ length: 50 }, (_, i) => i + 1),
  'Al Rayyan': [51, 52, 53, 54, 55, 56, 57, 80, 81, 82, 83],
  'Al Daayen': [69, 70, 71],
  'Umm Slal': [72, 73],
  'Al Khor and Al Thakhira': [74, 75, 76],
  'Al Shamal': [77, 78, 79],
  'Al Sheehaniya': [84, 85, 86, 87, 88],
  'Al Wakra': [90, 91, 92, 93],
};

const COUNTRIES = ['United Kingdom', 'United States', 'India', 'United Arab Emirates', 'Saudi Arabia', 'France', 'Turkey', 'Egypt', 'Kuwait', 'China', 'Germany', 'Japan', 'Lebanon', 'Jordan', 'Singapore'];

const NAME_ROOTS = ['Al Noor', 'Doha', 'Gulf', 'Pearl', 'Falcon', 'Desert Rose', 'Lusail', 'Sidra', 'Al Majd', 'Oryx', 'Al Bidda', 'Msheireb', 'Katara', 'Al Jazi', 'Al Sadd', 'West Bay', 'Al Dafna', 'Corniche', 'Al Waab', 'Dune', 'Al Fanar', 'Al Khaleej', 'Zubarah', 'Al Wusail', 'Barzan', 'Al Thumama', 'Al Mirqab', 'Souq', 'Mesaieed', 'Ras Laffan'];
const NAME_ACTIVITY: Record<string, string[]> = {
  A: ['Farm', 'Agricultural Co.'], B: ['Quarrying', 'Minerals'], C: ['Industries', 'Manufacturing', 'Factory'],
  D: ['Power'], E: ['Environmental Services', 'Recycling'], F: ['Contracting', 'Construction', 'Engineering & Contracting'],
  G: ['Trading', 'General Trading', 'Supermarket', 'Stores'], H: ['Transport', 'Logistics', 'Shipping'],
  I: ['Restaurant', 'Cafe', 'Hotel'], J: ['IT Solutions', 'Media', 'Technologies'], K: ['Finance', 'Insurance', 'Capital'],
  L: ['Real Estate', 'Properties'], M: ['Consulting', 'Engineering Consultants', 'Legal Advisors'],
  N: ['Services', 'Manpower', 'Cleaning Services', 'Security Services'], O: ['Authority'], P: ['School', 'Academy', 'Training Center'],
  Q: ['Medical Center', 'Clinic', 'Pharmacy'], R: ['Events', 'Sports Club'], S: ['Salon', 'Laundry', 'Repairs'],
  T: ['Household Services'], U: ['Mission'],
};
const NAME_SUFFIX: Record<string, string> = { 'W.L.L.': ' W.L.L.', 'Q.P.S.C.': ' Q.P.S.C.', 'Q.S.C.': ' Q.S.C.', 'QFC LLC': ' LLC', 'QFZ LLC': ' FZ LLC', 'QSTP LLC': ' LLC' };

// [births, deaths] entering each later frame — net growth matches the real extracts exactly.
const START_COUNT = 109682;
const TRANSITIONS: [number, number][] = [[1900, 1275], [3400, 1323], [4100, 1298]];

interface Universe {
  establishments: AnalysisRow[];
  enterprises: AnalysisRow[];
  groups: AnalysisRow[];
}

let universe: Universe | null = null;
let contacts: AnalysisRow[] | null = null;
let addresses: AnalysisRow[] | null = null;
const frameCache = new Map<string, AnalysisRow[]>();

function sizeClassOf(emp: number | null): string | null {
  if (emp == null || emp <= 0) return null;
  if (emp < 10) return 'micro';
  if (emp < 50) return 'small';
  if (emp < 250) return 'medium';
  return 'large';
}

function buildUniverse(): Universe {
  const rng = mulberry32(20260916);
  const pickSection = picker(rng, SECTION_WEIGHTS);
  const pickSource = picker<string>(rng, [['MOCI', 109715], ['MOM_FARM', 1653], ['QFC', 3002], ['QFZ', 750], ['QSTP', 66]]);
  const pickSector = picker<string | null>(rng, [['Private', 101735], ['State Owned', 318], ['Mixed-Government', 340], ['Mixed-Private', 33], [null, 12760]]);
  const pickMociLegal = picker<string | null>(rng, [['W.L.L.', 55], ['Sole Proprietorship', 30], ['Partnership', 5], ['Branch of Foreign Company', 4], ['Q.S.C.', 1.5], ['Q.P.S.C.', 0.5], [null, 4]]);
  const pickMuni = picker(rng, MUNICIPALITIES);
  const pickKids = picker<number>(rng, [[1, 88], [2, 8], [3, 2], [4, 0.8], [5, 0.4], [6, 0.2], [8, 0.3], [12, 0.18], [20, 0.1], [35, 0.02]]);
  const pickGroupSize = picker<number>(rng, [[2, 62], [3, 20], [4, 8], [5, 4], [7, 3], [10, 2], [18, 1]]);
  const pickGroupType = picker<string>(rng, [['Domestic', 68], ['Foreign-controlled', 21], ['Multinational', 11]]);
  const pickCountry = picker<string>(rng, COUNTRIES.map((c, i) => [c, 15 - i] as [string, number]));

  const divisionPickers: Record<string, () => string> = {};
  const groupCodes: Record<string, string[]> = {};
  const classCodes: Record<string, string[]> = {};
  for (const [sec, [lo, hi]] of Object.entries(SECTION_DIVISIONS)) {
    const divs: Weighted<string> = [];
    for (let d = lo; d <= hi; d++) {
      const code = String(d).padStart(2, '0');
      divs.push([code, 0.2 + rng() * rng() * 4]);
      const groups = Array.from({ length: 1 + Math.floor(rng() * 4) }, (_, i) => `${code}${[1, 2, 3, 9][i]}`);
      groupCodes[code] = groups;
      for (const g of groups) classCodes[g] = Array.from({ length: 1 + Math.floor(rng() * 3) }, (_, i) => `${g}${[0, 1, 2][i]}`);
    }
    divisionPickers[sec] = picker(rng, divs);
  }

  function pickIsic(forced?: string | null) {
    const section = forced !== undefined ? forced : pickSection();
    if (!section) return { isic_section: null, isic_division: null, isic_group: null, isic_class: null };
    const div = divisionPickers[section]();
    const grp = groupCodes[div][Math.floor(rng() * groupCodes[div].length)];
    const cls = classCodes[grp][Math.floor(rng() * classCodes[grp].length)];
    return { isic_section: section, isic_division: div, isic_group: grp, isic_class: cls };
  }

  function pickEmployment(section: string | null): number | null {
    if (rng() < 0.29) return null;
    const shift = (section && SECTION_SIZE_SHIFT[section]) || 1;
    const w = [0.69, 0.265 * shift, 0.048 * shift * shift, 0.0074 * shift * shift];
    const tot = w[0] + w[1] + w[2] + w[3];
    let r = rng() * tot;
    const r2 = rng();
    if ((r -= w[0]) < 0) return 1 + Math.floor(r2 * 9);
    if ((r -= w[1]) < 0) return 10 + Math.floor(39 * r2 ** 1.8);
    if ((r -= w[2]) < 0) return 50 + Math.floor(199 * r2 ** 2.6);
    return Math.round(250 * Math.exp(2.2 * r2));
  }

  function nameFor(section: string | null, legal: string | null, idx: number) {
    const root = NAME_ROOTS[idx % NAME_ROOTS.length];
    const acts = NAME_ACTIVITY[section ?? 'S'] ?? ['Services'];
    const act = acts[Math.floor(idx / NAME_ROOTS.length) % acts.length];
    const extra = idx % 7 === 0 ? ' International' : idx % 11 === 0 ? ' & Partners' : '';
    return `${root}${extra} ${act}${(legal && NAME_SUFFIX[legal]) || ''}`;
  }

  // Exact birth-frame pool so every frame's size matches the real extract.
  const total = START_COUNT + TRANSITIONS.reduce((s, [b]) => s + b, 0);
  const births: number[] = new Array(total).fill(0);
  let cursor = START_COUNT;
  TRANSITIONS.forEach(([b], t) => { for (let i = 0; i < b; i++) births[cursor++] = t + 1; });
  for (let i = total - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [births[i], births[j]] = [births[j], births[i]]; }

  const establishments: AnalysisRow[] = [];
  const enterprises: AnalysisRow[] = [];
  const kidsOf: AnalysisRow[][] = [];
  let e = 0;
  while (establishments.length < total) {
    const kids = Math.min(pickKids(), total - establishments.length);
    let source = pickSource();
    let forced: string | null | undefined;
    if (source === 'QFC') forced = ['K', 'M', 'J', 'N'][Math.floor(rng() * 4)];
    else if (source === 'QSTP') forced = rng() < 0.7 ? 'J' : 'M';
    else if (source === 'QFZ') forced = ['C', 'H', 'G'][Math.floor(rng() * 3)];
    else if (source === 'MOM_FARM') forced = rng() < 0.3 ? 'A' : null;
    if (kids > 3 && source !== 'MOCI') source = 'MOCI';
    const isic = pickIsic(forced);
    const legal = source === 'MOCI' ? pickMociLegal() : source === 'QFC' ? (rng() < 0.8 ? 'QFC LLC' : 'QFC Branch') : source === 'QFZ' ? 'QFZ LLC' : source === 'QSTP' ? 'QSTP LLC' : rng() < 0.6 ? 'Farm' : null;
    const sector = source === 'QFC' || source === 'QFZ' || source === 'QSTP' ? 'Private' : pickSector();
    const foreignPct = rng() < 0.12 ? Math.round(10 + rng() * 90) : 0;
    const entId = 500001 + e;
    const entName = nameFor(isic.isic_section, legal, e);
    const regYear = String(2026 - Math.floor(51 * rng() ** 2.2));
    const kidsRows: AnalysisRow[] = [];
    for (let k = 0; k < kids; k++) {
      const idx = establishments.length;
      const sameIsic = k === 0 || rng() < 0.8;
      const own = sameIsic ? isic : pickIsic();
      const employment = pickEmployment(own.isic_section);
      const hasAddress = rng() < 0.793;
      const muni = hasAddress ? pickMuni() : null;
      const zones = muni ? ZONES[muni] : null;
      const born = births[idx];
      const row: AnalysisRow = {
        sbr_id: 100001 + idx,
        name: k === 0 ? entName : `${entName} — Branch ${k}`,
        status: rng() < 0.93 ? 'Active' : 'Inactive',
        source,
        sector,
        legal_type: legal,
        main_branch: k === 0 ? 'MAIN' : 'BRANCH',
        reg_year: born > 0 ? '2026' : k === 0 ? regYear : String(Math.max(Number(regYear), 2026 - Math.floor(20 * rng() ** 2))),
        ...own,
        employment,
        size_class: sizeClassOf(employment),
        municipality: muni,
        zone: zones ? `Zone ${zones[Math.floor(rng() * zones.length)]}` : null,
        has_address: hasAddress,
        has_coordinates: hasAddress && rng() < 0.62,
        has_phone: rng() < 0.7,
        has_email: rng() < 0.55,
        has_website: rng() < 0.1,
        enterprise_id: entId,
        // Filled from the enterprise/group once those exist; declared here so every row keeps one shape.
        turnover: null,
        foreign_controlled: false,
        parent_country: null,
        group_id: null,
        in_group: false,
        group_type: null,
        uci_country: null,
        multinational: false,
        _b: born,
        _d: NEVER,
      };
      establishments.push(row);
      kidsRows.push(row);
    }
    const empKnown = kidsRows.filter((r) => r.employment != null);
    const employment = empKnown.length ? empKnown.reduce((s, r) => s + (r.employment as number), 0) : null;
    enterprises.push({
      enterprise_id: entId,
      name: entName,
      status: kidsRows.some((r) => r.status === 'Active') ? 'Active' : 'Inactive',
      sector,
      legal_type: legal,
      reg_year: kidsRows[0].reg_year,
      ...isic,
      employment,
      size_class: sizeClassOf(employment),
      turnover: employment == null || rng() < 0.2 ? null : Math.round(employment * 180000 * Math.exp((rng() - 0.35) * 1.6)),
      establishment_count: kids,
      foreign_ownership_pct: foreignPct,
      foreign_controlled: foreignPct > 50,
      parent_country: foreignPct > 0 ? pickCountry() : null,
      municipality: kidsRows[0].municipality,
      group_id: null,
      in_group: false,
      group_type: null,
      uci_country: null,
      multinational: false,
      _b: Math.min(...kidsRows.map((r) => r._b)),
      _d: NEVER,
    });
    kidsOf.push(kidsRows);
    e++;
  }

  // Deaths and attribute changes, frame by frame, recording the values each unit had before.
  const record = (row: AnalysisRow, t: number, values: Record<string, unknown>) => {
    (row._hist ??= []).push({ until: t, values });
  };
  TRANSITIONS.forEach(([, deaths], i) => {
    const t = i + 1;
    const alive = establishments.filter((r) => r._b < t && r._d === NEVER);
    for (let k = 0; k < deaths; k++) {
      const j = Math.floor(rng() * alive.length);
      alive[j]._d = t;
      alive[j] = alive[alive.length - 1];
      alive.pop();
    }
    for (const row of alive) {
      const r = rng();
      if (r < 0.015 && row.status === 'Active') {
        record(row, t, { status: 'Active' });
        row.status = 'Inactive';
      } else if (r < 0.022 && row.status === 'Inactive') {
        record(row, t, { status: 'Inactive' });
        row.status = 'Active';
      } else if (r < 0.06 && row.employment != null) {
        const prev = row.employment as number;
        const next = Math.max(1, Math.round(prev * (0.55 + rng() * 1.1)));
        record(row, t, { employment: prev, size_class: row.size_class });
        row.employment = next;
        row.size_class = sizeClassOf(next);
      } else if (r < 0.075 && row.isic_section == null) {
        // Coding backlog clearing up: an uncoded unit receives an ISIC code.
        record(row, t, { isic_section: null, isic_division: null, isic_group: null, isic_class: null });
        Object.assign(row, pickIsic());
      } else if (r < 0.08 && row.employment == null) {
        record(row, t, { employment: null, size_class: null });
        const emp = pickEmployment(row.isic_section as string | null);
        row.employment = emp;
        row.size_class = sizeClassOf(emp);
      } else if (r < 0.083) {
        const prev = { isic_section: row.isic_section, isic_division: row.isic_division, isic_group: row.isic_group, isic_class: row.isic_class };
        record(row, t, prev);
        Object.assign(row, pickIsic());
      }
    }
  });
  enterprises.forEach((ent, i) => {
    const kids = kidsOf[i];
    ent._d = kids.every((k) => k._d !== NEVER) ? Math.max(...kids.map((k) => k._d)) : NEVER;
  });

  // Enterprise groups: 14,163 groups over a shuffled set of enterprises.
  const order = enterprises.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const groups: AnalysisRow[] = [];
  let p = 0;
  for (let g = 0; g < 14163 && p < order.length; g++) {
    const size = pickGroupSize();
    const members = order.slice(p, p + size).map((i) => enterprises[i]);
    p += size;
    const type = pickGroupType();
    const country = type === 'Domestic' ? 'Qatar' : pickCountry();
    const multinational = type === 'Multinational' || (type === 'Foreign-controlled' && rng() < 0.3);
    const gid = 900001 + g;
    const empKnown = members.filter((m) => m.employment != null);
    const employment = empKnown.length ? empKnown.reduce((s, m) => s + (m.employment as number), 0) : null;
    const turnKnown = members.filter((m) => m.turnover != null);
    const head = members[0];
    for (const m of members) {
      Object.assign(m, { group_id: gid, in_group: true, group_type: type, uci_country: country, multinational });
      if (type !== 'Domestic' && !m.parent_country) m.parent_country = country;
    }
    groups.push({
      group_id: gid,
      name: `${String(head.name).replace(/ (W\.L\.L\.|Q\.P\.S\.C\.|Q\.S\.C\.|LLC|FZ LLC)$/, '')} Group`,
      status: rng() < 0.96 ? 'Active' : 'Inactive',
      group_type: type,
      uci_country: country,
      multinational,
      foreign_controlled: type !== 'Domestic',
      reg_year: members.reduce((y, m) => (String(m.reg_year) < y ? String(m.reg_year) : y), '2026'),
      isic_section: head.isic_section,
      isic_division: head.isic_division,
      employment,
      size_class: sizeClassOf(employment),
      turnover: turnKnown.length ? turnKnown.reduce((s, m) => s + (m.turnover as number), 0) : null,
      enterprise_count: members.length,
      establishment_count: members.reduce((s, m) => s + (m.establishment_count as number), 0),
      _b: 0,
      _d: NEVER,
    });
  }

  enterprises.forEach((ent, i) => {
    for (const est of kidsOf[i]) {
      est.turnover = ent.turnover;
      est.foreign_controlled = ent.foreign_controlled;
      est.parent_country = ent.parent_country;
      est.group_id = ent.group_id;
      est.in_group = ent.in_group;
      est.group_type = ent.group_type;
      est.uci_country = ent.uci_country;
      est.multinational = ent.multinational;
    }
  });

  return { establishments, enterprises, groups };
}

function getUniverse(): Universe {
  universe ??= buildUniverse();
  return universe;
}

function buildContacts(): AnalysisRow[] {
  const rng = mulberry32(7);
  const pickRole = picker<string | null>(rng, [['Owner', 60], ['Manager', 35], [null, 5]]);
  const pickSrc = picker<string>(rng, [['MOCI', 70], ['MOCI_CP', 10], ['LEGACY_SBR', 10], ['NORAH_AES', 4], ['CALL_CENTER', 2.5], ['NORAH_QES', 2], ['QFZ', 1], ['QSTP', 0.5]]);
  const out: AnalysisRow[] = [];
  let id = 1;
  for (const est of getUniverse().establishments) {
    const r = rng();
    const n = r < 0.08 ? 0 : r < 0.9 ? 1 : 2;
    for (let k = 0; k < n; k++) {
      out.push({
        contact_id: 300000 + id++,
        role: pickRole(),
        contact_source: pickSrc(),
        has_phone: rng() < 0.7,
        has_mobile: rng() < 0.82,
        has_email: rng() < 0.55,
        has_website: rng() < 0.1,
        _p: est,
        _b: est._b,
        _d: est._d,
      });
    }
  }
  return out;
}

function buildAddresses(): AnalysisRow[] {
  const rng = mulberry32(11);
  const pickSrc = picker<string>(rng, [['MOCI', 78], ['KRMA_OWNER', 8], ['KRMA_ELEC', 6], ['KRMA_QID', 3], ['LEGACY_SBR', 4], ['QSTP', 1]]);
  const out: AnalysisRow[] = [];
  let id = 1;
  for (const est of getUniverse().establishments) {
    if (!est.has_address) continue;
    out.push({
      address_id: 700000 + id++,
      address_source: pickSrc(),
      municipality: est.municipality,
      zone: est.zone,
      has_street: rng() < 0.85,
      has_building: rng() < 0.9,
      has_coordinates: est.has_coordinates,
      _p: est,
      _b: est._b,
      _d: est._d,
    });
  }
  return out;
}

function baseRows(entity: AnalysisEntity): AnalysisRow[] {
  const u = getUniverse();
  switch (entity) {
    case 'establishments': return u.establishments;
    case 'enterprises': return u.enterprises;
    case 'enterpriseGroups': return u.groups;
    case 'contacts': return (contacts ??= buildContacts());
    case 'addresses': return (addresses ??= buildAddresses());
  }
}

function historicView(row: AnalysisRow, f: number): AnalysisRow {
  const hist = row._hist;
  if (!hist || !hist.some((h) => h.until > f)) return row;
  const view: AnalysisRow = { ...row };
  for (let i = hist.length - 1; i >= 0; i--) if (hist[i].until > f) Object.assign(view, hist[i].values);
  return view;
}

// Every unit alive in a frame, with the attribute values it had at that frame.
export function getFrameRows(entity: AnalysisEntity, frameId: string): AnalysisRow[] {
  const key = `${entity}|${frameId}`;
  const cached = frameCache.get(key);
  if (cached) return cached;
  const f = frameIndex(frameId);
  const latest = ANALYSIS_FRAME_CHRONO.length - 1;
  const child = entity === 'contacts' || entity === 'addresses';
  // Child rows re-point `_p` at their establishment's historic view so joined fields match the frame.
  const estViews = child && f !== latest ? new Map(getFrameRows('establishments', frameId).map((e) => [e.sbr_id, e])) : null;
  const out: AnalysisRow[] = [];
  for (const row of baseRows(entity)) {
    if (row._b > f || row._d <= f) continue;
    if (f === latest) { out.push(row); continue; }
    if (estViews) {
      const parent = estViews.get((row._p as AnalysisRow).sbr_id);
      out.push(parent === row._p ? row : { ...row, _p: parent });
      continue;
    }
    out.push(historicView(row, f));
  }
  frameCache.set(key, out);
  return out;
}

