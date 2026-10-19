import type { ColumnDef } from '@tanstack/react-table';
import type { LegalUnit, TFuncWithDefault } from '@/types';
import { nullableText, formatDate } from '@/utils/format';
import { SOURCE_BADGE, SOURCE_BADGE_FALLBACK } from '@/constants/sourceBadges';
import { ExternalLink } from 'lucide-react';

// `onOpenEstablishment` is fired only from the ESTABLISHMENT cell (not the whole row)
export const getLegalUnitColumns = (onOpenEstablishment: (sbrId: number) => void, t: TFuncWithDefault): ColumnDef<LegalUnit>[] => [
  {
    accessorKey: 'LEGAL_UNIT_ID',
    header: t('columns.LEGAL_UNIT_ID', { defaultValue: 'LEGAL UNIT ID' }),
    cell: ({ getValue }) => (
      <span className="font-mono text-xs font-medium text-slate-700">{String(getValue())}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'ESTABLISHMENT_SBR_ID',
    header: t('columns.ESTABLISHMENT', { defaultValue: 'ESTABLISHMENT' }),
    enableSorting: true,
    cell: ({ row }) => {
      const sbrId = row.original.ESTABLISHMENT_SBR_ID;
      const name = row.original.ESTABLISHMENT_NAME;
      return (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOpenEstablishment(sbrId); }}
          className="group inline-flex items-center gap-1.5 text-left"
        >
          <span className="font-mono text-xs font-medium text-adaam">SBR #{sbrId}</span>
          <span className="text-sm text-slate-700 group-hover:text-[#A29374] group-hover:underline group-hover:decoration-[#A29374]">{nullableText(name)}</span>
          <ExternalLink className="h-3 w-3 shrink-0 text-slate-400 group-hover:text-[#A29374]" />
        </button>
      );
    },
  },
  {
    accessorKey: 'SOURCE_SYSTEM',
    header: t('columns.SOURCE_SYSTEM', { defaultValue: 'SOURCE SYSTEM' }),
    cell: ({ getValue }) => {
      const val = getValue<string>();
      const badge = SOURCE_BADGE[val] ?? SOURCE_BADGE_FALLBACK;
      return (
        <span
          className="inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-xs font-semibold"
          style={{ background: badge.bg, color: badge.text, borderColor: badge.border }}
        >
          {val}
        </span>
      );
    },
  },
  {
    accessorKey: 'SOURCE_TABLE',
    header: t('columns.SOURCE_TABLE', { defaultValue: 'SOURCE TABLE' }),
    cell: ({ getValue }) => <span className="font-mono text-xs text-slate-400">{nullableText(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'IDENTIFIER_TYPE',
    header: t('columns.IDENTIFIER_TYPE', { defaultValue: 'IDENTIFIER TYPE' }),
    cell: ({ getValue }) => <span className="font-mono text-xs text-slate-600">{nullableText(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'IDENTIFIER_VALUE',
    header: t('columns.IDENTIFIER_VALUE', { defaultValue: 'IDENTIFIER VALUE' }),
    cell: ({ getValue }) => <span className="font-mono text-xs text-slate-700">{nullableText(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'VALID_FROM',
    header: t('columns.VALID_FROM', { defaultValue: 'VALID FROM' }),
    cell: ({ getValue }) => <span className="text-sm text-slate-600">{formatDate(getValue<string | null>())}</span>,
  },
  {
    accessorKey: 'VALID_TO',
    header: t('columns.VALID_TO', { defaultValue: 'VALID TO' }),
    cell: ({ getValue }) => {
      const val = getValue<string | null>();
      if (!val) {
        return (
          <span className="inline-flex items-center rounded-md bg-emerald-100 px-1.5 py-0.5 text-xs font-bold text-emerald-700">
            {t('legalUnits.current', { defaultValue: 'Current' })}
          </span>
        );
      }
      return <span className="text-sm text-slate-600">{formatDate(val)}</span>;
    },
  },
  {
    accessorKey: 'SCD_COMMENT',
    header: t('columns.SCD_COMMENT', { defaultValue: 'SCD COMMENT' }),
    cell: ({ getValue }) => {
      const val = getValue<string | null>();
      return val
        ? <span className="text-xs italic text-slate-400">{val}</span>
        : <span className="text-slate-400 text-sm">—</span>;
    },
  },
];
