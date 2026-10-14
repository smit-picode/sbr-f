import type ExcelJS from 'exceljs';
import type { TFunction } from 'i18next';
import type { SamplingDesign, SamplingField, SamplingRow, SamplingStratum, SamplingTableResult } from '@/types';
import { SAMPLING_CONTACT_COLUMNS, SAMPLING_UNIT_KEY } from '../constants';
import type { Allocation, Precision } from './allocation';
import { contactColumnLabel, describeRootFilter, fieldLabel, groupMethodLabel, unitLabel, valueLabel } from './labels';

type ExcelJsModule = typeof import('exceljs');

// exceljs is large and only needed on export, so it loads on demand (as in the analysis export).
const loadExcelJs = async (): Promise<ExcelJsModule> => {
  const mod = await import('exceljs');
  return (mod as unknown as { default?: ExcelJsModule }).default ?? mod;
};

// The columns DRAW_SAMPLE puts before the requested fields; the export rebuilds them as labelled columns.
const DESIGN_COLUMNS = new Set(['GROUP_NO', 'SELECTION_METHOD', 'STRATUM_KEY', 'S1', 'S2', 'S3', 'S4', 'SAMPLE_ROLE', 'SELECTION_ORDER',
  'STRATUM_POPULATION', 'STRATUM_SAMPLE', 'DESIGN_WEIGHT', 'UNIT_ID']);
// Excel refuses a cell longer than this.
const EXCEL_CELL_MAX = 32000;
const HEADER_FILL = 'FFF4F0E8';

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function styleHeader(sheet: ExcelJS.Worksheet, widths: number[]) {
  const header = sheet.getRow(1);
  header.font = { bold: true };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  widths.forEach((w, i) => { sheet.getColumn(i + 1).width = w; });
  if (sheet.columnCount) sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } };
}

export interface SampleExportInput {
  t: TFunction;
  design: SamplingDesign;
  fields: SamplingField[];
  estFields: SamplingField[];
  frameName: string;
  strata: SamplingStratum[];
  // Per group index: the random group's allocation and precision (census and manual groups have none).
  allocations: Record<number, Allocation>;
  precisions: Record<number, Precision>;
  draw: SamplingTableResult;
  establishments: SamplingTableResult | null;
  contacts: SamplingRow[] | null;
}

// "Field: value · Field: value" for a row's stratum in its group.
function stratumText(t: TFunction, design: SamplingDesign, fields: SamplingField[], groupNo: number, row: Record<string, unknown>): string {
  const g = design.groups[groupNo - 1];
  if (!g || g.method !== 'random' || !g.strata.length) return '';
  const origin = (f: string) => fields.find((x) => x.FIELD_NAME === f)?.ORIGIN;
  return g.strata.map((s, i) => `${fieldLabel(t, s.column, origin(s.column))}: ${valueLabel(t, s.column, row[`S${i + 1}`] as string | null)}`).join(' · ');
}

export async function exportSampleWorkbook(input: SampleExportInput): Promise<Blob> {
  const { t, design, fields, estFields, frameName, strata, allocations, precisions, draw, establishments, contacts } = input;
  const ExcelJsLib = await loadExcelJs();
  const wb = new ExcelJsLib.Workbook();
  wb.created = new Date();
  const fieldOf = (list: SamplingField[], f: string) => list.find((x) => x.FIELD_NAME === f);
  const cellValue = (list: SamplingField[], f: string, v: unknown) =>
    (fieldOf(list, f)?.KIND === 'date' && v != null ? new Date(String(v)) : (v ?? null));
  const groupName = (no: number) => design.groups[no - 1]?.name ?? String(no);
  const role = (r: unknown) => (r === 'MAIN' ? t('sampling.roleMain', { defaultValue: 'Main' }) : t('sampling.roleReserve', { defaultValue: 'Reserve' }));
  const keyName = fieldLabel(t, SAMPLING_UNIT_KEY[design.unit]);

  // 1. The sampled units.
  const outFields = draw.columns.filter((c) => !DESIGN_COLUMNS.has(c));
  const units = wb.addWorksheet(t('sampling.export.sheetSample', { defaultValue: 'Sample' }));
  units.addRow([
    t('sampling.group', { defaultValue: 'Group' }), t('sampling.export.method', { defaultValue: 'Selection' }),
    t('sampling.stratum', { defaultValue: 'Stratum' }), t('sampling.export.role', { defaultValue: 'Role' }),
    t('sampling.export.order', { defaultValue: 'Selection order' }), t('sampling.export.stratumN', { defaultValue: 'Stratum population (N)' }),
    t('sampling.export.stratumn', { defaultValue: 'Stratum sample (n)' }), t('sampling.export.weight', { defaultValue: 'Design weight (N/n)' }),
    keyName, ...outFields.map((f) => fieldLabel(t, f, fieldOf(fields, f)?.ORIGIN)),
  ]);
  for (const r of draw.rows) {
    const g = Number(r.GROUP_NO);
    units.addRow([
      groupName(g), groupMethodLabel(t, String(r.SELECTION_METHOD).toLowerCase()), stratumText(t, design, fields, g, r),
      role(r.SAMPLE_ROLE), r.SELECTION_ORDER, r.STRATUM_POPULATION, r.STRATUM_SAMPLE, r.DESIGN_WEIGHT, r.UNIT_ID,
      ...outFields.map((f) => cellValue(fields, f, r[f])),
    ]);
  }
  styleHeader(units, [24, 16, 34, 10, 10, 14, 14, 14, 14, ...outFields.map((f) => (f.startsWith('NAME') ? 36 : 18))]);
  units.getColumn(8).numFmt = '0.0000';
  outFields.forEach((f, i) => { if (fieldOf(fields, f)?.KIND === 'date') units.getColumn(10 + i).numFmt = 'yyyy-mm-dd'; });

  // 2. Every establishment of the sampled enterprises.
  const sbrToEnterprise = new Map<number, number>();
  if (establishments) {
    const estOut = establishments.columns.filter((c) => c !== 'ENTERPRISE_ID' && c !== 'SBR_ID');
    const es = wb.addWorksheet(t('sampling.export.sheetEstablishments', { defaultValue: 'Establishments' }));
    es.addRow([fieldLabel(t, 'ENTERPRISE_ID'), fieldLabel(t, 'SBR_ID'), ...estOut.map((f) => fieldLabel(t, f, fieldOf(estFields, f)?.ORIGIN))]);
    for (const r of establishments.rows) {
      sbrToEnterprise.set(Number(r.SBR_ID), Number(r.ENTERPRISE_ID));
      es.addRow([r.ENTERPRISE_ID, r.SBR_ID, ...estOut.map((f) => cellValue(estFields, f, r[f]))]);
    }
    styleHeader(es, [14, 12, ...estOut.map((f) => (f.startsWith('NAME') ? 36 : 18))]);
    estOut.forEach((f, i) => { if (fieldOf(estFields, f)?.KIND === 'date') es.getColumn(3 + i).numFmt = 'yyyy-mm-dd'; });
  }

  // 3. Their contacts.
  if (contacts) {
    const cs = wb.addWorksheet(t('sampling.export.sheetContacts', { defaultValue: 'Contacts' }));
    const withEnterprise = design.unit === 'enterprise';
    cs.addRow([...(withEnterprise ? [fieldLabel(t, 'ENTERPRISE_ID')] : []), ...SAMPLING_CONTACT_COLUMNS.map((c) => contactColumnLabel(t, c))]);
    for (const r of contacts) {
      cs.addRow([
        ...(withEnterprise ? [sbrToEnterprise.get(Number(r.SBR_ID)) ?? null] : []),
        ...SAMPLING_CONTACT_COLUMNS.map((c) => (c === 'MATCH' ? t(`sampling.match.${r[c]}`, { defaultValue: String(r[c]) })
          : c === 'IS_PRIMARY' ? (r[c] === 'Y' ? t('sampling.yes', { defaultValue: 'Yes' }) : null) : (r[c] ?? null))),
      ]);
    }
    styleHeader(cs, [...(withEnterprise ? [14] : []), 12, 12, 28, 14, 16, 16, 30, 14, 12, 24, 18, 10, 16]);
  }

  // 4. The design: one row per group and stratum.
  const drawn = new Map<string, { main: number; reserve: number }>();
  for (const r of draw.rows) {
    const d = drawn.get(r.STRATUM_KEY as string) ?? { main: 0, reserve: 0 };
    if (r.SAMPLE_ROLE === 'MAIN') d.main += 1; else d.reserve += 1;
    drawn.set(r.STRATUM_KEY as string, d);
  }
  const ds = wb.addWorksheet(t('sampling.export.sheetDesign', { defaultValue: 'Design' }));
  ds.addRow([
    t('sampling.group', { defaultValue: 'Group' }), t('sampling.export.method', { defaultValue: 'Selection' }), t('sampling.stratum', { defaultValue: 'Stratum' }),
    'N', t('sampling.export.auxMean', { defaultValue: 'Auxiliary mean' }), t('sampling.export.auxSd', { defaultValue: 'Auxiliary SD' }),
    'n', t('sampling.export.reserve', { defaultValue: 'Reserve' }), t('sampling.export.fraction', { defaultValue: 'Sampling fraction' }),
    t('sampling.export.weight', { defaultValue: 'Design weight (N/n)' }),
    t('sampling.export.drawnMain', { defaultValue: 'Drawn (main)' }), t('sampling.export.drawnReserve', { defaultValue: 'Drawn (reserve)' }),
  ]);
  let totN = 0; let totn = 0; let totR = 0;
  for (const s of strata) {
    const g = design.groups[s.GROUP_NO - 1];
    const a = allocations[s.GROUP_NO - 1]?.strata.find((x) => x.key === s.STRATUM_KEY);
    const n = a ? a.n : s.N;
    const reserve = a ? a.reserve : 0;
    const d = drawn.get(s.STRATUM_KEY) ?? { main: 0, reserve: 0 };
    totN += s.N; totn += n; totR += reserve;
    ds.addRow([
      g?.name ?? s.GROUP_NO, groupMethodLabel(t, g?.method ?? ''), stratumText(t, design, fields, s.GROUP_NO, s as unknown as Record<string, unknown>),
      s.N, s.AUX_MEAN, s.AUX_SD, n, reserve, s.N ? n / s.N : null, n ? s.N / n : null, d.main, d.reserve,
    ]);
  }
  ds.addRow([t('sampling.total', { defaultValue: 'Total' }), null, null, totN, null, null, totn, totR, totN ? totn / totN : null, null,
    draw.rows.filter((r) => r.SAMPLE_ROLE === 'MAIN').length, draw.rows.filter((r) => r.SAMPLE_ROLE !== 'MAIN').length]).font = { bold: true };
  styleHeader(ds, [24, 16, 40, 12, 14, 14, 10, 10, 14, 14, 12, 14]);
  [5, 6].forEach((c) => { ds.getColumn(c).numFmt = '0.00'; });
  [9, 10].forEach((c) => { ds.getColumn(c).numFmt = '0.0000'; });

  // 5. Everything needed to repeat the draw.
  const st = wb.addWorksheet(t('sampling.export.sheetSettings', { defaultValue: 'Settings' }));
  const origin = (f: string) => fieldOf(fields, f)?.ORIGIN;
  const bandText = (b?: number[]) => (b?.length ? ` (${t('sampling.bandsAt', { defaultValue: 'bands at' })} ${b.join(', ')})` : '');
  const designJson = JSON.stringify(design);
  const settings: [string, string | number | null][] = [
    [t('sampling.export.drawnAt', { defaultValue: 'Drawn at' }), new Date().toLocaleString('en-GB')],
    [t('sampling.frame', { defaultValue: 'Frame' }), frameName],
    [t('sampling.unitLabel', { defaultValue: 'Sampling unit' }), unitLabel(t, design.unit)],
    [t('sampling.population', { defaultValue: 'Population' }), describeRootFilter(t, design.filter, fields)],
    [t('sampling.auxiliary', { defaultValue: 'Auxiliary field' }), design.auxColumn ? fieldLabel(t, design.auxColumn, origin(design.auxColumn)) : null],
    [t('sampling.seed', { defaultValue: 'Seed' }), design.seed],
  ];
  design.groups.forEach((g, i) => {
    const head = `${t('sampling.group', { defaultValue: 'Group' })} ${i + 1}: ${g.name}`;
    const parts = [groupMethodLabel(t, g.method)];
    if (g.method !== 'manual') parts.push(describeRootFilter(t, g.filter, fields));
    if (g.method === 'manual') parts.push(t('sampling.idsParsed', { defaultValue: '{{n}} ids', n: g.manualIds.split(/[\s,;]+/).filter(Boolean).length }));
    if (g.method === 'random') {
      parts.push(`${t('sampling.strata', { defaultValue: 'Strata' })}: ${g.strata.map((s) => `${fieldLabel(t, s.column, origin(s.column))}${bandText(s.breaks)}`).join(' × ') || t('sampling.noStrata', { defaultValue: 'none' })}`);
      parts.push(`${t('sampling.method', { defaultValue: 'Allocation' })}: ${t(`sampling.methods.${g.allocation.method}`, { defaultValue: g.allocation.method })}`);
      const p = precisions[i];
      if (p?.cv != null) parts.push(`${t('sampling.export.expectedCv', { defaultValue: 'Expected CV of the auxiliary total' })}: ${(p.cv * 100).toFixed(2)}%`);
    }
    settings.push([head, parts.join(' | ')]);
  });
  settings.push([t('sampling.export.method', { defaultValue: 'Selection' }), t('sampling.export.methodText', { defaultValue: 'Simple random sampling without replacement within each stratum, ordered by an MD5 hash of the seed and the unit id; reserve units follow the main units in that order. Full-population and hand-picked units are taken whole, at weight 1.' })]);
  if (design.contacts.include) {
    settings.push([t('sampling.contactTags', { defaultValue: 'Only contacts tagged' }), design.contacts.tags.join(', ') || t('sampling.allContacts', { defaultValue: 'every contact' })]);
    if (design.contacts.tags.length) {
      settings.push([t('sampling.fallbackLabel', { defaultValue: 'An establishment with no contact tagged like this' }),
        design.contacts.fallback === 'ALL' ? t('sampling.fallbackAll', { defaultValue: 'gets all its contacts' }) : t('sampling.fallbackNone', { defaultValue: 'gets no contact' })]);
    }
  }
  settings.push([t('sampling.export.designJson', { defaultValue: 'Design (load it in the Sample Builder)' }),
    designJson.length <= EXCEL_CELL_MAX ? designJson : t('sampling.export.designTooLong', { defaultValue: 'Too long for a cell: use "Save design" on the page.' })]);
  for (const row of settings) st.addRow(row);
  st.getColumn(1).width = 34;
  st.getColumn(2).width = 120;
  st.getColumn(1).font = { bold: true };
  st.getColumn(2).alignment = { wrapText: true, vertical: 'top' };

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
