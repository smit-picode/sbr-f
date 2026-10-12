'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Eye, Lock, LockOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { SbrUser } from '@/types';

// distinct role names a user holds (for chips + super-admin guard)
export function userRoleNames(user: SbrUser): string[] {
  const names = (user.roleAssignments ?? []).map((a) => a.role?.ROLE_NAME ?? '').filter(Boolean);
  return [...new Set(names)];
}

// Earliest role expiry the user has (null when no assignment expires) — shown in the Expires column
export function userNextExpiry(user: SbrUser): string | null {
  const dates = (user.roleAssignments ?? []).map((a) => a.EXPIRES_AT).filter((d): d is string => !!d);
  if (dates.length === 0) return null;
  return dates.reduce((min, d) => (new Date(d) < new Date(min) ? d : min));
}

export function UserStatusBadge({ active, deleted = false }: { active: boolean; deleted?: boolean }) {
  return (
    <Badge variant={active ? 'success' : 'destructive'} className="inline-flex items-center gap-1.5">
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', active ? 'bg-pos' : 'bg-neg')} />
      {active ? 'Active' : deleted ? 'Deleted' : 'Locked'}
    </Badge>
  );
}

export const isSuperAdminUser = (user: SbrUser) => userRoleNames(user).includes('SUPER_ADMIN');

const ROLE_BADGE_PALETTE: { badge: string; dot: string }[] = [
  { badge: 'bg-[#A29374]/10 text-[#A29374]', dot: 'bg-[#A29374]' },
  { badge: 'bg-slate-100 text-slate-700', dot: 'bg-slate-500' },
  { badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  { badge: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
  { badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
];

function getRoleBadgeColors(roleName: string): { badge: string; dot: string } {
  if (roleName === 'SUPER_ADMIN') return { badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' };
  const hash = roleName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return ROLE_BADGE_PALETTE[hash % ROLE_BADGE_PALETTE.length];
}

// Reference-matching role chip
export function RoleBadge({ name, label }: { name: string; label: string }) {
  const { badge, dot } = getRoleBadgeColors(name);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold whitespace-nowrap ${badge}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

interface UsersColumnsOptions {
  t: (key: string, opts?: Record<string, unknown>) => string;
  canViewDetail: boolean;
  canEdit: boolean;
  isUpdating: boolean;
  onView: (user: SbrUser) => void;
  onEdit: (user: SbrUser) => void;
  onToggleLock: (user: SbrUser) => void;
  isSelf: (user: SbrUser) => boolean;
}

export const getUsersColumns = ({
  t,
  canViewDetail,
  canEdit,
  isUpdating,
  onView,
  onEdit,
  onToggleLock,
  isSelf,
}: UsersColumnsOptions): ColumnDef<SbrUser>[] => {
  const columns: ColumnDef<SbrUser>[] = [
    {
      id: 'NAME',
      accessorKey: 'NAME',
      header: t('admin.users.colUser'),
      cell: ({ row }) => (
        <div>
          <p className="text-[13px] font-semibold text-slate-800">{row.original.NAME}</p>
          <p className="text-[11.5px] text-slate-400">{row.original.EMAIL}</p>
        </div>
      ),
    },
    {
      id: 'ROLES',
      accessorFn: (user) => userRoleNames(user).join(', '),
      header: t('admin.users.colRoles'),
      cell: ({ row }) => {
        const names = userRoleNames(row.original);
        if (names.length === 0) return <span className="text-slate-400">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {names.map((name) => (
              <RoleBadge key={name} name={name} label={name} />
            ))}
          </div>
        );
      },
    },
    {
      id: 'IS_ACTIVE',
      accessorKey: 'IS_ACTIVE',
      header: t('admin.users.colStatus'),
      cell: ({ row }) => <UserStatusBadge active={row.original.IS_ACTIVE} deleted={!!row.original.DELETED_AT} />,
    },
    {
      id: 'CREATED_AT',
      accessorKey: 'CREATED_AT',
      header: t('admin.users.colCreatedAt'),
      cell: ({ getValue }) => <span className="text-[12px] text-slate-500">{formatDate(getValue<string>())}</span>,
    },
    {
      id: 'EXPIRES',
      enableSorting: false,
      header: t('admin.users.colExpires'),
      cell: ({ row }) => {
        const expiry = userNextExpiry(row.original);
        return <span className="text-[12px] text-slate-500">{expiry ? formatDate(expiry) : '—'}</span>;
      },
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
          {canEdit && (() => {
            const user = row.original;
            const protectedUser = isSuperAdminUser(user) || isSelf(user) || !!user.DELETED_AT;
            const label = user.IS_ACTIVE ? t('admin.users.lockAccount') : t('admin.users.unlockAccount');
            return (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onToggleLock(user)}
                disabled={isUpdating || protectedUser}
                title={isSelf(user) ? t('admin.users.cannotLockSelf') : isSuperAdminUser(user) ? t('admin.users.superAdminCannotEdit') : label}
                aria-label={label}
                className="h-8 w-8 p-0"
              >
                {user.IS_ACTIVE ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
              </Button>
            );
          })()}
        </div>
      ),
    });
  }

  return columns;
};
