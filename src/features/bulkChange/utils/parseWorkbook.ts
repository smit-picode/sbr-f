import type ExcelJS from 'exceljs';
import type { BulkChangeItemInput } from '../types';

import type { ParsedWorkbook } from '@/features/bulkChange/types';
import type { ExcelJsModule } from '@/types';
const loadExcelJs = async (): Promise<ExcelJsModule> => {
  const mod = await import('exceljs');
  return (mod as unknown as { default?: ExcelJsModule }).default ?? mod;
};

export class WorkbookParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkbookParseError';
  }
}

// Excel cells arrive as strings, numbers, dates, formula results or rich text.
const cellToPrimitive = (value: ExcelJS.CellValue): string | number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value.trim() === '' ? null : value.trim();
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 'Y' : 'N';
  if (value instanceof Date) return value.toISOString().slice(0, 10);

  if (typeof value === 'object') {
    if ('result' in value) return cellToPrimitive((value as { result: ExcelJS.CellValue }).result);
    if ('richText' in value) {
      const text = (value as ExcelJS.CellRichTextValue).richText.map((run) => run.text).join('').trim();
      return text === '' ? null : text;
    }
    if ('text' in value) {
      const text = String((value as { text: unknown }).text).trim();
      return text === '' ? null : text;
    }
    if ('error' in value) return null;
  }
  return String(value).trim() || null;
};

// Headers are matched case-insensitively and with surrounding whitespace stripped
const normaliseHeader = (raw: string): string => raw.trim().toUpperCase().replace(/\s+/g, '_');

const readWorkbook = async (file: File): Promise<ExcelJS.Worksheet> => {
  const ExcelJsLib = await loadExcelJs();
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJsLib.Workbook();

  if (file.name.toLowerCase().endsWith('.csv')) {
    const text = new TextDecoder().decode(buffer);
    const sheet = workbook.addWorksheet('CSV');
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
    lines.forEach((line) => {
      const cells = (line.match(/("([^"]|"")*"|[^,]*)(,|$)/g) ?? [])
        .map((cell) => cell.replace(/,$/, ''))
        .map((cell) => cell.replace(/^"|"$/g, '').replace(/""/g, '"'));
      if (cells.length && cells[cells.length - 1] === '') cells.pop();
      sheet.addRow(cells);
    });
    return sheet;
  }

  try {
    await workbook.xlsx.load(buffer);
  } catch (cause) {
    const detail =
      cause instanceof Error
        ? cause.message
        : (() => {
            try {
              return JSON.stringify(cause);
            } catch {
              return String(cause);
            }
          })();
    throw new WorkbookParseError(`The workbook could not be parsed (${detail}).`);
  }
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new WorkbookParseError('The workbook has no sheets.');
  return sheet;
};

export const parseWorkbook = async (
  file: File,
  idColumn: string,
  allowedColumns: string[],
): Promise<ParsedWorkbook> => {
  const sheet = await readWorkbook(file);

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  const headerByColumn = new Map<number, string>();

  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const raw = cellToPrimitive(cell.value);
    if (raw === null) return;
    const header = normaliseHeader(String(raw));
    headers.push(header);
    headerByColumn.set(colNumber, header);
  });

  if (headers.length === 0) throw new WorkbookParseError('The first row of the file must contain column headers.');

  const allowed = new Set([idColumn, ...allowedColumns]);
  const unknownHeaders = headers.filter((header) => !allowed.has(header));
  const missingIdColumn = !headers.includes(idColumn);

  const items: BulkChangeItemInput[] = [];

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;

    const changeData: Record<string, string | number | null> = {};
    let id: number | null = null;
    let hasAnyValue = false;

    headerByColumn.forEach((header, colNumber) => {
      const value = cellToPrimitive(row.getCell(colNumber).value);
      if (value !== null) hasAnyValue = true;

      if (header === idColumn) {
        const parsed = Number(value);
        id = Number.isInteger(parsed) && parsed > 0 ? parsed : null;
        return;
      }
      changeData[header] = value;
    });

    if (!hasAnyValue) return;

    items.push({
      rowNumber,
      id: id ?? 0,
      changeData,
    });
  });

  return { headers, items, unknownHeaders, missingIdColumn };
};

// Builds the downloadable starter template for an entity
export const buildTemplateWorkbook = async (
  entityLabel: string,
  idColumn: string,
  columns: { key: string; type: string; allowed: string[] | null }[],
  records?: Record<string, string | number | null>[],
): Promise<Blob> => {
  const ExcelJsLib = await loadExcelJs();
  const workbook = new ExcelJsLib.Workbook();
  const sheet = workbook.addWorksheet(entityLabel.slice(0, 31));

  const headers = [idColumn, ...columns.filter((c) => c.key !== idColumn).map((c) => c.key)];
  sheet.addRow(headers);
  sheet.getRow(1).font = { bold: true };

  const hints = headers.map((header) => {
    if (header === idColumn) return 'required — must match an existing record';
    const spec = columns.find((c) => c.key === header);
    if (!spec) return '';
    if (spec.allowed?.length) return `one of: ${spec.allowed.join(' | ')}`;
    return spec.type;
  });
  sheet.addRow(hints);
  sheet.getRow(2).font = { italic: true, color: { argb: 'FF888888' } };

  records?.forEach((record) => {
    sheet.addRow(headers.map((header) => record[header] ?? null));
  });

  sheet.columns.forEach((column) => { column.width = 22; });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};
