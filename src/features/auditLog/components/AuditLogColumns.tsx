import type { ColumnDef } from '@tanstack/react-table';
import type { AuditLog, AuditUserRef } from '@/types';
import { formatDate } from '@/utils/format';

const TABLE_COLORS: Record<string, string> = {
  SBR_ESTABLISHMENTS: 'bg-[#F3DEE4] text-[#A71D3A]',
  SBR_ENTERPRISES: 'bg-amber-100 text-amber-700',
  SBR_CONTACTS:    'bg-green-100 text-green-700',
  SBR_ADDRESSES:   'bg-purple-100 text-purple-700',
};

// Display-only: turn the raw table name (e.g. "SBR_CONTACTS") into a friendly
// label ("Contacts"). The underlying value sent to the backend stays unchanged.
export function prettyTableName(raw: string): string {
  if (!raw) return raw;
  return raw
    .replace(/^SBR_/, '')
    .toLowerCase()
    .split('_')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

const OPERATION_COLORS: Record<string, string> = {
  INSERT: 'bg-emerald-100 text-emerald-700',
  UPDATE: 'bg-[#F3DEE4] text-[#A71D3A]',
  DELETE: 'bg-red-100 text-red-700',
  REVERT: 'bg-amber-100 text-amber-700',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING:  'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
};

function UserCell({ user }: { user: AuditUserRef | null | undefined }) {
  if (!user) return <span className="text-slate-400 text-sm">—</span>;
  return (
    <div className="flex flex-col gap-0.5 min-w-[120px]">
      <span className="text-xs font-semibold text-slate-900">{user.NAME}</span>
      <span className="text-xs text-[#A71D3A]">{user.EMAIL}</span>
    </div>
  );
}

function RecordIdCell({ value }: { value: number | null }) {
  if (value === null || value === undefined) return <span className="text-slate-400 text-xs">—</span>;
  return <span className="font-mono text-xs font-medium text-[#A71D3A]">{String(value)}</span>;
}

// CHANGE_DATA is a JSON object whose keys are the changed column names,
// e.g. {"EMAIL":{"old":"a@b.com","new":"b@b.com"},"PHONE":{"old":"...","new":"..."}}.
// Legacy rows may hold a JSON array or a plain column name string.
function formatColumnNames(value: string | null): string {
  if (!value) return '—';
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return (parsed as string[]).join(', ');
    if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>;
      const names = Object.keys(obj).filter((k) => {
        const v = obj[k];
        return v !== null && typeof v === 'object' && !Array.isArray(v) && 'old' in (v as object) && 'new' in (v as object);
      }).join(', ');
      return names || '—';
    }
  } catch {
    // legacy plain string — fall through
  }
  return value;
}

type TFunc = (key: string, options?: { lng?: string }) => string;

export const getAuditLogColumns = (t: TFunc): ColumnDef<AuditLog>[] => [
  {
    accessorKey: 'TABLE_NAME',
    header: t('columns.TABLE_NAME', { lng: 'en' }),
    cell: ({ getValue }) => {
      const val = getValue<string>();
      const color = TABLE_COLORS[val] ?? 'bg-slate-100 text-slate-600';
      return (
        <span className={`text-xs px-2 py-0.5 rounded font-medium ${color}`}>
          {prettyTableName(val)}
        </span>
      );
    },
  },
  {
    accessorKey: 'PREV_RECORD_ID',
    header: t('columns.PREV_RECORD_ID', { lng: 'en' }),
    cell: ({ getValue }) => <RecordIdCell value={getValue<number | null>()} />,
  },
  {
    accessorKey: 'NEW_RECORD_ID',
    header: t('columns.NEW_RECORD_ID', { lng: 'en' }),
    cell: ({ getValue }) => <RecordIdCell value={getValue<number | null>()} />,
  },
  {
    accessorKey: 'OPERATION',
    header: t('columns.OPERATION', { lng: 'en' }),
    cell: ({ getValue }) => {
      const val = getValue<string>();
      if (!val) return <span className="text-slate-400 text-xs">—</span>;
      const color = OPERATION_COLORS[val] ?? 'bg-slate-100 text-slate-600';
      return (
        <span className={`font-mono text-xs px-2 py-0.5 rounded font-medium ${color}`}>
          {val}
        </span>
      );
    },
  },
  {
    accessorKey: 'CHANGE_DATA',
    header: t('columns.COLUMN_NAME', { lng: 'en' }),
    cell: ({ getValue }) => {
      const text = formatColumnNames(getValue<string | null>());
      if (text === '—') return <span className="text-slate-400 text-sm">—</span>;
      return (
        <span className="font-mono text-xs text-slate-700 whitespace-normal break-words max-w-[260px] inline-block">
          {text}
        </span>
      );
    },
  },
  {
    accessorKey: 'CHANGE_REASON',
    header: t('columns.REASON', { lng: 'en' }),
    cell: ({ getValue }) => {
      const val = getValue<string | null>();
      return val
        ? <span className="text-sm text-slate-700">{val}</span>
        : <span className="text-slate-400 text-sm">—</span>;
    },
  },
  {
    accessorKey: 'CHANGED_BY',
    header: t('columns.CHANGED_BY', { lng: 'en' }),
    cell: ({ row }) => <UserCell user={row.original.changedByUser} />,
  },
  {
    accessorKey: 'APPROVED_BY',
    header: t('columns.APPROVED_BY', { lng: 'en' }),
    cell: ({ row }) => <UserCell user={row.original.approvedByUser} />,
  },
  {
    accessorKey: 'STATUS',
    header: t('columns.STATUS', { lng: 'en' }),
    cell: ({ getValue }) => {
      const val = getValue<string>();
      if (!val) return <span className="text-slate-400 text-xs">—</span>;
      const color = STATUS_COLORS[val] ?? 'bg-slate-100 text-slate-600';
      return (
        <span className={`font-mono text-xs px-2 py-0.5 rounded font-medium ${color}`}>
          {val}
        </span>
      );
    },
  },
  {
    accessorKey: 'APPROVAL_REASON',
    header: t('columns.APPROVAL_REASON', { lng: 'en' }),
    cell: ({ getValue }) => {
      const val = getValue<string | null>();
      return val
        ? <span className="text-sm text-slate-700">{val}</span>
        : <span className="text-slate-400 text-sm">—</span>;
    },
  },
  {
    accessorKey: 'APPROVAL_DATE',
    header: t('columns.APPROVAL_DATE', { lng: 'en' }),
    cell: ({ getValue }) => {
      const val = getValue<string | null>();
      return val
        ? <span className="text-sm text-slate-700">{formatDate(val)}</span>
        : <span className="text-slate-400 text-sm">—</span>;
    },
  },
  {
    accessorKey: 'CREATED_AT',
    header: t('columns.CREATED_AT', { lng: 'en' }),
    cell: ({ getValue }) => (
      <span className="text-sm text-slate-700">{formatDate(getValue<string | null>())}</span>
    ),
  },
];
