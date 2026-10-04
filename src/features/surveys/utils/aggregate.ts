import { CROSS_TAB_MIN_BASE, SIZE_BANDS, SURVEYS } from '../constants';
import { isicSection, sizeBandOf } from './classify';
import type {
  ActivitySizeCrossTab,
  CrossTabCell,
  DistributionItem,
  ResponseStatus,
  ResponseTally,
  SampleRow,
  SampleSummary,
  SizeBand,
  Survey,
  SurveyResponseApiRow,
  SurveySample,
  SurveySampleApiRow,
} from '../types';

export function surveyById(id: string): Survey | undefined {
  return SURVEYS.find((s) => s.id === id);
}

// Responded + partial as a share of the sample, to one decimal.
const rateOf = (answered: number, size: number) => (size ? Math.round((answered / size) * 1000) / 10 : 0);

export function toSamples(rows: SurveySampleApiRow[]): SurveySample[] {
  return rows.flatMap((r) => {
    const survey = surveyById(r.SURVEY_ID);
    if (!survey) return [];
    return [{
      surveyId: survey.id,
      survey,
      period: r.PERIOD,
      size: r.SAMPLE_SIZE,
      responded: r.RESPONDED,
      partial: r.PARTIAL,
      nonResponse: r.NON_RESPONSE,
      pending: r.PENDING,
      rate: rateOf(r.RESPONDED + r.PARTIAL, r.SAMPLE_SIZE),
    }];
  });
}

export function toSampleRows(rows: SurveyResponseApiRow[]): SampleRow[] {
  return rows.map((r) => ({
    surveyId: r.SURVEY_ID,
    period: r.PERIOD,
    status: r.RESPONSE_STATUS,
    mode: r.COLLECTION_MODE,
    respondedAt: r.RESPONDED_ON,
    frame: {
      SBR_ID: r.SBR_ID,
      NAME_ENU: r.NAME_ENU,
      NAME_ARA: r.NAME_ARA,
      MOCI_CR_NUM: r.MOCI_CR_NUM,
      SOURCE_CODE: r.SOURCE_CODE,
      SECTOR_ID: r.SECTOR_ID,
      ISIC_CODE: r.ISIC_CODE,
      EMPLOYMENT_COUNT: r.EMPLOYMENT_COUNT ?? null,
    },
  }));
}

export function summarize(rows: SampleRow[]): SampleSummary {
  const c = { size: rows.length, responded: 0, partial: 0, nonResponse: 0, pending: 0, rate: 0 };
  rows.forEach((r) => {
    if (r.status === 'Responded') c.responded++;
    else if (r.status === 'Partial') c.partial++;
    else if (r.status === 'Non-response') c.nonResponse++;
    else c.pending++;
  });
  c.rate = rateOf(c.responded + c.partial, c.size);
  return c;
}

// One row per establishment, keeping its first membership; the API returns rows oldest sample first.
export function distinctRows(rows: SampleRow[]): SampleRow[] {
  const seen = new Set<number>();
  return rows.filter((r) => {
    if (seen.has(r.frame.SBR_ID)) return false;
    seen.add(r.frame.SBR_ID);
    return true;
  });
}

type FrameKey = 'SECTOR_ID' | 'SOURCE_CODE' | 'ISIC_CODE';

export function distribution(rows: SampleRow[], key: FrameKey): DistributionItem[] {
  const m = new Map<string, number>();
  rows.forEach((r) => {
    const v = r.frame[key] || '—';
    m.set(v, (m.get(v) || 0) + 1);
  });
  return [...m.entries()].map(([k, count]) => ({ key: k, count })).sort((a, b) => b.count - a.count);
}

export function statusDistribution(rows: SampleRow[]): { key: ResponseStatus; count: number }[] {
  const m = new Map<ResponseStatus, number>();
  rows.forEach((r) => m.set(r.status, (m.get(r.status) || 0) + 1));
  return [...m.entries()].map(([key, count]) => ({ key, count }));
}

type Tally = Omit<ResponseTally, 'rate' | 'reliable'>;
const blankTally = (): Tally => ({ base: 0, answered: 0, responded: 0, partial: 0, nonResponse: 0, pending: 0 });

function tally(t: Tally, status: ResponseStatus) {
  t.base++;
  if (status === 'Responded') { t.responded++; t.answered++; }
  else if (status === 'Partial') t.partial++;
  else if (status === 'Non-response') t.nonResponse++;
  else t.pending++;
}

function finish<T extends Tally>(t: T, minBase: number): T & { rate: number; reliable: boolean } {
  return { ...t, rate: rateOf(t.answered, t.base), reliable: t.base >= minBase };
}

// ISIC section × size class over distinct establishments; units with no recorded headcount have no class and are left out.
export function responseByActivityAndSize(distinct: SampleRow[], minBase = CROSS_TAB_MIN_BASE): ActivitySizeCrossTab {
  const cells = new Map<string, Tally & { section: string; band: SizeBand }>();
  const bySec = new Map<string, Tally & { section: string }>();
  const byBand = new Map<SizeBand, Tally & { band: SizeBand }>();
  let counted = 0;
  distinct.forEach((r) => {
    const band = sizeBandOf(r.frame.EMPLOYMENT_COUNT);
    if (!band) return;
    const section = isicSection(r.frame.ISIC_CODE) || '—';
    counted++;
    const ck = `${section}|${band}`;
    if (!cells.has(ck)) cells.set(ck, { section, band, ...blankTally() });
    if (!bySec.has(section)) bySec.set(section, { section, ...blankTally() });
    if (!byBand.has(band)) byBand.set(band, { band, ...blankTally() });
    tally(cells.get(ck)!, r.status);
    tally(bySec.get(section)!, r.status);
    tally(byBand.get(band)!, r.status);
  });
  return {
    sections: [...bySec.values()].map((v) => finish(v, minBase)).sort((a, b) => a.rate - b.rate),
    bands: SIZE_BANDS.map((b) => byBand.get(b.key)).filter((v): v is Tally & { band: SizeBand } => !!v).map((v) => finish(v, minBase)),
    cells: [...cells.values()].map((v) => finish(v, minBase)) as CrossTabCell[],
    minBase,
    total: counted,
  };
}
