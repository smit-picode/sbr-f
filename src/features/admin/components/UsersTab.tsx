'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InfoTooltip } from '@/components/common/InfoTooltip';
import { FilterChips } from '@/components/common/FilterChips';
import { DataTable } from '@/components/table/DataTable';
import { Mail, Search, Shield, Calendar, IdCard, Check } from 'lucide-react';
import {
  useGetUsersListQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useLazyGetUserByIdQuery,
  useGetRegulatorsQuery,
  useGetRolesListQuery,
} from '../api/adminApi';
import { PasswordLinkDialog } from './PasswordLinkDialog';
import { getUsersColumns, userRoleNames, RoleBadge, isSuperAdminUser, UserStatusBadge } from './UsersColumns';
import {
  ADMIN_MAX_LENGTHS, USERS_DEFAULT_FILTERS, USERS_SORTABLE_COLUMNS,
  ALL_ROLES_VALUE, ALL_STATUS_VALUE, USER_STATUS_FILTER_OPTIONS,
  NO_SCOPE_VALUE, REGULATOR_SCOPE_OPTIONS, GLOBAL_SCOPE_VALUE,
} from '../constants';
import type { SbrUser, SbrRole, UserRoleInput, AdminUserFilters, FilterChip, RoleSelection } from '@/types';
import { cleanParams } from '@/utils/query';
import { toast } from '@/utils/toast';
import { formatDate } from '@/utils/format';
import { useDebounce, useAppSelector } from '@/hooks';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

function getApiError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const msg = (err as { data?: { message?: string } }).data?.message;
    if (msg) return msg;
  }
  return fallback;
}

// Display-only: "SYS_ADMIN" → "Sys Admin". Does not affect the stored value.
function toTitleCaseRole(roleName: string): string {
  return roleName.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const toDateInput = (iso: string | null | undefined): string => {
  if (!iso) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const todayInput = (): string => toDateInput(new Date().toISOString());

const EXPIRY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const EMPTY_FORM = { NAME: '', EMAIL: '', IS_ACTIVE: 'Y' };

export function UsersTab({
  canEdit = false,
  canViewDetail = false,
  canSearch = false,
  onRegisterCreate,
}: {
  canEdit?: boolean;
  canViewDetail?: boolean;
  canSearch?: boolean;
  onRegisterCreate?: (fn: () => void) => void;
}) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<AdminUserFilters>({ ...USERS_DEFAULT_FILTERS });
  const [editTarget, setEditTarget] = useState<SbrUser | null>(null);
  const signedInEmail = useAppSelector((st) => st.auth.user?.email)?.trim().toLowerCase();
  const [viewTarget, setViewTarget] = useState<SbrUser | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [selectedRoles, setSelectedRoles] = useState<RoleSelection>({});
  const [regulatorScope, setRegulatorScope] = useState<string>(NO_SCOPE_VALUE);
  const [detailLoading, setDetailLoading] = useState(false);
  const originalSnapshot = useRef('');
  const editTargetId = useRef<number | null>(null);
  const originalScopes = useRef<Record<number, string | null>>({});
  const initialScope = useRef<string>(NO_SCOPE_VALUE);
  const originalExpiries = useRef<Record<number, string>>({});
  const [unreadableExpiry, setUnreadableExpiry] = useState<Record<number, boolean>>({});
  const [linkTarget, setLinkTarget] = useState<SbrUser | null>(null);

  const debouncedSearch = useDebounce(filters.search, 500);

  const { data, currentData, isLoading, isError, refetch, isFetching } = useGetUsersListQuery(
    cleanParams({ ...filters, search: debouncedSearch }),
    { skip: isCreateOpen }
  );

  const handleFilterChange = useCallback((partial: Partial<AdminUserFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);
  const { data: rolesData } = useGetRolesListQuery(
    { page: 1, limit: 100 },
    { refetchOnMountOrArgChange: true, skip: !canEdit && !canSearch }
  );
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [fetchUserDetail] = useLazyGetUserByIdQuery();
  const dialogOpen = isCreateOpen || !!editTarget;
  const { data: regulatorsData } = useGetRegulatorsQuery(undefined, { skip: !canEdit || !dialogOpen });
  const regulatorOptions = regulatorsData?.data?.length ? regulatorsData.data : REGULATOR_SCOPE_OPTIONS;

  const roles = rolesData?.data ?? [];
  const assignableRoles = roles.filter((role) => role.ROLE_NAME !== 'SUPER_ADMIN');

  const isEditingSelf = !!editTarget && !!signedInEmail && form.EMAIL.trim().toLowerCase() === signedInEmail;

  const resetDialogState = () => {
    setForm({ ...EMPTY_FORM });
    setSelectedRoles({});
    setRegulatorScope(NO_SCOPE_VALUE);
    setDetailLoading(false);
    editTargetId.current = null;
    originalScopes.current = {};
    initialScope.current = NO_SCOPE_VALUE;
    originalExpiries.current = {};
    setUnreadableExpiry({});
  };

  useEffect(() => {
    onRegisterCreate?.(() => { resetDialogState(); setIsCreateOpen(true); });
  }, [onRegisterCreate]);

  const toggleRole = (roleId: number) => {
    setUnreadableExpiry((prev) => ({ ...prev, [roleId]: false }));
    setSelectedRoles((prev) => {
      const next = { ...prev };
      if (roleId in next) delete next[roleId]; else next[roleId] = '';
      return next;
    });
  };

  const setRoleExpiry = (roleId: number, value: string, unreadable: boolean) => {
    setSelectedRoles((prev) => ({ ...prev, [roleId]: value }));
    setUnreadableExpiry((prev) => ({ ...prev, [roleId]: unreadable }));
  };

  // A past date is refused only when changed, matching the DB, which keeps an unchanged held expiry
  const isPastExpiry = (roleId: number, value: string): boolean =>
    !!value && value < todayInput() && value !== originalExpiries.current[roleId];

  const isInvalidExpiry = (roleId: number, value: string): boolean =>
    !!unreadableExpiry[roleId] || (!!value && !EXPIRY_PATTERN.test(value));

  // Returns the first expiry problem across the selected roles, or null when all are fine
  const expiryError = (): string | null => {
    for (const [id, value] of Object.entries(selectedRoles)) {
      const roleId = Number(id);
      if (isInvalidExpiry(roleId, value)) return t('admin.users.expiryInvalid', { defaultValue: 'Enter a valid expiry date.' });
      if (isPastExpiry(roleId, value)) return t('admin.users.expiryPast', { defaultValue: 'Expiry date cannot be in the past.' });
    }
    return null;
  };

  // The regulator scope only applies to roles flagged scoped; every other assignment stays global.
  const buildRolesPayload = (): UserRoleInput[] =>
    Object.entries(selectedRoles).map(([id, expiry]) => {
      const roleId = Number(id);
      const isScoped = roles.find((r) => r.ID === roleId)?.IS_SCOPED;
      const keepOriginal = regulatorScope === initialScope.current && roleId in originalScopes.current;
      const scope = keepOriginal
        ? originalScopes.current[roleId] ?? undefined
        : isScoped && regulatorScope !== NO_SCOPE_VALUE ? regulatorScope : undefined;
      return { ROLE_ID: roleId, SCOPE: scope, EXPIRES_AT: expiry || null };
    });

  // Mirrors the DB rule so a missing scope is caught before anything is sent
  const hasMissingScope = (): boolean =>
    buildRolesPayload().some((r) => {
      const isScoped = roles.find((x) => x.ID === r.ROLE_ID)?.IS_SCOPED;
      return isScoped && !r.SCOPE && !(r.ROLE_ID in originalScopes.current);
    });

  const snapshotOf = () => JSON.stringify({
    name: form.NAME.trim(),
    active: form.IS_ACTIVE,
    scope: regulatorScope,
    roles: Object.entries(selectedRoles).sort(([a], [b]) => Number(a) - Number(b)),
  });

  const validateForm = (): boolean => {
    if (!form.NAME.trim()) { toast.error(t('admin.users.nameRequired', { defaultValue: 'Name is required.' })); return false; }
    if (!form.EMAIL.trim()) { toast.error(t('admin.users.emailRequired', { defaultValue: 'Email is required.' })); return false; }
    if (form.NAME.length > ADMIN_MAX_LENGTHS.NAME) { toast.error(t('admin.users.nameMaxLength', { defaultValue: `Max ${ADMIN_MAX_LENGTHS.NAME} characters for name.`, max: ADMIN_MAX_LENGTHS.NAME })); return false; }
    if (form.EMAIL.length > ADMIN_MAX_LENGTHS.EMAIL) { toast.error(t('admin.users.emailMaxLength', { defaultValue: `Max ${ADMIN_MAX_LENGTHS.EMAIL} characters for email.`, max: ADMIN_MAX_LENGTHS.EMAIL })); return false; }
    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    const expiryProblem = expiryError();
    if (expiryProblem) { toast.error(expiryProblem); return; }
    if (hasMissingScope()) { toast.error(t('admin.users.scopeRequired', { defaultValue: 'Select a regulator scope for scoped roles.' })); return; }
    try {
      const res = await createUser({
        NAME: form.NAME,
        EMAIL: form.EMAIL,
        IS_ACTIVE: form.IS_ACTIVE === 'Y',
        roles: buildRolesPayload(),
      }).unwrap();
      if (res.data?.inviteSent) {
        toast.success(t('admin.users.createdInvited', { defaultValue: 'User created. An invitation was emailed to {{email}}.', email: form.EMAIL.trim() }));
      } else if (form.IS_ACTIVE === 'Y') {
        toast.warning(t('admin.users.createdInviteFailed', { defaultValue: 'User created, but the invitation email could not be sent. Use "Email a password link" to try again.' }));
      } else {
        toast.success(t('admin.users.createdSuccess', { defaultValue: 'User created successfully!' }));
      }
      resetDialogState();
      setIsCreateOpen(false);
      setFilters({ ...USERS_DEFAULT_FILTERS });
    } catch (err) {
      toast.error(getApiError(err, t('admin.users.createFailed', { defaultValue: 'Failed to create user. Please try again.' })));
    }
  };

  const handleUpdate = async () => {
    if (!editTarget) return;
    if (!form.NAME.trim()) { toast.error(t('admin.users.nameRequired', { defaultValue: 'Name is required.' })); return; }
    if (snapshotOf() === originalSnapshot.current) { toast.info('No changes detected.'); return; }
    const expiryProblem = isEditingSelf ? null : expiryError();
    if (expiryProblem) { toast.error(expiryProblem); return; }
    if (!isEditingSelf && hasMissingScope()) { toast.error(t('admin.users.scopeRequired', { defaultValue: 'Select a regulator scope for scoped roles.' })); return; }
    try {
      await updateUser({
        id: editTarget.ID,
        data: {
          NAME: form.NAME,
          IS_ACTIVE: form.IS_ACTIVE === 'Y',
          roles: isEditingSelf ? undefined : buildRolesPayload(),
        },
      }).unwrap();
      toast.success(t('admin.users.updatedSuccess', { defaultValue: 'User updated successfully!' }));
      setEditTarget(null);
      resetDialogState();
    } catch (err) {
      toast.error(getApiError(err, t('admin.users.updateFailed', { defaultValue: 'Failed to update user. Please try again.' })));
    }
  };

  const openEdit = async (user: SbrUser) => {
    resetDialogState();
    setEditTarget(user);
    setForm({
      NAME: user.NAME,
      EMAIL: user.EMAIL,
      IS_ACTIVE: user.IS_ACTIVE ? 'Y' : 'N',
    });
    editTargetId.current = user.ID;
    setDetailLoading(true);
    try {
      const detail = await fetchUserDetail(user.ID).unwrap();
      if (editTargetId.current !== user.ID) return;
      const assignments = detail.data?.roleAssignments ?? [];
      const selection: RoleSelection = {};
      assignments.forEach((a) => { selection[a.ROLE_ID] = toDateInput(a.EXPIRES_AT); });
      originalExpiries.current = { ...selection };
      const scope = assignments.find((a) => a.SCOPE && a.SCOPE !== GLOBAL_SCOPE_VALUE)?.SCOPE ?? NO_SCOPE_VALUE;
      originalScopes.current = Object.fromEntries(assignments.map((a) => [a.ROLE_ID, a.SCOPE ?? null]));
      initialScope.current = scope;
      setSelectedRoles(selection);
      setRegulatorScope(scope);
      originalSnapshot.current = JSON.stringify({
        name: user.NAME.trim(),
        active: user.IS_ACTIVE ? 'Y' : 'N',
        scope,
        roles: Object.entries(selection).sort(([a], [b]) => Number(a) - Number(b)),
      });
      setDetailLoading(false);
    } catch (err) {
      if (editTargetId.current !== user.ID) return;
      toast.error(getApiError(err, t('admin.users.loadDetailFailed', { defaultValue: 'Failed to load user details. Please try again.' })));
      setEditTarget(null);
      resetDialogState();
    }
  };

  const handleToggleLock = async (user: SbrUser) => {
    const lock = user.IS_ACTIVE;
    try {
      await updateUser({ id: user.ID, data: { IS_ACTIVE: !lock } }).unwrap();
      toast.success(lock ? t('admin.users.lockedSuccess', { defaultValue: 'User locked.' }) : t('admin.users.unlockedSuccess', { defaultValue: 'User unlocked.' }));
    } catch (err) {
      toast.error(getApiError(err, t('admin.users.lockFailed', { defaultValue: 'Failed to update the account. Please try again.' })));
    }
  };

  const users = data?.data ?? [];
  const total = data?.total ?? 0;

  const columns = getUsersColumns({
    t,
    canViewDetail,
    canEdit,
    isUpdating,
    onView: setViewTarget,
    onEdit: openEdit,
    onToggleLock: handleToggleLock,
    onSendLink: setLinkTarget,
    isSelf: (u) => !!signedInEmail && u.EMAIL.trim().toLowerCase() === signedInEmail,
  });

  const roleRow = (role: SbrRole) => {
    const checked = role.ID in selectedRoles;
    return (
      <div key={role.ID} className="flex items-center gap-2">
        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          disabled={isEditingSelf}
          onClick={() => toggleRole(role.ID)}
          className={`flex flex-1 items-center gap-2.5 rounded-full border px-3 py-1.5 text-start text-sm transition-colors ${
            checked ? 'border-[#A29374]/40 bg-[#F4F0E8]/40' : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? 'border-[#A29374] bg-[#A29374] text-white' : 'border-slate-300'}`}>
            {checked && <Check className="h-3 w-3" />}
          </span>
          <span className="flex-1 text-slate-800">{toTitleCaseRole(role.ROLE_NAME)}</span>
          {role.IS_SCOPED && <span className="text-[10.5px] font-semibold text-amber-600">{t('admin.users.scopedBadge')}</span>}
        </button>
        {checked && (
          <Input
            type="date"
            min={todayInput()}
            max="9999-12-31"
            value={selectedRoles[role.ID]}
            disabled={isEditingSelf}
            aria-invalid={isInvalidExpiry(role.ID, selectedRoles[role.ID]) || isPastExpiry(role.ID, selectedRoles[role.ID])}
            onChange={(e) => setRoleExpiry(role.ID, e.target.value, e.target.validity.badInput)}
            title={t('admin.users.expiryTitle')}
            aria-label={t('admin.users.expiryTitle')}
            className="h-8 w-[140px] shrink-0 rounded-full px-2 text-xs shadow-none focus:border-[#A29374]/40 focus:ring-[#A29374]/20 aria-[invalid=true]:border-red-400"
          />
        )}
      </div>
    );
  };

  // Headings in the database's display order; roles with no category come last, ungrouped.
  const roleGroups = [...assignableRoles.reduce<Map<string, { order: number; roles: SbrRole[] }>>((acc, role) => {
    const key = role.CATEGORY ?? '';
    const group = acc.get(key) ?? { order: role.CATEGORY_ORDER ?? Number.MAX_SAFE_INTEGER, roles: [] };
    group.roles.push(role);
    acc.set(key, group);
    return acc;
  }, new Map())].sort(([a, ga], [b, gb]) => (a === '' ? 1 : b === '' ? -1 : ga.order - gb.order));

  // Shared dialog body for create + edit (per the onboarding reference design)
  const dialogBody = (mode: 'create' | 'edit') => {
    const isOwnAccount = mode === 'edit' && !!signedInEmail && form.EMAIL.trim().toLowerCase() === signedInEmail;
    return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="user-name">{t('admin.users.nameLabel')}</Label>
          <Input id="user-name" value={form.NAME} onChange={(e) => setForm(p => ({ ...p, NAME: e.target.value }))} autoComplete="off" className="shadow-none focus:border-[#A29374]/40 focus:ring-[#A29374]/20" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="user-email">{t('admin.users.emailLabel')}</Label>
          <Input id="user-email" type="email" value={form.EMAIL} disabled={mode === 'edit'}
            onChange={(e) => setForm(p => ({ ...p, EMAIL: e.target.value }))} autoComplete="off" className="shadow-none focus:border-[#A29374]/40 focus:ring-[#A29374]/20" />
        </div>
      </div>

      {mode === 'create' && (
        <p className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <Mail className="h-4 w-4 shrink-0 text-[#A29374]" />
          {t('admin.users.inviteNote', { defaultValue: 'The user is emailed an invitation to choose their own password. The link works for 3 days; you can send a new one from the user list.' })}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1">
        <Label htmlFor="user-scope" className="block">{t('admin.users.regulatorScopeLabel')}</Label>
        <Select value={regulatorScope} onValueChange={setRegulatorScope}>
          <SelectTrigger id="user-scope" className="focus:ring-[#A29374] shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_SCOPE_VALUE} className="focus:bg-[#A29374] focus:text-white">{t('admin.users.noScope')}</SelectItem>
            {regulatorOptions.map((reg) => (
              <SelectItem key={reg} value={reg} className="focus:bg-[#A29374] focus:text-white">{reg}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <Label htmlFor="user-status">{t('admin.users.statusLabel')}</Label>
          {isOwnAccount && <InfoTooltip content={t('admin.users.statusSelfLocked', { defaultValue: 'You cannot deactivate your own account.' })} />}
        </div>
        <Select value={form.IS_ACTIVE} onValueChange={(v) => setForm(p => ({ ...p, IS_ACTIVE: v }))} disabled={isOwnAccount}>
          <SelectTrigger id="user-status" className={`focus:ring-[#A29374] shadow-none ${isOwnAccount ? 'opacity-60 cursor-not-allowed' : ''}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Y" className="focus:bg-[#A29374] focus:text-white">{t('admin.users.statusActive')}</SelectItem>
            <SelectItem value="N" className="focus:bg-[#A29374] focus:text-white">{t('admin.users.statusLocked')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-800">{t('admin.users.assignedRolesLabel')}</p>
        <p className="text-xs text-slate-500">{t('admin.users.assignedRolesHint')}</p>
        <p className="text-xs text-slate-400">{isEditingSelf ? t('admin.users.ownRolesLocked') : t('admin.users.regulatorScopeHint')}</p>
        <div className="space-y-3 pt-1">
          {detailLoading ? (
            <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full rounded-full" />)}</div>
          ) : assignableRoles.length === 0 ? (
            <p className="text-xs text-slate-400">{t('admin.users.noRoles')}</p>
          ) : (
            roleGroups.map(([category, { roles: groupRoles }]) => (
              <div key={category || 'ungrouped'} className={cn('space-y-1.5', !category && roleGroups.length > 1 && 'border-t border-slate-100 pt-3')}>
                {category && <p className="text-[11px] font-semibold text-[#87795D]">{category}</p>}
                {groupRoles.map(roleRow)}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
  };

  return (
    <>
      {canSearch && (
        <>
          <div className="flex flex-wrap items-center gap-3 p-4 bg-white shadow-card rounded-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                placeholder={t('admin.users.searchPlaceholder')}
                value={filters.search}
                onChange={(e) => handleFilterChange({ search: e.target.value, page: 1 })}
                className="pl-9 w-80 shadow-none focus:border-[#A29374]/40 focus:ring-[#A29374]/20"
                autoComplete="off"
              />
            </div>

            <Select
              value={filters.roleId ? String(filters.roleId) : ALL_ROLES_VALUE}
              onValueChange={(v) =>
                handleFilterChange({ roleId: v === ALL_ROLES_VALUE ? undefined : Number(v), page: 1 })
              }
            >
              <SelectTrigger
                className={`w-52 shadow-none focus:border-[#A29374]/40 focus:ring-[#A29374]/20 ${
                  filters.roleId ? '' : 'text-slate-400'
                }`}
                aria-label={t('admin.users.filterByRole', { defaultValue: 'Filter by role' })}
              >
                <SelectValue placeholder={t('admin.users.allRoles', { defaultValue: 'All Roles' })} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_ROLES_VALUE}>{t('admin.users.allRoles', { defaultValue: 'All Roles' })}</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.ID} value={String(role.ID)}>
                    {toTitleCaseRole(role.ROLE_NAME)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status ?? ALL_STATUS_VALUE}
              onValueChange={(v) =>
                handleFilterChange({ status: v === ALL_STATUS_VALUE ? undefined : v, page: 1 })
              }
            >
              <SelectTrigger
                className={`w-44 shadow-none focus:border-[#A29374]/40 focus:ring-[#A29374]/20 ${
                  filters.status ? '' : 'text-slate-400'
                }`}
                aria-label={t('admin.users.filterByStatus', { defaultValue: 'Filter by status' })}
              >
                <SelectValue placeholder={t('admin.users.allStatuses', { defaultValue: 'Status' })} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_STATUS_VALUE}>{t('admin.users.allStatuses', { defaultValue: 'Status' })}</SelectItem>
                {USER_STATUS_FILTER_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{t(o.i18nKey, { defaultValue: o.label })}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <FilterChips
            chips={[
              ...(filters.search ? [{
                key: 'search',
                label: `${t('filters.search', { defaultValue: 'Search' })}: ${filters.search}`,
                onRemove: () => handleFilterChange({ search: '', page: 1 }),
              } as FilterChip] : []),
              ...(filters.roleId ? [{
                key: 'roleId',
                label: `${t('admin.users.colRoles')}: ${
                  toTitleCaseRole(roles.find((r) => r.ID === filters.roleId)?.ROLE_NAME ?? String(filters.roleId))
                }`,
                onRemove: () => handleFilterChange({ roleId: undefined, page: 1 }),
              } as FilterChip] : []),
              ...(filters.status ? [{
                key: 'status',
                label: `${t('admin.users.colStatus')}: ${
                  t(
                    USER_STATUS_FILTER_OPTIONS.find((o) => o.value === filters.status)?.i18nKey ?? '',
                    { defaultValue: filters.status },
                  )
                }`,
                onRemove: () => handleFilterChange({ status: undefined, page: 1 }),
              } as FilterChip] : []),
            ]}
            onClearAll={() => handleFilterChange({ search: '', roleId: undefined, status: undefined, page: 1 })}
          />
        </>
      )}

      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        isRefreshing={isFetching && !currentData}
        isError={isError}
        onRetry={refetch}
        page={filters.page ?? 1}
        limit={filters.limit ?? USERS_DEFAULT_FILTERS.limit}
        total={total}
        onPageChange={(p) => handleFilterChange({ page: p })}
        onLimitChange={(l) => handleFilterChange({ limit: l, page: 1 })}
        onSortChange={(field, order) =>
          handleFilterChange({ sortBy: field ?? undefined, sortOrder: order ?? undefined, page: 1 })
        }
        sortableColumns={USERS_SORTABLE_COLUMNS}
      />

      <Dialog open={isCreateOpen} onOpenChange={(o) => { if (!o) { setIsCreateOpen(false); resetDialogState(); } }}>
        <DialogContent className="flex max-h-[90vh] max-w-lg flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="shrink-0 px-6 pb-3 pt-6"><DialogTitle>{t('admin.users.addUserDialogTitle')}</DialogTitle></DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6">{dialogBody('create')}</div>
          <DialogFooter className="shrink-0 px-6 pb-6">
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetDialogState(); }} disabled={isCreating}>{t('actions.cancel')}</Button>
            <Button onClick={handleCreate} loading={isCreating} style={{ background: 'linear-gradient(135deg, #A29374, #87795D)', border: 'none' }} className="text-white">{isCreating ? t('admin.users.creating') : t('admin.users.saveUser')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewTarget} onOpenChange={(o) => { if (!o) setViewTarget(null); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto gap-0 p-0">
          {viewTarget && (() => {
            const roleNames = userRoleNames(viewTarget);
            const userCode = `USR-${String(viewTarget.ID).padStart(4, '0')}`;
            const rows = [
              { key: 'role',    icon: Shield,   label: t('admin.users.roleIdLabel', { defaultValue: 'Role ID' }), value: roleNames.join(', ') || '—' },
              { key: 'created', icon: Calendar, label: t('admin.users.createdLabel', { defaultValue: 'Created' }), value: formatDate(viewTarget.CREATED_AT) },
              { key: 'id',      icon: IdCard,   label: t('admin.users.userIdLabel', { defaultValue: 'User ID' }), value: userCode },
            ];
            return (
              <>
                <div className="p-5 pb-4 pe-12">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-start">
                      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F4F0E8] text-lg font-bold text-[#A29374]">
                        {viewTarget.NAME?.charAt(0)?.toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-base font-semibold text-slate-900">{viewTarget.NAME}</span>
                        <span className="block truncate text-sm font-normal text-slate-500">{viewTarget.EMAIL}</span>
                      </span>
                    </DialogTitle>
                  </DialogHeader>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {roleNames.map((name) => (
                      <RoleBadge key={name} name={name} label={toTitleCaseRole(name)} />
                    ))}
                    <UserStatusBadge active={viewTarget.IS_ACTIVE} deleted={!!viewTarget.DELETED_AT} />
                  </div>
                </div>

                <div className="border-y border-slate-200">
                  {rows.map(({ key, icon: Icon, label, value }) => (
                    <div key={key} className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 last:border-b-0">
                      <span className="flex shrink-0 items-center gap-2 text-[11px] text-slate-400">
                        <Icon className="h-4 w-4 text-slate-400" />
                        {label}
                      </span>
                      <span className="truncate text-[12px] font-medium text-slate-700">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <DialogFooter className="p-4">
                  {canEdit && !isSuperAdminUser(viewTarget) && (
                    <Button
                      variant="outline"
                      onClick={() => { const target = viewTarget; setViewTarget(null); openEdit(target); }}
                    >
                      {t('admin.users.editUser', { defaultValue: 'Edit user' })}
                    </Button>
                  )}
                  <Button
                    onClick={() => setViewTarget(null)}
                    style={{ background: 'linear-gradient(135deg, #A29374, #87795D)', border: 'none' }}
                    className="text-white"
                  >
                    {t('admin.users.close')}
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) { setEditTarget(null); resetDialogState(); } }}>
        <DialogContent className="flex max-h-[90vh] max-w-lg flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="shrink-0 px-6 pb-3 pt-6"><DialogTitle>{t('admin.users.editUserDialogTitle')}</DialogTitle></DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6">{dialogBody('edit')}</div>
          <DialogFooter className="shrink-0 px-6 pb-6">
            <Button variant="outline" onClick={() => { setEditTarget(null); resetDialogState(); }} disabled={isUpdating}>{t('actions.cancel')}</Button>
            <Button onClick={handleUpdate} loading={isUpdating} disabled={detailLoading} style={{ background: 'linear-gradient(135deg, #A29374, #87795D)', border: 'none' }} className="text-white">{isUpdating ? t('admin.users.saving') : t('admin.users.saveUser')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PasswordLinkDialog user={linkTarget} onClose={() => setLinkTarget(null)} />
    </>
  );
}
