import type { ColumnDef } from '@tanstack/react-table';
import type { PipelineRun } from '@/types';
import { Badge } from '@/components/ui/badge';
import { nullableText, formatDateTime } from '@/utils/format';
import { PIPELINE_STATUS_BADGE } from '../constants';
import { ChevronRight } from 'lucide-react';

type TFunc = (key: string, options?: { lng?: string; defaultValue?: string }) => string;

export const getPipelineRunsColumns = (onOpenRun: (runId: number) => void, t: TFunc): ColumnDef<PipelineRun>[] => [
  {
    accessorKey: 'RUN_ID',
    header: t('columns.RUN_ID', { defaultValue: 'RUN ID' }),
    // No enableSorting here — the backend list has no sortBy param (direct SELECT, ordered RUN_ID DESC server-side), so a client-side sort would silently only reorder the current page.
    cell: ({ getValue }) => <span className="font-mono text-xs font-medium text-adaam">#{String(getValue())}</span>,
  },
  {
    accessorKey: 'STARTED_AT',
    header: t('columns.STARTED_AT', { defaultValue: 'STARTED AT' }),
    cell: ({ getValue }) => <span className="text-sm text-slate-600">{formatDateTime(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'FINISHED_AT',
    header: t('columns.FINISHED_AT', { defaultValue: 'FINISHED AT' }),
    cell: ({ getValue }) => <span className="text-sm text-slate-600">{formatDateTime(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'STATUS',
    header: t('columns.STATUS', { defaultValue: 'STATUS' }),
    cell: ({ getValue }) => {
      const status = getValue<string>();
      return <Badge variant={PIPELINE_STATUS_BADGE[status] ?? 'secondary'}>{status}</Badge>;
    },
  },
  {
    // FINISHED_AT - STARTED_AT, formatted client-side — neither column stores a duration.
    id: 'DURATION',
    header: t('columns.DURATION', { defaultValue: 'DURATION' }),
    cell: ({ row }) => {
      const { STARTED_AT, FINISHED_AT } = row.original;
      if (!STARTED_AT || !FINISHED_AT) return <span className="text-sm text-slate-400">—</span>;
      const ms = new Date(FINISHED_AT).getTime() - new Date(STARTED_AT).getTime();
      if (!Number.isFinite(ms) || ms < 0) return <span className="text-sm text-slate-400">—</span>;
      const totalSeconds = Math.round(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return <span className="text-sm text-slate-600">{minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`}</span>;
    },
  },
  {
    accessorKey: 'CURRENT_STEP',
    header: t('columns.CURRENT_STEP', { defaultValue: 'CURRENT STEP' }),
    cell: ({ getValue }) => <span className="font-mono text-xs text-slate-600">{nullableText(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'FAILED_STEP',
    header: t('columns.FAILED_STEP', { defaultValue: 'FAILED STEP' }),
    cell: ({ getValue }) => <span className="font-mono text-xs text-neg-text">{nullableText(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'ERROR_MESSAGE',
    header: t('columns.ERROR_MESSAGE', { defaultValue: 'ERROR' }),
    cell: ({ getValue }) => {
      const val = getValue<string | null>();
      return val
        ? <span className="text-xs text-neg-text truncate max-w-xs block">{val}</span>
        : <span className="text-slate-400 text-sm">—</span>;
    },
  },
  {
    accessorKey: 'NOTES',
    header: t('columns.NOTES', { defaultValue: 'NOTE' }),
    cell: ({ getValue }) => {
      const val = getValue<string | null>();
      return val
        ? <span className="text-xs italic text-slate-500 truncate max-w-xs block">{val}</span>
        : <span className="text-slate-400 text-sm">—</span>;
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onOpenRun(row.original.RUN_ID); }}
        className="inline-flex items-center gap-1 text-xs font-medium text-adaam hover:underline cursor-pointer"
      >
        {t('pipelineLogs.viewSteps', { defaultValue: 'View steps' })}
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    ),
  },
];
