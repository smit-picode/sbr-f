'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/format';
import type { SbrUser } from '@/types';

// distinct role names a user holds (for chips + super-admin guard)
export function userRoleNames(user: SbrUser): string[] {
  const names = (user.roleAssignments ?? []).map((a) => a.role?.ROLE_NAME ?? '').filter(Boolean);
  return [...new Set(names)];
}

export const isSuperAdminUser = (user: SbrUser) => userRoleNames(user).includes('SUPER_ADMIN');

const ROLE_BADGE_PALETTE = [
  'bg-[#A71D3A] text-white',   // maroon
  'bg-slate-600 text-white',   // charcoal
  'bg-emerald-700 text-white', // green
  'bg-[#6B4FA0] text-white',   // purple
  'bg-orange-600 text-white',  // orange
  'bg-rose-700 text-white',    // rose/pink
];

export function getRoleBadgeClass(roleName: string): string {
  if (roleName === 'SUPER_ADMIN') return 'bg-slate-800 text-white';
  const hash = roleName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return ROLE_BADGE_PALETTE[hash % ROLE_BADGE_PALETTE.length];
}

interface UsersColumnsOptions {
  t: (key: string, opts?: Record<string, unknown>) => string;
  canViewDetail: boolean;
  canEdit: boolean;
  isUpdating: boolean;
  onView: (user: SbrUser) => void;
  onEdit: (user: SbrUser) => void;
}

export const getUsersColumns = ({
  t,
  canViewDetail,
  canEdit,
  isUpdating,
  onView,
  onEdit,
}: UsersColumnsOptions): ColumnDef<SbrUser>[] => {
  const columns: ColumnDef<SbrUser>[] = [
    {
      // id is NAME so the server sorts on the user's name — the cell also shows the email,
      // which the backend can sort on but has no header of its own here.
      id: 'NAME',
      accessorKey: 'NAME',
      header: t('admin.users.colUser'),
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-semibold text-slate-900">{row.original.NAME}</p>
          <p className="text-xs text-slate-400">{row.original.EMAIL}</p>
        </div>
      ),
    },
    {
      id: 'ROLES',
      header: t('admin.users.colRoles'),
      enableSorting: false,
      cell: ({ row }) => {
        const names = userRoleNames(row.original);
        if (names.length === 0) return <span className="text-slate-400">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {names.map((name) => (
              <span
                key={name}
                className={`rounded px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${getRoleBadgeClass(name)}`}
              >
                {name}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      id: 'IS_ACTIVE',
      accessorKey: 'IS_ACTIVE',
      header: t('admin.users.colStatus'),
      cell: ({ row }) => (
        <span
          className={`rounded px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap uppercase ${
            row.original.IS_ACTIVE ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {row.original.IS_ACTIVE ? t('admin.users.statusActive') : t('admin.users.statusInactive')}
        </span>
      ),
    },
    {
      id: 'CREATED_AT',
      accessorKey: 'CREATED_AT',
      header: t('admin.users.colCreatedAt'),
      cell: ({ getValue }) => <span className="text-sm text-slate-700">{formatDate(getValue<string>())}</span>,
    },
  ];

  // Hide the Actions column entirely when the user can neither view details nor edit
  if (canViewDetail || canEdit) {
    columns.push({
      id: 'ACTIONS',
      header: t('admin.users.colActions'),
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {canViewDetail && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onView(row.original)}
              title={t('admin.users.viewUserTitle')}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          )}
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(row.original)}
              disabled={isUpdating || isSuperAdminUser(row.original)}
              title={isSuperAdminUser(row.original) ? t('admin.users.superAdminCannotEdit') : t('admin.users.editUserTitle')}
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    });
  }

  return columns;
};
