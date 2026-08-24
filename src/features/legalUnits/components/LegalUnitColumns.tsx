import type { ColumnDef } from '@tanstack/react-table';
import type { LegalUnit } from '@/types';
import { nullableText, formatDate } from '@/utils/format';
import { ExternalLink } from 'lucide-react';

// Per-source badge palette. Each source keeps its own hue for at-a-glance recognition, but as a
// soft tint with dark text rather than a solid dark block. The text shades are deliberately a
// step darker than the old solid-background colours (QFZ #2B7A9E -> #22637F, QSTP #B5742B ->
// #8F5C22): at 12px on a tint the originals fall below the 4.5:1 contrast floor the design
// system requires for small text. Kept as inline hex, as the solid version was, because these
// regulator colours sit outside the slate/blue/emerald/red/amber Tailwind palette.
const SOURCE_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  MOCI:     { bg: '#FBEAEE', text: '#A71D3A', border: '#F3D3DB' },
  QFC:      { bg: '#EEF2F6', text: '#1A3A52', border: '#D6DFE8' },
  QFZ:      { bg: '#E9F4F8', text: '#22637F', border: '#CFE6EF' },
  QSTP:     { bg: '#FDF3E7', text: '#8F5C22', border: '#F5E2C8' },
  MOM_FARM: { bg: '#E8F5EE', text: '#196E49', border: '#C9E7D8' },
};

// Neutral slate for a source the palette above doesn't know, mirroring the previous
// '#64748b' fallback so an unrecognised value still renders as a badge rather than bare text.
const SOURCE_BADGE_FALLBACK = { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' };

type TFunc = (key: string, options?: { lng?: string; defaultValue?: string }) => string;

// `onOpenEstablishment` is fired only from the ESTABLISHMENT cell (not the whole row) — this
// is a read-only ledger with no detail page of its own, so the only navigable target is the
// establishment each legal unit belongs to.
export const getLegalUnitColumns = (onOpenEstablishment: (sbrId: number) => void, t: TFunc): ColumnDef<LegalUnit>[] => [
  {
    accessorKey: 'LEGAL_UNIT_ID',
    header: t('columns.LEGAL_UNIT_ID', { defaultValue: 'LEGAL UNIT ID' }),
    cell: ({ getValue }) => (
      <span className="font-mono text-xs font-medium text-slate-700">{String(getValue())}</span>
    ),
    enableSorting: true,
  },
  {
    // Sorts by ESTABLISHMENT_SBR_ID (numeric), not the displayed name — SBR_LEGAL_UNITS_API.GET_LIST's
    // sort_expr does support the joined ESTABLISHMENT_NAME too, but the backend validator's
    // LEGAL_UNITS_SORTABLE_COLUMNS whitelist only allows ESTABLISHMENT_SBR_ID, matching the column
    // filter's "Establishment (SBR ID)" semantics. The cell below ignores getValue() and renders
    // both the SBR ID and the name from row.original directly.
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
          <span className="font-mono text-xs font-medium text-red-600">SBR #{sbrId}</span>
          <span className="text-sm text-slate-700 group-hover:text-[#A71D3A] group-hover:underline group-hover:decoration-[#A71D3A]">{nullableText(name)}</span>
          <ExternalLink className="h-3 w-3 shrink-0 text-slate-400 group-hover:text-[#A71D3A]" />
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
    // font-mono text-xs to match IDENTIFIER_VALUE — type and value are the two halves of the
    // same regulator-issued identifier (CR_NUM / 50048-P), so they render in the same
    // code/ID style per the design system's "ID / code" cell convention, not as prose.
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
