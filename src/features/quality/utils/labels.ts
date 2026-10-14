import type { TFunction } from 'i18next';

// A table-specific label first (a bare ID or flag reads badly), then the app-wide column label.
export function dqColumnLabel(t: TFunction, table: string | null | undefined, column: string, fallback?: string | null): string {
  return t(`dq.column.${table}.${column}`, { defaultValue: t(`columns.${column}`, { defaultValue: fallback ?? column }) });
}
