import type { ColumnDef } from '@tanstack/react-table';
import type { PipelineStepLog } from '@/types';
import { Badge } from '@/components/ui/badge';
import { nullableText, formatDateTime } from '@/utils/format';
import { PIPELINE_STEP_EVENT_BADGE } from '../constants';

type TFunc = (key: string, options?: { lng?: string; defaultValue?: string }) => string;

export const getPipelineStepLogColumns = (t: TFunc): ColumnDef<PipelineStepLog>[] => [
  {
    accessorKey: 'STEP_NAME',
    header: t('columns.STEP_NAME', { defaultValue: 'STEP' }),
    cell: ({ getValue }) => <span className="font-mono text-xs font-medium text-slate-700">{String(getValue())}</span>,
  },
  {
    accessorKey: 'EVENT',
    header: t('columns.EVENT', { defaultValue: 'EVENT' }),
    cell: ({ getValue }) => {
      const event = getValue<string>();
      return <Badge variant={PIPELINE_STEP_EVENT_BADGE[event] ?? 'secondary'}>{event}</Badge>;
    },
  },
  {
    accessorKey: 'EVENT_AT',
    header: t('columns.EVENT_AT', { defaultValue: 'EVENT AT' }),
    cell: ({ getValue }) => <span className="text-sm text-slate-600">{formatDateTime(getValue<string>())}</span>,
  },
  {
    accessorKey: 'MESSAGE',
    header: t('columns.MESSAGE', { defaultValue: 'MESSAGE' }),
    cell: ({ getValue }) => <span className="text-sm text-slate-700">{nullableText(getValue<string | null>())}</span>,
  },
];
