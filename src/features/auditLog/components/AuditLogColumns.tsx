import type { ColumnDef } from '@tanstack/react-table';
import type { AuditLog } from '@/types';

const TABLE_COLORS: Record<string, string> = {
  SBR_FRAME:     'bg-blue-100 text-blue-700',
  SBR_CONTACTS:  'bg-green-100 text-green-700',
  SBR_ADDRESSES: 'bg-purple-100 text-purple-700',
};

function ChangedByCell({ value }: { value: string }) {
  if (!value) return <span className="text-slate-400 text-xs">—</span>;
  return (
    <div className="flex flex-col gap-0.5 min-w-[120px]">
      <span className="text-xs font-semibold text-slate-800">Admin User</span>
      <span className="text-xs text-blue-600">{value}</span>
    </div>
  );
}

export const auditLogColumns: ColumnDef<AuditLog>[] = [
  {
    accessorKey: 'TABLE_NAME',
    header: 'Table Name',
    cell: ({ getValue }) => {
      const val = getValue<string>();
      const color = TABLE_COLORS[val] ?? 'bg-slate-100 text-slate-600';
      return (
        <span className={`font-mono text-xs px-2 py-0.5 rounded font-medium ${color}`}>
          {val}
        </span>
      );
    },
  },
  {
    accessorKey: 'RECORD_ID',
    header: 'Row ID',
    cell: ({ getValue }) => (
      <span className="font-mono text-xs font-medium text-blue-700">{String(getValue())}</span>
    ),
  },
  {
    accessorKey: 'REASON',
    header: 'Reason',
    cell: ({ getValue }) => (
      <span className="text-sm text-slate-700">{getValue<string>() || '—'}</span>
    ),
  },
  {
    accessorKey: 'CHANGED_BY',
    header: 'Changed By',
    cell: ({ getValue }) => <ChangedByCell value={getValue<string>()} />,
  },
  {
    accessorKey: 'APPROVED_BY',
    header: 'Approved By',
    cell: ({ getValue }) => {
      const val = getValue<string | null>();
      return val
        ? <span className="text-sm text-slate-700">{val}</span>
        : <span className="text-slate-400 text-xs italic">-</span>;
    },
  },
];
