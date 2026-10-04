import type ExcelJS from 'exceljs';
import type { TFunction } from 'i18next';
import * as echarts from 'echarts';
import type {
  Analysis,
  AnalysisAggregateResult,
  AnalysisBlock,
  AnalysisCompletenessResult,
  AnalysisCrossFilter,
  AnalysisFlowResult,
  AnalysisResolvedQuery,
} from '@/types';
import { fetchRecordExtract, runAnalysis } from '../api/analysisService';
import { ANALYSIS_DISCLOSURE, ANALYSIS_ENTITIES, ANALYSIS_EXPORT_ROW_LIMIT } from '../constants';
import { requestForBlock, resolveBlockQuery } from '../engine/resolve';
import { entityLabel, fieldLabel, frameName, measureLabel, recordValue, valueLabel } from './labels';

type Cell = string | number | null;

interface BlockTable {
  title: string;
  notes: string[];
  header: string[];
  rows: Cell[][];
}

type ExcelJsModule = typeof import('exceljs');

// exceljs is large and only needed on export, so it loads on demand (same approach as bulk change).
const loadExcelJs = async (): Promise<ExcelJsModule> => {
  const mod = await import('exceljs');
  return (mod as unknown as { default?: ExcelJsModule }).default ?? mod;
};

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function safeFilename(name: string): string {
  return (name || 'analysis').replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '_').slice(0, 80);
}

function describeQuery(t: TFunction, q: AnalysisResolvedQuery): string[] {
  const notes = [
    `${t('analysis.export.unit', { defaultValue: 'Unit' })}: ${entityLabel(t, q.entity)}`,
    `${t('analysis.export.frame', { defaultValue: 'Frame' })}: ${frameName(t, q.frame)}${q.compareTo ? ` — ${t('analysis.vsFrame', { defaultValue: 'vs {{frame}}', frame: frameName(t, q.compareTo) })}` : ''}`,
  ];
  if (q.filters.length) {
    notes.push(`${t('analysis.export.filters', { defaultValue: 'Filters' })}: ${q.filters.map((f) => `${fieldLabel(t, f.field)} ${f.op === 'in' || f.op === 'not_in' ? `${f.op === 'not_in' ? '≠ ' : '= '}${(f.values ?? []).map((v) => valueLabel(t, f.field, v, true)).join(', ')}` : f.op === 'between' ? `${f.min ?? ''}–${f.max ?? ''}` : f.op === 'contains' ? `~ ${f.text}` : f.op}`).join('; ')}`);
  }
  return notes;
}

export async function buildBlockTable(block: AnalysisBlock, q: AnalysisResolvedQuery, t: TFunction, suppress: boolean): Promise<BlockTable> {
  const title = block.title || block.type;
  const notes = describeQuery(t, q);
  const req = requestForBlock(block, q);

  if (block.type === 'records' || !req) {
    const columns = q.columns.length ? q.columns : ANALYSIS_ENTITIES[q.entity].defaultColumns;
    const { rows, total } = await fetchRecordExtract(q, columns, ANALYSIS_EXPORT_ROW_LIMIT);
    if (total > rows.length) notes.push(t('analysis.export.truncated', { defaultValue: 'First {{n}} of {{total}} units', n: rows.length.toLocaleString(), total: total.toLocaleString() }));
    return {
      title,
      notes,
      header: columns.map((c) => fieldLabel(t, c)),
      rows: rows.map((r) => columns.map((c) => (typeof r[c] === 'number' ? (r[c] as number) : r[c] == null ? null : recordValue(t, c, r[c])))),
    };
  }

  const result = await runAnalysis(req);

  if (result.kind === 'completeness') {
    const r = result as AnalysisCompletenessResult;
    const dim = q.dimensions[0];
    return {
      title,
      notes,
      header: [t('analysis.completeness.field', { defaultValue: 'Field' }), ...r.groups.map((g) => valueLabel(t, dim, g)), t('analysis.completeness.overall', { defaultValue: 'Overall' })],
      rows: r.fields.map((f, i) => [fieldLabel(t, f), ...r.cells[i].map((v) => Math.round(v * 1000) / 10)]),
    };
  }

  if (result.kind === 'flow') {
    const r = result as AnalysisFlowResult;
    const dim = q.dimensions[0];
    const rows: Cell[][] = [
      [frameName(t, r.compareTo), r.start],
      [t('analysis.flow.births', { defaultValue: 'Births' }), r.births],
      [t('analysis.flow.deaths', { defaultValue: 'Deaths' }), -r.deaths],
      [t('analysis.flow.movedIn', { defaultValue: 'Moved in' }), r.movedIn],
      [t('analysis.flow.movedOut', { defaultValue: 'Moved out' }), -r.movedOut],
      [frameName(t, r.frame), r.end],
    ];
    if (dim && r.links.length) {
      rows.push([], [t('analysis.export.from', { defaultValue: 'From' }), t('analysis.export.to', { defaultValue: 'To' }), t('analysis.export.units', { defaultValue: 'Units' })]);
      for (const l of r.links) rows.push([valueLabel(t, dim, l.from), valueLabel(t, dim, l.to), suppress && l.value < ANALYSIS_DISCLOSURE.minCell ? 'x' : l.value]);
    }
    return { title, notes, header: [t('analysis.export.step', { defaultValue: 'Step' }), t('analysis.export.units', { defaultValue: 'Units' })], rows };
  }

  const r = result as AnalysisAggregateResult;
  const show = (row: { flag?: string }, v: number | null): Cell => (suppress && row.flag ? 'x' : v);
  const mLabels = r.measures.map((m) => measureLabel(t, m, q.entity));
  if (suppress && r.rows.some((x) => x.flag)) {
    notes.push(t('analysis.export.suppressionNote', { defaultValue: 'x = suppressed for confidentiality (fewer than {{min}} units, a dominant unit, or to protect such a cell).', min: ANALYSIS_DISCLOSURE.minCell }));
  }

  if ((block.type === 'pivot' || block.type === 'heatmap') && r.dimensions.length === 2) {
    const [d0, d1] = r.dimensions;
    const rowKeys = [...new Set(r.rows.map((x) => x.keys[0]))];
    const colKeys = [...new Set(r.rows.map((x) => x.keys[1]))];
    const by = new Map(r.rows.map((x) => [x.keys.join('\u0001'), x]));
    return {
      title,
      notes: [...notes, mLabels[0]],
      header: [`${fieldLabel(t, d0)} \\ ${fieldLabel(t, d1)}`, ...colKeys.map((c) => valueLabel(t, d1, c))],
      rows: rowKeys.map((rk) => [valueLabel(t, d0, rk), ...colKeys.map((ck) => { const x = by.get([rk, ck].join('\u0001')); return x ? show(x, x.values[0]) : null; })]),
    };
  }

  const compare = !!r.compareTo;
  const header = [
    ...r.dimensions.map((d) => fieldLabel(t, d)),
    ...mLabels,
    ...(compare ? [`${mLabels[0]} — ${frameName(t, r.compareTo)}`, 'Δ', 'Δ %'] : []),
  ];
  const rows: Cell[][] = r.rows.map((x) => {
    const curr = x.values[0];
    const prev = x.prev?.[0] ?? null;
    return [
      ...x.keys.map((k, i) => valueLabel(t, r.dimensions[i], k)),
      ...x.values.map((v) => show(x, v)),
      ...(compare ? [show(x, prev), show(x, curr != null && prev != null ? curr - prev : null), show(x, curr != null && prev ? Math.round(((curr - prev) / prev) * 1000) / 10 : null)] : []),
    ];
  });
  if (r.dimensions.length) {
    rows.push([t('analysis.total', { defaultValue: 'Total' }), ...r.dimensions.slice(1).map(() => ''), ...r.total.values, ...(compare ? [r.total.prev?.[0] ?? null, null, null] : [])]);
  }
  return { title, notes, header, rows };
}

function addSheet(wb: ExcelJS.Workbook, name: string, table: BlockTable) {
  const ws = wb.addWorksheet(name);
  ws.addRow([table.title]).font = { bold: true, size: 13 };
  for (const n of table.notes) ws.addRow([n]).font = { italic: true, color: { argb: 'FF64748B' } };
  ws.addRow([]);
  const head = ws.addRow(table.header);
  head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  head.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF87795D' } }; });
  for (const r of table.rows) ws.addRow(r);
  ws.columns.forEach((col, i) => { col.width = i === 0 ? 34 : 18; });
  ws.views = [{ state: 'frozen', ySplit: table.notes.length + 3 }];
}

function uniqueSheetName(used: Set<string>, raw: string): string {
  const base = raw.replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 28) || 'Block';
  let name = base;
  let i = 2;
  while (used.has(name.toLowerCase())) name = `${base.slice(0, 25)} (${i++})`;
  used.add(name.toLowerCase());
  return name;
}

export async function exportBlockXlsx(block: AnalysisBlock, q: AnalysisResolvedQuery, t: TFunction, suppress: boolean) {
  const ExcelJs = await loadExcelJs();
  const wb = new ExcelJs.Workbook();
  addSheet(wb, uniqueSheetName(new Set(), block.title || 'Block'), await buildBlockTable(block, q, t, suppress));
  const buf = await wb.xlsx.writeBuffer();
  download(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${safeFilename(block.title)}.xlsx`);
}

export async function exportBlockCsv(block: AnalysisBlock, q: AnalysisResolvedQuery, t: TFunction, suppress: boolean) {
  const table = await buildBlockTable(block, q, t, suppress);
  const esc = (v: Cell) => {
    let s = v == null ? '' : String(v);
    // Text starting with = + - @ would run as a formula when the CSV is opened in Excel.
    if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [table.header, ...table.rows].map((r) => r.map(esc).join(','));
  // BOM so Excel opens Arabic text correctly.
  download(new Blob([`﻿${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' }), `${safeFilename(block.title)}.csv`);
}

export async function exportReportXlsx(analysis: Analysis, cross: AnalysisCrossFilter[], t: TFunction, suppress: boolean) {
  const ExcelJs = await loadExcelJs();
  const wb = new ExcelJs.Workbook();
  wb.creator = analysis.ownerName || analysis.ownerEmail;
  const used = new Set<string>();
  const summary = wb.addWorksheet(uniqueSheetName(used, t('analysis.export.summary', { defaultValue: 'Summary' })));
  summary.addRow([analysis.name]).font = { bold: true, size: 15 };
  if (analysis.description) summary.addRow([analysis.description]);
  summary.addRow([`${t('analysis.export.frame', { defaultValue: 'Frame' })}: ${frameName(t, analysis.frame)}${analysis.compareTo ? ` — ${t('analysis.vsFrame', { defaultValue: 'vs {{frame}}', frame: frameName(t, analysis.compareTo) })}` : ''}`]);
  summary.addRow([`${t('analysis.export.generated', { defaultValue: 'Generated' })}: ${new Date().toLocaleString()}`]);
  if (suppress) summary.addRow([t('analysis.export.disclosure', { defaultValue: 'Statistical disclosure control applied: cells built from fewer than {{min}} units are suppressed (x).', min: ANALYSIS_DISCLOSURE.minCell })]);
  summary.addRow([]);
  summary.getColumn(1).width = 90;
  for (const block of analysis.blocks) {
    if (block.type === 'text') continue;
    const q = resolveBlockQuery(block, analysis, cross);
    const name = uniqueSheetName(used, block.title || block.type);
    summary.addRow([`• ${name}`]);
    addSheet(wb, name, await buildBlockTable(block, q, t, suppress));
  }
  const buf = await wb.xlsx.writeBuffer();
  download(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${safeFilename(analysis.name)}.xlsx`);
}

export function exportBlockPng(block: AnalysisBlock): boolean {
  const el = document.querySelector(`[data-block-chart="${block.id}"] [_echarts_instance_]`) as HTMLElement | null;
  const chart = el ? echarts.getInstanceByDom(el) : undefined;
  if (!chart) return false;
  const a = document.createElement('a');
  a.href = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' });
  a.download = `${safeFilename(block.title)}.png`;
  a.click();
  return true;
}
