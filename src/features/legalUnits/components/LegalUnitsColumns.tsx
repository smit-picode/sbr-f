import type { ColumnDef } from '@tanstack/react-table';
import type { SbrLegalUnit } from '@/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { nullableText, formatDate } from '@/utils/format';
import { Pencil } from 'lucide-react';

function MonoCell({ value }: { value: string | null | undefined }) {
  return value ? (
    <span className="font-mono text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{value}</span>
  ) : (
    <span className="text-slate-400">—</span>
  );
}

function TextCell({ value }: { value: string | null | undefined }) {
  return <span className="text-sm text-slate-700">{nullableText(value ?? null)}</span>;
}

function SourceCell({ value }: { value: string | null | undefined }) {
  return <span className="text-xs text-slate-400">{nullableText(value ?? null)}</span>;
}

function DateCell({ value }: { value: string | null | undefined }) {
  return <span className="text-sm text-slate-600">{formatDate(value ?? null)}</span>;
}

type TFunc = (key: string, options?: { lng?: string }) => string;

export const getLegalUnitsColumns = (onEdit: (row: SbrLegalUnit) => void, t: TFunc, canEdit = true): ColumnDef<SbrLegalUnit>[] => [
  // ── Core identifiers
  {
    accessorKey: 'SBR_ID',
    header: t('columns.SBR_ID', { lng: 'en' }),
    cell: ({ getValue }) => (
      <span className="font-mono text-xs font-medium text-red-600">{String(getValue())}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'SOURCE_CODE',
    header: t('columns.SOURCE_CODE', { lng: 'en' }),
    cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
  },

  // ── English names
  {
    accessorKey: 'NAME_ENU',
    header: t('columns.NAME_ENU', { lng: 'en' }),
    cell: ({ getValue, row }) => {
      const nameEnu = getValue<string | null>();
      const npcNameAra = row.original.NPC_NAME_ARA;
      const showAra = npcNameAra && npcNameAra.trim() !== nameEnu?.trim();
      return (
        <div className="min-w-[280px]">
          <p className="font-medium text-slate-800 text-sm leading-snug">{nullableText(nameEnu)}</p>
          {showAra && (
            <p className="text-xs text-slate-400 mt-0.5 leading-snug truncate max-w-[260px]" lang="ar" title={npcNameAra}>
              {npcNameAra}
            </p>
          )}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'NAME_ENU_SOURCE',
    header: t('columns.NAME_ENU_SOURCE', { lng: 'en' }),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'NAME_ARA_SOURCE',
    header: t('columns.NAME_ARA_SOURCE', { lng: 'en' }),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'TRADE_NAME_ENU',
    header: t('columns.TRADE_NAME_ENU', { lng: 'en' }),
    cell: ({ getValue }) => <TextCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'TRADE_NAME_ENU_SOURCE',
    header: t('columns.TRADE_NAME_ENU_SOURCE', { lng: 'en' }),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'TRADE_NAME_ARA',
    header: t('columns.TRADE_NAME_ARA', { lng: 'en' }),
    cell: ({ getValue }) => (
      <span className="text-sm text-slate-700" lang="ar">{nullableText(getValue<string | null>())}</span>
    ),
  },
  {
    accessorKey: 'TRADE_NAME_ARA_SOURCE',
    header: t('columns.TRADE_NAME_ARA_SOURCE', { lng: 'en' }),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'NPC_NAME_ENU',
    header: t('columns.NPC_NAME_ENU', { lng: 'en' }),
    cell: ({ getValue }) => <TextCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'NPC_NAME_ENU_SOURCE',
    header: t('columns.NPC_NAME_ENU_SOURCE', { lng: 'en' }),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'NPC_NAME_ARA',
    header: t('columns.NPC_NAME_ARA', { lng: 'en' }),
    cell: ({ getValue }) => (
      <span className="text-sm text-slate-700" lang="ar">{nullableText(getValue<string | null>())}</span>
    ),
  },
  {
    accessorKey: 'NPC_NAME_ARA_SOURCE',
    header: t('columns.NPC_NAME_ARA_SOURCE', { lng: 'en' }),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },

  // ── Status
  {
    accessorKey: 'EST_STATUS',
    header: t('columns.EST_STATUS', { lng: 'en' }),
    cell: ({ getValue }) => <StatusBadge status={getValue<string | null>()} className="rounded-md" />,
    enableSorting: true,
  },
  {
    accessorKey: 'EST_STATUS_SOURCE',
    header: t('columns.EST_STATUS_SOURCE', { lng: 'en' }),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'EST_STATUS_CATEGORY',
    header: t('columns.EST_STATUS_CATEGORY', { lng: 'en' }),
    cell: ({ getValue }) => <TextCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'EST_STATUS_CATEGORY_SOURCE',
    header: t('columns.EST_STATUS_CATEGORY_SOURCE', { lng: 'en' }),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },

  // ── Classification
  {
    accessorKey: 'LEGAL_TYPE',
    header: t('columns.LEGAL_TYPE', { lng: 'en' }),
    cell: ({ getValue }) => <TextCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'LEGAL_TYPE_SOURCE',
    header: t('columns.LEGAL_TYPE_SOURCE', { lng: 'en' }),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'SECTOR_ID',
    header: t('columns.SECTOR_ID', { lng: 'en' }),
    cell: ({ getValue }) => {
      const val = getValue<string | null>();
      return val ? <Badge variant="secondary" className="rounded-md">{val}</Badge> : <span className="text-slate-400">—</span>;
    },
  },
  {
    accessorKey: 'SECTOR_ID_SOURCE',
    header: t('columns.SECTOR_ID_SOURCE', { lng: 'en' }),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'ISIC_CODE',
    header: t('columns.ISIC_CODE', { lng: 'en' }),
    cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'ISIC_CODE_SOURCE',
    header: t('columns.ISIC_CODE_SOURCE', { lng: 'en' }),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },

  // ── Branch / Holding
  {
    accessorKey: 'MAIN_BRANCH_FLG',
    header: t('columns.MAIN_BRANCH_FLG', { lng: 'en' }),
    cell: ({ getValue }) => {
      const val = getValue<string | null>();
      return val === 'MAIN' ? (
        <Badge className="rounded-md bg-[#A71D3A] text-white font-bold">MAIN</Badge>
      ) : val ? (
        <span className="text-xs text-slate-600">{val}</span>
      ) : (
        <span className="text-slate-400">—</span>
      );
    },
  },
  {
    accessorKey: 'MAIN_BRANCH_FLG_SOURCE',
    header: t('columns.MAIN_BRANCH_FLG_SOURCE', { lng: 'en' }),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'MAIN_BRANCH_SBR_ID',
    header: t('columns.MAIN_BRANCH_SBR_ID', { lng: 'en' }),
    cell: ({ getValue }) => {
      const val = getValue<number | null>();
      return val != null ? (
        <span className="font-mono text-xs font-medium text-blue-700">{val}</span>
      ) : (
        <span className="text-slate-400">—</span>
      );
    },
  },
  {
    accessorKey: 'MAIN_BRANCH_SBR_ID_SOURCE',
    header: t('columns.MAIN_BRANCH_SBR_ID_SOURCE', { lng: 'en' }),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'HOLDING_COMPANY_FLG',
    header: t('columns.HOLDING_COMPANY_FLG', { lng: 'en' }),
    cell: ({ getValue }) => <TextCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'HOLDING_COMPANY_FLG_SOURCE',
    header: t('columns.HOLDING_COMPANY_FLG_SOURCE', { lng: 'en' }),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },

  // ── Employment
  {
    accessorKey: 'EMPLOYMENT_COUNT',
    header: t('columns.EMPLOYMENT_COUNT', { lng: 'en' }),
    cell: ({ getValue }) => {
      const val = getValue<number | null>();
      return val != null ? (
        <span className="text-sm font-medium text-slate-700">{val.toLocaleString()}</span>
      ) : (
        <span className="text-slate-400">—</span>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'EMPLOYMENT_COUNT_SOURCE',
    header: t('columns.EMPLOYMENT_COUNT_SOURCE', { lng: 'en' }),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },

  // ── Registration numbers
  {
    accessorKey: 'MOCI_ORG_ID',
    header: t('columns.MOCI_ORG_ID', { lng: 'en' }),
    cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'MOCI_CR_NUM',
    header: t('columns.MOCI_CR_NUM', { lng: 'en' }),
    cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'MOCI_CP_NUM',
    header: t('columns.MOCI_CP_NUM', { lng: 'en' }),
    cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'QFC_NUMBER',
    header: t('columns.QFC_NUMBER', { lng: 'en' }),
    cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'QFZ_SOURCE_ID',
    header: t('columns.QFZ_SOURCE_ID', { lng: 'en' }),
    cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'QSTP_REG_NUM',
    header: t('columns.QSTP_REG_NUM', { lng: 'en' }),
    cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'QSTP_TAX_REG_NUM',
    header: t('columns.QSTP_TAX_REG_NUM', { lng: 'en' }),
    cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'QSTP_PARENT_REG_NUM',
    header: t('columns.QSTP_PARENT_REG_NUM', { lng: 'en' }),
    cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'FARM_NO',
    header: t('columns.FARM_NO', { lng: 'en' }),
    cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'EID',
    header: t('columns.EID', { lng: 'en' }),
    cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'EID_SOURCE',
    header: t('columns.EID_SOURCE', { lng: 'en' }),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'EID_ORIG',
    header: t('columns.EID_ORIG', { lng: 'en' }),
    cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'EID_ORIG_SOURCE',
    header: t('columns.EID_ORIG_SOURCE', { lng: 'en' }),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },

  // ── CR Dates
  {
    accessorKey: 'CR_ISSUE_DATE',
    header: t('columns.CR_ISSUE_DATE', { lng: 'en' }),
    cell: ({ getValue }) => <DateCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'CR_EXPIRY_DATE',
    header: t('columns.CR_EXPIRY_DATE', { lng: 'en' }),
    cell: ({ getValue }) => <DateCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'CR_CANCEL_DATE',
    header: t('columns.CR_CANCEL_DATE', { lng: 'en' }),
    cell: ({ getValue }) => <DateCell value={getValue<string | null>()} />,
  },

  // ── CP Dates
  {
    accessorKey: 'CP_ISSUE_DATE',
    header: t('columns.CP_ISSUE_DATE', { lng: 'en' }),
    cell: ({ getValue }) => <DateCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'CP_END_DATE',
    header: t('columns.CP_END_DATE', { lng: 'en' }),
    cell: ({ getValue }) => <DateCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'CP_CANCEL_DATE',
    header: t('columns.CP_CANCEL_DATE', { lng: 'en' }),
    cell: ({ getValue }) => <DateCell value={getValue<string | null>()} />,
  },

  // ── Registration Dates
  {
    accessorKey: 'REG_DATE',
    header: t('columns.REG_DATE', { lng: 'en' }),
    cell: ({ getValue }) => <DateCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'REG_EXPIRY_DATE',
    header: t('columns.REG_EXPIRY_DATE', { lng: 'en' }),
    cell: ({ getValue }) => <DateCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'REG_CANCEL_DATE',
    header: t('columns.REG_CANCEL_DATE', { lng: 'en' }),
    cell: ({ getValue }) => <DateCell value={getValue<string | null>()} />,
  },

  // ── Validity & Timestamps
  {
    accessorKey: 'VALID_FROM',
    header: t('columns.VALID_FROM', { lng: 'en' }),
    cell: ({ getValue }) => <DateCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'VALID_TO',
    header: t('columns.VALID_TO', { lng: 'en' }),
    cell: ({ getValue }) => <DateCell value={getValue<string | null>()} />,
  },

  // ── Actions
  ...(canEdit ? [{
    id: 'actions',
    header: t('columns.ACTIONS', { lng: 'en' }),
    cell: ({ row }: { row: { original: SbrLegalUnit } }) => (
      <Button size="sm" variant="outline" onClick={() => onEdit(row.original)}>
        <Pencil className="h-3.5 w-3.5 mr-1" />
      </Button>
    ),
  } as ColumnDef<SbrLegalUnit>] : []),
];
