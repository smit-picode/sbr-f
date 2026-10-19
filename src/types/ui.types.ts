export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastPayload {
  id: string;
  message: string;
  type: ToastType;
}

export interface ColumnFilterRow {
  id: string;
  column: string;
  operator: string;
  value: string;
  // The picked values of an in / not_in row; absent on rows saved before the list operators existed.
  values?: string[];
}

export type ColumnFilterType = 'text' | 'number' | 'date';

export interface ColumnFilterOption {
  value: string;
  label: string;
  // Number and date columns get comparison operators and typed inputs; omitted means text.
  type?: ColumnFilterType;
  // A column of few repeating values: with a values source its rows start as 'is any of'.
  pick?: boolean;
  // How a stored value reads in the picker; the filter still uses the stored value.
  valueLabel?: (value: string, language: string) => string;
}

export interface ColumnFilterItem {
  column: string;
  operator: string;
  value: string | string[];
}

// A version row carries VALID_FROM/VALID_TO/SOURCE_CODE plus the audited fields
export interface HistoryVersion {
  ID?: number;
  VALID_FROM?: string | null;
  VALID_TO?: string | null;
  SOURCE_CODE?: string | null;
  audit?: AuditMeta | null;
  request?: boolean;
  status?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
}

export interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

export interface AuditMeta {
  columns: string[];
  reason: string | null;
  changedBy: string | null;
  approvedBy: string | null;
  decidedAt: string | null;
  approved: boolean;
  operation: string | null;
}

export type TFunc = (key: string, options?: { lng?: string }) => string;

export type TFuncWithDefault = (key: string, options?: { lng?: string; defaultValue?: string }) => string;

export type ExcelJsModule = typeof import('exceljs');

export type DetailStripItem = { icon: React.ReactNode; label: string; value: string | null };
