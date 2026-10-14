'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { Copy } from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDateTime, formatRole } from '@/utils/format';
import type { SystemAccount } from '@/types';
import { SYSTEM_ACCOUNT_MAX_LIVE_SECRETS } from '../constants';
import { RoleBadge } from './UsersColumns';

export const getSystemAccountColumns = (t: TFunction, onCopy: (text: string) => void): ColumnDef<SystemAccount>[] => [
  {
    accessorKey: 'NAME',
    header: t('admin.systemAccounts.colName', { defaultValue: 'Name' }),
    cell: ({ row }) => (
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-slate-800">{row.original.NAME}</div>
        {row.original.DESCRIPTION && <div className="truncate text-xs text-slate-500">{row.original.DESCRIPTION}</div>}
      </div>
    ),
  },
  {
    accessorKey: 'CLIENT_ID',
    header: t('admin.systemAccounts.colClientId', { defaultValue: 'Client ID' }),
    cell: ({ row }) => (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onCopy(row.original.CLIENT_ID); }}
        className="group inline-flex items-center gap-1.5 font-mono text-xs text-slate-600 hover:text-[#87795D]"
        title={t('admin.systemAccounts.copy', { defaultValue: 'Copy' })}
      >
        {row.original.CLIENT_ID}
        <Copy className="h-3 w-3 text-slate-300 group-hover:text-[#A29374]" />
      </button>
    ),
  },
  {
    accessorKey: 'ROLE_NAME',
    header: t('admin.systemAccounts.colRole', { defaultValue: 'Role' }),
    cell: ({ row }) => (row.original.ROLE_NAME
      ? <RoleBadge name={row.original.ROLE_NAME} label={formatRole(row.original.ROLE_NAME)} />
      : <span className="text-slate-400">—</span>),
  },
  {
    accessorKey: 'TOKEN_TTL_MINUTES',
    header: t('admin.systemAccounts.colTokenLifetime', { defaultValue: 'Token lifetime' }),
    cell: ({ row }) => (
      <span className="text-sm text-slate-700">
        {t('admin.systemAccounts.minutes', { defaultValue: '{{count}} min', count: row.original.TOKEN_TTL_MINUTES })}
      </span>
    ),
  },
  {
    accessorKey: 'LIVE_CREDENTIALS',
    header: t('admin.systemAccounts.colSecrets', { defaultValue: 'Live secrets' }),
    cell: ({ row }) => {
      const live = row.original.LIVE_CREDENTIALS;
      return (
        <span className={`text-sm ${live === 0 ? 'text-amber-700' : 'text-slate-700'}`}>
          {live === 0
            ? t('admin.systemAccounts.noLiveSecret', { defaultValue: 'None' })
            : `${live} / ${SYSTEM_ACCOUNT_MAX_LIVE_SECRETS}`}
        </span>
      );
    },
  },
  {
    accessorKey: 'LAST_USED_AT',
    header: t('admin.systemAccounts.colLastUsed', { defaultValue: 'Last login' }),
    cell: ({ row }) => (row.original.LAST_USED_AT
      ? <span className="text-sm text-slate-600">{formatDateTime(row.original.LAST_USED_AT)}</span>
      : <span className="text-sm text-slate-400">{t('admin.systemAccounts.never', { defaultValue: 'Never' })}</span>),
  },
  {
    accessorKey: 'IS_ACTIVE',
    header: t('admin.systemAccounts.colStatus', { defaultValue: 'Status' }),
    cell: ({ row }) => <StatusBadge status={row.original.IS_ACTIVE ? 'Active' : 'Inactive'} />,
  },
];
