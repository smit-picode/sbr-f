import type { ColumnDef } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import type { NpcCorrection } from '@/types';
import { formatDate } from '@/utils/format';
import { prettyTableName } from '@/features/auditLog/components/AuditLogColumns';
import {
  NPC_CORRECTION_CHANNEL_COLOR,
  NPC_CORRECTION_CHANNEL_LABEL,
  NPC_CORRECTION_REGULATOR_COLOR,
  NPC_CORRECTION_REGULATOR_FALLBACK_COLOR,
} from '../constants';
import { dqColumnLabel } from '../utils/labels';

function Value({ value, strong }: { value: string | null; strong?: boolean }) {
  if (value == null || value === '') return <span className="italic text-slate-400">—</span>;
  return <span className={strong ? 'font-semibold text-slate-900' : 'text-slate-400 line-through decoration-slate-300'}>{value}</span>;
}

export function ChannelChip({ channel, channelRef, t }: { channel: string; channelRef?: string | null; t: TFunction }) {
  const color = NPC_CORRECTION_CHANNEL_COLOR[channel] ?? NPC_CORRECTION_REGULATOR_FALLBACK_COLOR;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: `${color}1A`, color }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {channelRef || t(`dq.corrections.channel.${channel}`, { defaultValue: NPC_CORRECTION_CHANNEL_LABEL[channel] ?? channel })}
    </span>
  );
}

export function RegulatorDot({ code }: { code: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-slate-700">
      <span className="h-2 w-2 rounded-full" style={{ background: NPC_CORRECTION_REGULATOR_COLOR[code] ?? NPC_CORRECTION_REGULATOR_FALLBACK_COLOR }} />
      {code}
    </span>
  );
}

// Column ids are SBR_DQ_API's sort keys, so the table's sort maps straight onto p_sort_by.
export const getNpcCorrectionsColumns = (t: TFunction): ColumnDef<NpcCorrection>[] => [
  {
    id: 'ESTABLISHMENT_NAME_ENU',
    header: t('dq.corrections.cols.establishment', { defaultValue: 'Establishment' }),
    cell: ({ row }) => (
      <div className="min-w-[180px]">
        <div className="truncate text-sm font-semibold text-slate-800">{row.original.ESTABLISHMENT_NAME_ENU ?? '—'}</div>
        <div className="font-mono text-[11px] text-slate-400">SBR #{row.original.SBR_ID}</div>
      </div>
    ),
  },
  {
    id: 'COLUMN_NAME',
    header: t('dq.corrections.cols.field', { defaultValue: 'Field' }),
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        <div className="text-sm text-slate-700">{dqColumnLabel(t, row.original.ENTITY_TABLE, row.original.COLUMN_NAME)}</div>
        <div className="text-[11px] text-slate-400">{prettyTableName(row.original.ENTITY_TABLE)}</div>
      </div>
    ),
  },
  {
    id: 'CHANGE',
    header: t('dq.corrections.cols.change', { defaultValue: 'Regulator says → SBR says' }),
    cell: ({ row }) => {
      const r = row.original;
      return (
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
          <Value value={r.REGULATOR_VALUE} />
          <span className="text-slate-300 rtl:-scale-x-100">→</span>
          <Value value={r.NPC_VALUE} strong />
          {r.STATUS === 'AHEAD_FILLED' && (
            <span className="rounded-full bg-info-tint px-2 py-0.5 text-[10.5px] font-semibold text-info-text">
              {t('dq.corrections.filledChip', { defaultValue: 'Regulator sends nothing' })}
            </span>
          )}
          {r.STATUS === 'CAUGHT_UP' && (
            <span className="rounded-full bg-pos-tint px-2 py-0.5 text-[10.5px] font-semibold text-pos-text">
              {t('dq.corrections.caughtUpChip', { defaultValue: 'Regulator caught up' })}
            </span>
          )}
        </div>
      );
    },
  },
  {
    id: 'REGULATOR_CODE',
    header: t('dq.corrections.cols.regulator', { defaultValue: 'Regulator' }),
    cell: ({ row }) => <RegulatorDot code={row.original.REGULATOR_CODE} />,
  },
  {
    id: 'CHANNEL',
    header: t('dq.corrections.cols.learnedFrom', { defaultValue: 'Learned from' }),
    cell: ({ row }) => <ChannelChip channel={row.original.CHANNEL} channelRef={row.original.CHANNEL_REF} t={t} />,
  },
  {
    id: 'APPROVED_AT',
    header: t('dq.corrections.cols.approved', { defaultValue: 'Approved' }),
    cell: ({ row }) => <span className="whitespace-nowrap text-sm text-slate-500">{formatDate(row.original.APPROVED_AT)}</span>,
  },
  {
    id: 'SINCE',
    header: t('dq.corrections.cols.since', { defaultValue: 'In this state since' }),
    cell: ({ row }) => <span className="whitespace-nowrap text-sm text-slate-500">{formatDate(row.original.SINCE)}</span>,
  },
];
