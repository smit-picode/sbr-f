import type { TFunction } from 'i18next';
import type { SnapshotRow } from '@/types';
import { SNAPSHOT_EXPORT_FETCH_BATCH, SNAPSHOT_EXPORT_PAGE_SIZE, SNAPSHOT_EXPORT_ROW_LIMIT } from '../constants';
import type { SnapshotExportColumn } from '../components/SnapshotColumns';

type ExcelJsModule = typeof import('exceljs');
type FetchPage = (page: number, limit: number) => Promise<{ rows: SnapshotRow[]; total: number }>;

// exceljs is large and only needed on export, so it loads on demand (same approach as the analysis export).
const loadExcelJs = async (): Promise<ExcelJsModule> => {
  const mod = await import('exceljs');
  return (mod as unknown as { default?: ExcelJsModule }).default ?? mod;
};

const DATE_FORMAT = 'mmm dd, yyyy';

export const snapshotFilename = (snapshotName: string, entityLabel: string): string =>
  `${`${snapshotName}_${entityLabel}`.replace(/[\/:*?"<>|]+/g, '').replace(/\s+/g, '_').slice(0, 80) || 'snapshot'}.xlsx`;

function cellValue(kind: SnapshotExportColumn['kind'], v: unknown): string | number | Date | null {
  if (v == null || v === '') return null;
  if (kind === 'number') {
    const n = Number(v);
    return Number.isNaN(n) ? String(v) : n;
  }
  if (kind === 'date') {
    const d = new Date(String(v));
    return Number.isNaN(d.getTime()) ? String(v) : d;
  }
  return typeof v === 'number' ? v : String(v);
}

// Pulls every page of one frozen table (up to the row cap), a few requests at a time.
export async function fetchAllSnapshotRows(fetchPage: FetchPage): Promise<{ rows: SnapshotRow[]; total: number }> {
  const first = await fetchPage(1, SNAPSHOT_EXPORT_PAGE_SIZE);
  const total = first.total;
  const wanted = Math.min(total, SNAPSHOT_EXPORT_ROW_LIMIT);
  const pages = Math.ceil(wanted / SNAPSHOT_EXPORT_PAGE_SIZE);
  const byPage = new Map<number, SnapshotRow[]>([[1, first.rows]]);
  for (let start = 2; start <= pages; start += SNAPSHOT_EXPORT_FETCH_BATCH) {
    const batch = Array.from({ length: Math.min(SNAPSHOT_EXPORT_FETCH_BATCH, pages - start + 1) }, (_, i) => start + i);
    const results = await Promise.all(batch.map((p) => fetchPage(p, SNAPSHOT_EXPORT_PAGE_SIZE)));
    batch.forEach((p, i) => byPage.set(p, results[i].rows));
  }
  const rows = [...byPage.keys()].sort((a, b) => a - b).flatMap((p) => byPage.get(p) ?? []).slice(0, wanted);
  return { rows, total };
}

export async function buildSnapshotWorkbook(columns: SnapshotExportColumn[], rows: SnapshotRow[], sheetName: string, t: TFunction): Promise<Blob> {
  const ExcelJS = await loadExcelJs();
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName.replace(/[\/?*[\]:]/g, '').slice(0, 31) || t('snapshots.title', { defaultValue: 'Snapshot' }));
  ws.columns = columns.map((c) => ({
    header: c.label,
    key: c.key,
    width: Math.min(40, Math.max(12, c.label.length + 4)),
    style: c.kind === 'date' ? { numFmt: DATE_FORMAT } : undefined,
  }));
  rows.forEach((r) => ws.addRow(Object.fromEntries(columns.map((c) => [c.key, cellValue(c.kind, r[c.key])]))));
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
