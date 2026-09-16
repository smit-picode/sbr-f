'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate } from '@/utils/format';
import type { SbrUser } from '@/types';

// distinct role names a user holds (for chips + super-admin guard)
export function userRoleNames(user: SbrUser): string[] {
  const names = (user.roleAssignments ?? []).map((a) => a.role?.ROLE_NAME ?? '').filter(Boolean);
  return [...new Set(names)];
}

export const isSuperAdminUser = (user: SbrUser) => userRoleNames(user).includes('SUPER_ADMIN');

// Soft tint pills (light fill, dark text, dot) matching the reference's role-chip pattern —
// stays inside the design-system palette (slate, blue, emerald, amber) plus the maroon theme
// accent, dropping the off-palette purple/orange/rose.
const ROLE_BADGE_PALETTE: { badge: string; dot: string }[] = [
  { badge: 'bg-[#A29374]/10 text-[#A29374]', dot: 'bg-[#A29374]' }, // maroon (theme accent)
  { badge: 'bg-slate-100 text-slate-700', dot: 'bg-slate-500' },    // slate
  { badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' }, // emerald
  { badge: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500' },        // blue
  { badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },     // amber
];

function getRoleBadgeColors(roleName: string): { badge: string; dot: string } {
  // Same light-red tint as the Status column's INACTIVE badge, so SUPER_ADMIN reads as the
  // one role that stands out from every other role's soft tint.
  if (roleName === 'SUPER_ADMIN') return { badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' };
  const hash = roleName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return ROLE_BADGE_PALETTE[hash % ROLE_BADGE_PALETTE.length];
}

// Reference-matching role chip: rounded-full pill with a small color-matched dot, rather than a
// plain rectangular badge — used both in the table's Roles column and the view-user dialog.
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
          <p className="text-[13px] font-semibold text-slate-800">{row.original.NAME}</p>
          <p className="text-[11.5px] text-slate-400">{row.original.EMAIL}</p>
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
      // StatusBadge matches the design system's other status columns (EST_STATUS, etc.), which
      // key their color off the raw English enum value and never localize it — same here.
      cell: ({ row }) => <StatusBadge status={row.original.IS_ACTIVE ? 'Active' : 'Inactive'} />,
    },
    {
      id: 'CREATED_AT',
      accessorKey: 'CREATED_AT',
      header: t('admin.users.colCreatedAt'),
      cell: ({ getValue }) => <span className="text-[12px] text-slate-500">{formatDate(getValue<string>())}</span>,
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
