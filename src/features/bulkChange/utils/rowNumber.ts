import type { BulkChangeItemInput, BulkChangeRecordRow } from '../types';

// The spreadsheet row of a validation row: the server's number, else the item at the same position.
export const validationRowNumber = (row: BulkChangeRecordRow, index: number, items: BulkChangeItemInput[]): number =>
  row.rowNumber ?? items[index]?.rowNumber ?? index + 1;
