import type { ColumnDef } from '@tanstack/react-table';
import type { SbrFrame } from '@/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { nullableText, formatDate } from '@/utils/format';
import { Pencil } from 'lucide-react';

const h = (s: string) => s.replaceAll('_', ' ');

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

export const getFrameColumns = (onEdit: (row: SbrFrame) => void): ColumnDef<SbrFrame>[] => [
  // ── Core identifiers
  {
    accessorKey: 'SBR_ID',
    header: h('SBR_ID'),
    cell: ({ getValue }) => (
      <span className="font-mono text-xs font-medium text-blue-700">{String(getValue())}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'SOURCE_CODE',
    header: h('SOURCE_CODE'),
    cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
  },

  // ── English names
  {
    accessorKey: 'NAME_ENU',
    header: h('NAME_ENU'),
    cell: ({ getValue, row }) => {
      const nameEnu = getValue<string | null>();
      const nameAra = row.original.NAME_ARA;
      const showAra = nameAra && nameAra.trim() !== nameEnu?.trim();
      return (
        <div className="min-w-[280px]">
          <p className="font-medium text-slate-800 text-sm leading-snug">{nullableText(nameEnu)}</p>
          {showAra && (
            <p className="text-xs text-slate-400 mt-0.5 leading-snug truncate max-w-[260px]" lang="ar" title={nameAra}>
              {nameAra}
            </p>
          )}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'NAME_ENU_SOURCE',
    header: h('NAME_ENU_SOURCE'),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'NAME_ARA_SOURCE',
    header: h('NAME_ARA_SOURCE'),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'TRADE_NAME_ENU',
    header: h('TRADE_NAME_ENU'),
    cell: ({ getValue }) => <TextCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'TRADE_NAME_ENU_SOURCE',
    header: h('TRADE_NAME_ENU_SOURCE'),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'TRADE_NAME_ARA',
    header: h('TRADE_NAME_ARA'),
    cell: ({ getValue }) => (
      <span className="text-sm text-slate-700" lang="ar">{nullableText(getValue<string | null>())}</span>
    ),
  },
  {
    accessorKey: 'TRADE_NAME_ARA_SOURCE',
    header: h('TRADE_NAME_ARA_SOURCE'),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'NPC_NAME_ENU',
    header: h('NPC_NAME_ENU'),
    cell: ({ getValue }) => <TextCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'NPC_NAME_ENU_SOURCE',
    header: h('NPC_NAME_ENU_SOURCE'),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'NPC_NAME_ARA',
    header: h('NPC_NAME_ARA'),
    cell: ({ getValue }) => (
      <span className="text-sm text-slate-700" lang="ar">{nullableText(getValue<string | null>())}</span>
    ),
  },
  {
    accessorKey: 'NPC_NAME_ARA_SOURCE',
    header: h('NPC_NAME_ARA_SOURCE'),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },

  // ── Status
  {
    accessorKey: 'EST_STATUS',
    header: h('EST_STATUS'),
    cell: ({ getValue }) => <StatusBadge status={getValue<string | null>()} />,
    enableSorting: true,
  },
  {
    accessorKey: 'EST_STATUS_SOURCE',
    header: h('EST_STATUS_SOURCE'),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'EST_STATUS_CATEGORY',
    header: h('EST_STATUS_CATEGORY'),
    cell: ({ getValue }) => <TextCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'EST_STATUS_CATEGORY_SOURCE',
    header: h('EST_STATUS_CATEGORY_SOURCE'),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },

  // ── Classification
  {
    accessorKey: 'LEGAL_TYPE',
    header: h('LEGAL_TYPE'),
    cell: ({ getValue }) => <TextCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'LEGAL_TYPE_SOURCE',
    header: h('LEGAL_TYPE_SOURCE'),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'SECTOR_ID',
    header: h('SECTOR_ID'),
    cell: ({ getValue }) => {
      const val = getValue<string | null>();
      return val ? <Badge variant="secondary">{val}</Badge> : <span className="text-slate-400">—</span>;
    },
  },
  {
    accessorKey: 'SECTOR_ID_SOURCE',
    header: h('SECTOR_ID_SOURCE'),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'ISIC_CODE',
    header: h('ISIC_CODE'),
    cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'ISIC_CODE_SOURCE',
    header: h('ISIC_CODE_SOURCE'),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },

  // ── Branch / Holding
  {
    accessorKey: 'MAIN_BRANCH_FLG',
    header: h('MAIN_BRANCH_FLG'),
    cell: ({ getValue }) => {
      const val = getValue<string | null>();
      return val === 'MAIN' ? (
        <Badge variant="default">MAIN</Badge>
      ) : val ? (
        <span className="text-xs text-slate-500">{val}</span>
      ) : (
        <span className="text-slate-400">—</span>
      );
    },
  },
  {
    accessorKey: 'MAIN_BRANCH_FLG_SOURCE',
    header: h('MAIN_BRANCH_FLG_SOURCE'),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'MAIN_BRANCH_SBR_ID',
    header: h('MAIN_BRANCH_SBR_ID'),
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
    header: h('MAIN_BRANCH_SBR_ID_SOURCE'),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'HOLDING_COMPANY_FLG',
    header: h('HOLDING_COMPANY_FLG'),
    cell: ({ getValue }) => <TextCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'HOLDING_COMPANY_FLG_SOURCE',
    header: h('HOLDING_COMPANY_FLG_SOURCE'),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },

  // ── Employment
  {
    accessorKey: 'EMPLOYMENT_COUNT',
    header: h('EMPLOYMENT_COUNT'),
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
    header: h('EMPLOYMENT_COUNT_SOURCE'),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },

  // ── Registration numbers
  {
    accessorKey: 'MOCI_ORG_ID',
    header: h('MOCI_ORG_ID'),
    cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'MOCI_CR_NUM',
    header: h('MOCI_CR_NUM'),
    cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'MOCI_CP_NUM',
    header: h('MOCI_CP_NUM'),
    cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'QFC_NUMBER',
    header: h('QFC_NUMBER'),
    cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'QFZ_SOURCE_ID',
    header: h('QFZ_SOURCE_ID'),
    cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'QSTP_REG_NUM',
    header: h('QSTP_REG_NUM'),
    cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'QSTP_TAX_REG_NUM',
    header: h('QSTP_TAX_REG_NUM'),
    cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'QSTP_PARENT_REG_NUM',
    header: h('QSTP_PARENT_REG_NUM'),
    cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'FARM_NO',
    header: h('FARM_NO'),
    cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'EID',
    header: 'EID',
    cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'EID_SOURCE',
    header: h('EID_SOURCE'),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'EID_ORIG',
    header: h('EID_ORIG'),
    cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'EID_ORIG_SOURCE',
    header: h('EID_ORIG_SOURCE'),
    cell: ({ getValue }) => <SourceCell value={getValue<string | null>()} />,
  },

  // ── CR Dates
  {
    accessorKey: 'CR_ISSUE_DATE',
    header: h('CR_ISSUE_DATE'),
    cell: ({ getValue }) => <DateCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'CR_EXPIRY_DATE',
    header: h('CR_EXPIRY_DATE'),
    cell: ({ getValue }) => <DateCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'CR_CANCEL_DATE',
    header: h('CR_CANCEL_DATE'),
    cell: ({ getValue }) => <DateCell value={getValue<string | null>()} />,
  },

  // ── CP Dates
  {
    accessorKey: 'CP_ISSUE_DATE',
    header: h('CP_ISSUE_DATE'),
    cell: ({ getValue }) => <DateCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'CP_END_DATE',
    header: h('CP_END_DATE'),
    cell: ({ getValue }) => <DateCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'CP_CANCEL_DATE',
    header: h('CP_CANCEL_DATE'),
    cell: ({ getValue }) => <DateCell value={getValue<string | null>()} />,
  },

  // ── Registration Dates
  {
    accessorKey: 'REG_DATE',
    header: h('REG_DATE'),
    cell: ({ getValue }) => <DateCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'REG_EXPIRY_DATE',
    header: h('REG_EXPIRY_DATE'),
    cell: ({ getValue }) => <DateCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'REG_CANCEL_DATE',
    header: h('REG_CANCEL_DATE'),
    cell: ({ getValue }) => <DateCell value={getValue<string | null>()} />,
  },

  // ── Validity & Timestamps
  {
    accessorKey: 'VALID_FROM',
    header: h('VALID_FROM'),
    cell: ({ getValue }) => <DateCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'VALID_TO',
    header: h('VALID_TO'),
    cell: ({ getValue }) => <DateCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'CREATED_AT',
    header: h('CREATED_AT'),
    cell: ({ getValue }) => <DateCell value={getValue<string | null>()} />,
  },
  {
    accessorKey: 'UPDATED_AT',
    header: h('UPDATED_AT'),
    cell: ({ getValue }) => <DateCell value={getValue<string | null>()} />,
  },

  // ── Actions
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <Button size="sm" variant="outline" onClick={() => onEdit(row.original)}>
        <Pencil className="h-3.5 w-3.5 mr-1" />
      </Button>
    ),
  },
];
