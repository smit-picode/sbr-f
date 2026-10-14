import type { ColumnDef } from '@tanstack/react-table';
import type { ColumnFilterOption } from '@/components/common/ColumnFilters';
import type { SourceTableColumn, SourceTableRow } from '@/types';
import { formatDate, nullableText } from '@/utils/format';

function SourceCell({ kind, value }: { kind: SourceTableColumn['KIND']; value: unknown }) {
  if (value == null || value === '') return <span className="text-slate-400 text-sm">—</span>;
  if (kind === 'date') return <span className="whitespace-nowrap text-sm text-slate-600">{formatDate(String(value))}</span>;
  if (kind === 'number') return <span className="font-mono text-xs tabular-nums text-slate-700">{String(value)}</span>;
  const text = nullableText(String(value));
  return <span className="block max-w-[320px] truncate text-sm text-slate-700" title={text}>{text}</span>;
}

// The source table's own columns, named as stored (these are raw regulator extracts), in table order.
export function getSourceTableColumns(columns: SourceTableColumn[]): ColumnDef<SourceTableRow>[] {
  return columns.map((c) => ({
    id: c.COLUMN_NAME,
    accessorFn: (row) => row[c.COLUMN_NAME],
    header: c.COLUMN_NAME,
    cell: ({ getValue }) => <SourceCell kind={c.KIND} value={getValue()} />,
  }));
}

// The same columns as filter options: numbers and dates get the comparison operators, text the value picker.
export function getSourceTableFilterColumns(columns: SourceTableColumn[]): ColumnFilterOption[] {
  return columns.map((c) => ({ value: c.COLUMN_NAME, label: c.COLUMN_NAME, type: c.KIND }));
}
