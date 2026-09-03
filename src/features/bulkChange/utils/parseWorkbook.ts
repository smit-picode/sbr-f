import type ExcelJS from 'exceljs';
import type { BulkChangeItemInput } from '../types';

// exceljs is ~250 kB and is only needed once the operator actually picks a file, so it is
// imported on demand rather than bundled into the wizard's first load. Every entry point here
// is already async, so this costs nothing at the call sites.
type ExcelJsModule = typeof import('exceljs');

const loadExcelJs = async (): Promise<ExcelJsModule> => {
  const mod = await import('exceljs');
  // exceljs ships a CommonJS entry, so bundler interop can put the API on `default` or
  // directly on the namespace. Accept either rather than assuming one.
  return (mod as unknown as { default?: ExcelJsModule }).default ?? mod;
};

// Client-side workbook reader for the bulk-change wizard.
//
// Parsing happens in the browser so no file ever has to be uploaded, stored or virus-scanned
// server-side. It is NOT the validation step: everything that decides whether a row may be
// submitted (does the record exist, is the column editable, is the value legal, does it
// actually differ) is recomputed by POST /bulk-change/validate against live data. This module
// only turns a spreadsheet into rows.

export interface ParsedWorkbook {
  // Column headers found in the file, in sheet order.
  headers: string[];
  items: BulkChangeItemInput[];
  // Headers present in the file that are not part of the template. Reported so the operator
  // can fix the file rather than silently having columns ignored.
  unknownHeaders: string[];
  // Set when the file has rows but the identifier column is absent altogether.
  missingIdColumn: boolean;
}

export class WorkbookParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkbookParseError';
  }
}

// Excel cells arrive as strings, numbers, dates, formula results or rich text. Flatten each to
// the string/number/null the API expects, without inventing values.
const cellToPrimitive = (value: ExcelJS.CellValue): string | number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value.trim() === '' ? null : value.trim();
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 'Y' : 'N';
  // Dates are normalised to YYYY-MM-DD, the format CHANGE_DATA documents for date columns.
  if (value instanceof Date) return value.toISOString().slice(0, 10);

  if (typeof value === 'object') {
    // Formula cell — take the computed result, not the formula text.
    if ('result' in value) return cellToPrimitive((value as { result: ExcelJS.CellValue }).result);
    // Rich text — concatenate the runs.
    if ('richText' in value) {
      const text = (value as ExcelJS.CellRichTextValue).richText.map((run) => run.text).join('').trim();
      return text === '' ? null : text;
    }
    // Hyperlink cell — the visible text is what the operator meant to type.
    if ('text' in value) {
      const text = String((value as { text: unknown }).text).trim();
      return text === '' ? null : text;
    }
    if ('error' in value) return null;
  }
  return String(value).trim() || null;
};

// Headers are matched case-insensitively and with surrounding whitespace stripped, so a file
// with "sbr_id " still lines up with SBR_ID. Everything downstream uses the canonical name.
const normaliseHeader = (raw: string): string => raw.trim().toUpperCase().replace(/\s+/g, '_');

const readWorkbook = async (file: File): Promise<ExcelJS.Worksheet> => {
  const ExcelJsLib = await loadExcelJs();
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJsLib.Workbook();

  if (file.name.toLowerCase().endsWith('.csv')) {
    // exceljs's CSV reader takes a stream in Node; in the browser the text is loaded and
    // written into a sheet directly, which keeps one code path for both formats downstream.
    const text = new TextDecoder().decode(buffer);
    const sheet = workbook.addWorksheet('CSV');
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
    lines.forEach((line) => {
      // Split on commas that are not inside double quotes, then unquote.
      const cells = (line.match(/("([^"]|"")*"|[^,]*)(,|$)/g) ?? [])
        .map((cell) => cell.replace(/,$/, ''))
        .map((cell) => cell.replace(/^"|"$/g, '').replace(/""/g, '"'));
      if (cells.length && cells[cells.length - 1] === '') cells.pop();
      sheet.addRow(cells);
    });
    return sheet;
  }

  await workbook.xlsx.load(buffer);
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
    if (rowNumber === 1) return; // header

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
      // Unknown headers are carried through rather than dropped: the server reports them as
      // UNKNOWN_COLUMN against the specific row, which is more useful than silently ignoring
      // a column the operator believed they were filling in.
      changeData[header] = value;
    });

    // A wholly blank line (trailing rows Excel leaves behind) is skipped, not reported.
    if (!hasAnyValue) return;

    items.push({
      rowNumber,
      // 0 is never a valid id; the server reports it as ID_MISSING / ID_NOT_NUMERIC against
      // this row number, so the operator sees which spreadsheet line is at fault.
      id: id ?? 0,
      changeData,
    });
  });

  return { headers, items, unknownHeaders, missingIdColumn };
};

// Builds the downloadable starter template for an entity: one header row of the identifier
// plus every editable column, with a comment row describing allowed values.
//
// `records`, when given, fills the sheet with the operator's actual current
// rows instead of leaving it blank — the row's own ID rides along pre-filled, so an operator
// building an upload for Contacts/Addresses never has to discover or type it themselves. Column
// SHAPE is exactly idColumn + `columns`, in the order the caller passes them — `columns` already
// includes SBR_ID as an ordinary (non-required) reference column for Contacts/Addresses (see
// BulkChangeSetupStep's template.columns), so it rides along in the file too; parseWorkbook
// accepts it back the same way as any other non-identifier column (present in allowedColumns,
// its value carried through in changeData, silently dropped server-side — see
// stripSbrIdReference in bulkChange.controller.ts) rather than being flagged UNKNOWN_COLUMN.
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

  // Second row documents each column so the operator does not have to keep the UI open.
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
