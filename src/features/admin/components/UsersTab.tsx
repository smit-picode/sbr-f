'use client';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InfoTooltip } from '@/components/common/InfoTooltip';
import { FilterChips, type FilterChip } from '@/components/common/FilterChips';
import { DataTable } from '@/components/table/DataTable';
import { Eye, EyeOff, RefreshCw, Search, Shield, Calendar, IdCard } from 'lucide-react';
import {
  useGetUsersListQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useGetRolesListQuery,
  useGetRegulatorScopesQuery,
} from '../api/adminApi';
import { getUsersColumns, userRoleNames, getRoleBadgeClass, isSuperAdminUser } from './UsersColumns';
import {
  ADMIN_MAX_LENGTHS, USERS_DEFAULT_FILTERS, USERS_SORTABLE_COLUMNS, NO_SCOPE_VALUE,
  ALL_ROLES_VALUE, ALL_STATUS_VALUE, USER_STATUS_FILTER_OPTIONS,
} from '../constants';
import type { SbrUser, SbrRole, UserRoleInput, AdminUserFilters } from '@/types';
import { cleanParams } from '@/utils/query';
import { toast } from '@/utils/toast';
import { formatDate } from '@/utils/format';
import { useDebounce } from '@/hooks';
import { useTranslation } from 'react-i18next';

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

const PASSWORD_RULES = [
  { key: 'minLength',  label: 'At least 6 characters',         test: (p: string) => p.length >= 6 },
  { key: 'uppercase',  label: 'At least one uppercase letter',  test: (p: string) => /[A-Z]/.test(p) },
  { key: 'lowercase',  label: 'At least one lowercase letter',  test: (p: string) => /[a-z]/.test(p) },
  { key: 'special',    label: 'At least one special character', test: (p: string) => /[!@#$%&*]/.test(p) },
];

type RoleSelection = number | null;

const EMPTY_FORM = { NAME: '', EMAIL: '', PASSWORD: '', IS_ACTIVE: 'Y', SCOPE: NO_SCOPE_VALUE };

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
  const [viewTarget, setViewTarget] = useState<SbrUser | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [selectedRoles, setSelectedRoles] = useState<RoleSelection>(null);
  const [showPassword, setShowPassword] = useState(false);

  const generatePassword = () => {
    const upper   = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower   = 'abcdefghjkmnpqrstuvwxyz';
    const digits  = '23456789';
    const special = '!@#$%&*';
    const all     = upper + lower + digits + special;
    // Guarantee at least one character from each required category
    const pool = [
      upper.charAt(Math.floor(Math.random() * upper.length)),
      lower.charAt(Math.floor(Math.random() * lower.length)),
      digits.charAt(Math.floor(Math.random() * digits.length)),
      special.charAt(Math.floor(Math.random() * special.length)),
    ];
    for (let i = pool.length; i < 12; i++) pool.push(all.charAt(Math.floor(Math.random() * all.length)));
    // Fisher-Yates shuffle so guaranteed chars aren't always at fixed positions
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    setForm(p => ({ ...p, PASSWORD: pool.join('') }));
    setShowPassword(true);
  };

  // Debounce only the text search — typing no longer fires an API call per keystroke
  const debouncedSearch = useDebounce(filters.search, 500);

  const { data, isLoading, isError, refetch } = useGetUsersListQuery(
    cleanParams({ ...filters, search: debouncedSearch }),
    { skip: isCreateOpen }
  );

  const handleFilterChange = useCallback((partial: Partial<AdminUserFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);
  // Roles feed the create/edit dialogs and the Role filter dropdown, so fetch them for
  // anyone who can edit OR search — not just editors.
  const { data: rolesData } = useGetRolesListQuery(
    { page: 1, limit: 100 },
    { refetchOnMountOrArgChange: true, skip: !canEdit && !canSearch }
  );
  const { data: scopesData } = useGetRegulatorScopesQuery(undefined, { skip: !canEdit });
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const roles = rolesData?.data ?? [];
  const scopes = scopesData?.data ?? [];
  // SUPER_ADMIN can never be assigned through the UI — only shown, never selectable
  const assignableRoles = roles.filter((role) => role.ROLE_NAME !== 'SUPER_ADMIN');

  const resetDialogState = () => {
    setForm({ ...EMPTY_FORM });
    setSelectedRoles(null);
    setShowPassword(false);
  };

  useEffect(() => {
    onRegisterCreate?.(() => { resetDialogState(); setIsCreateOpen(true); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterCreate]);

  const toggleRole = (roleId: number) => {
    setSelectedRoles((prev) => (prev === roleId ? null : roleId));
  };

  const buildRolesPayload = (): UserRoleInput[] => {
    if (selectedRoles === null) return [];
    return [{ ROLE_ID: selectedRoles, SCOPE: undefined, EXPIRES_AT: null }];
  };

  const validateForm = (requirePassword: boolean): boolean => {
    if (!form.NAME.trim()) { toast.error(t('admin.users.nameRequired', { defaultValue: 'Name is required.' })); return false; }
    if (!form.EMAIL.trim()) { toast.error(t('admin.users.emailRequired', { defaultValue: 'Email is required.' })); return false; }
    if (requirePassword && !form.PASSWORD.trim()) { toast.error(t('admin.users.passwordRequired', { defaultValue: 'Password is required.' })); return false; }
    if (requirePassword && PASSWORD_RULES.some((r) => !r.test(form.PASSWORD))) {
      toast.error(t('admin.users.passwordCriteria', { defaultValue: 'Password does not meet the required criteria.' })); return false;
    }
    if (form.NAME.length > ADMIN_MAX_LENGTHS.NAME) { toast.error(t('admin.users.nameMaxLength', { defaultValue: `Max ${ADMIN_MAX_LENGTHS.NAME} characters for name.`, max: ADMIN_MAX_LENGTHS.NAME })); return false; }
    if (form.EMAIL.length > ADMIN_MAX_LENGTHS.EMAIL) { toast.error(t('admin.users.emailMaxLength', { defaultValue: `Max ${ADMIN_MAX_LENGTHS.EMAIL} characters for email.`, max: ADMIN_MAX_LENGTHS.EMAIL })); return false; }
    return true;
  };

  const handleCreate = async () => {
    if (!validateForm(true)) return;
    try {
      await createUser({
        NAME: form.NAME,
        EMAIL: form.EMAIL,
        PASSWORD: form.PASSWORD,
        IS_ACTIVE: form.IS_ACTIVE === 'Y',
        roles: buildRolesPayload(),
      }).unwrap();
      toast.success(t('admin.users.createdSuccess', { defaultValue: 'User created successfully!' }));
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
    try {
      await updateUser({
        id: editTarget.ID,
        data: {
          NAME: form.NAME,
          IS_ACTIVE: form.IS_ACTIVE === 'Y',
          roles: buildRolesPayload(),
        },
      }).unwrap();
      toast.success(t('admin.users.updatedSuccess', { defaultValue: 'User updated successfully!' }));
      setEditTarget(null);
      resetDialogState();
    } catch (err) {
      toast.error(getApiError(err, t('admin.users.updateFailed', { defaultValue: 'Failed to update user. Please try again.' })));
    }
  };

  const openEdit = (user: SbrUser) => {
    setEditTarget(user);
    const assignments = user.roleAssignments ?? [];
    setSelectedRoles(assignments[0]?.ROLE_ID ?? null);
    setForm({
      NAME: user.NAME,
      EMAIL: user.EMAIL,
      PASSWORD: '',
      IS_ACTIVE: user.IS_ACTIVE ? 'Y' : 'N',
      SCOPE: NO_SCOPE_VALUE,
    });
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
  });

  const roleRow = (role: SbrRole) => {
    const checked = selectedRoles === role.ID;
    return (
      <label
        key={role.ID}
        className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
          checked ? 'border-[#A71D3A]/40 bg-[#F3DEE4]/40' : 'border-slate-200 bg-white hover:bg-slate-50'
        }`}
      >
        <input
          type="radio"
          name="assigned-role"
          checked={checked}
          onChange={() => toggleRole(role.ID)}
          className="h-4 w-4 shrink-0 accent-[#A71D3A]"
        />
        <span className="flex-1 text-sm text-slate-800">{toTitleCaseRole(role.ROLE_NAME)}</span>
      </label>
    );
  };

  // Shared dialog body for create + edit (per the onboarding reference design)
  const dialogBody = (mode: 'create' | 'edit') => (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="user-name">{t('admin.users.nameLabel')}</Label>
          <Input id="user-name" value={form.NAME} onChange={(e) => setForm(p => ({ ...p, NAME: e.target.value }))} autoComplete="off" className="shadow-none focus:border-[#A71D3A]/40 focus:ring-[#A71D3A]/20" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="user-email">{t('admin.users.emailLabel')}</Label>
          <Input id="user-email" type="email" value={form.EMAIL} disabled={mode === 'edit'}
            onChange={(e) => setForm(p => ({ ...p, EMAIL: e.target.value }))} autoComplete="off" className="shadow-none focus:border-[#A71D3A]/40 focus:ring-[#A71D3A]/20" />
        </div>
      </div>

      {mode === 'create' && (
        <div className="space-y-1">
          <Label htmlFor="user-password">{t('admin.users.passwordLabel')}</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="user-password"
                type={showPassword ? 'text' : 'password'}
                value={form.PASSWORD}
                onChange={(e) => setForm(p => ({ ...p, PASSWORD: e.target.value }))}
                className="pr-9 shadow-none focus:border-[#A71D3A]/40 focus:ring-[#A71D3A]/20"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                tabIndex={-1}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button type="button" variant="outline" onClick={generatePassword} title="Auto-generate password" className="h-9 px-3 shrink-0">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          {form.PASSWORD.length > 0 && PASSWORD_RULES.some((r) => !r.test(form.PASSWORD)) && (
            <ul className="mt-2 space-y-1">
              {PASSWORD_RULES.map((rule) => {
                const passed = rule.test(form.PASSWORD);
                return (
                  <li key={rule.key} className={`flex items-center gap-1.5 text-xs ${passed ? 'text-emerald-600' : 'text-red-500'}`}>
                    <span className="font-bold">{passed ? '✓' : '✗'}</span>
                    {rule.label}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Label htmlFor="user-scope">{t('admin.users.regulatorScopeLabel')}</Label>
            <InfoTooltip content="This feature will be implemented in the next phase" />
          </div>
          <Select value={form.SCOPE} onValueChange={(v) => setForm(p => ({ ...p, SCOPE: v }))} disabled>
            <SelectTrigger id="user-scope" className="focus:ring-[#A71D3A] opacity-60 cursor-not-allowed shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_SCOPE_VALUE} className="focus:bg-[#A71D3A] focus:text-white">
                {t('admin.users.noScope')}
              </SelectItem>
              {scopes.map((scope) => (
                <SelectItem key={scope.ID} value={scope.CODE} className="focus:bg-[#A71D3A] focus:text-white">
                  {scope.CODE}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Label htmlFor="user-status">{t('admin.users.statusLabel')}</Label>
            <InfoTooltip content="This feature will be implemented in the next phase" />
          </div>
          <Select value={form.IS_ACTIVE} onValueChange={(v) => setForm(p => ({ ...p, IS_ACTIVE: v }))} disabled>
            <SelectTrigger id="user-status" className="focus:ring-[#A71D3A] opacity-60 cursor-not-allowed shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Y" className="focus:bg-[#A71D3A] focus:text-white">{t('admin.users.statusActive')}</SelectItem>
              <SelectItem value="N" className="focus:bg-[#A71D3A] focus:text-white">{t('admin.users.statusInactive')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <p className="text-sm font-semibold text-slate-800">{t('admin.users.assignedRolesLabel')}</p>
          <InfoTooltip content="Role expiry and multiple-role assignment will be implemented in the next phase" contentClassName="max-w-[220px]" />
        </div>
        <p className="text-xs text-slate-500">{t('admin.users.assignedRolesHint')}</p>
        <div className="space-y-2 pt-1 max-h-64 overflow-y-auto pr-1">
          {assignableRoles.length === 0 ? (
            <p className="text-xs text-slate-400">{t('admin.users.noRoles')}</p>
          ) : (
            assignableRoles.map(roleRow)
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Card 1 — Search bar (gated by admin_panel.users.search) */}
      {canSearch && (
        <>
          <div className="flex flex-wrap items-center gap-3 p-4 bg-white border border-slate-200 rounded-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                placeholder={t('admin.users.searchPlaceholder')}
                value={filters.search}
                onChange={(e) => handleFilterChange({ search: e.target.value, page: 1 })}
                className="pl-9 w-80 shadow-none focus:border-[#A71D3A]/40 focus:ring-[#A71D3A]/20"
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
                // Sentinel-valued selects never hit Radix's data-[placeholder] state, so the
                // unfiltered label is muted explicitly to read as a placeholder.
                className={`w-52 shadow-none focus:border-[#A71D3A]/40 focus:ring-[#A71D3A]/20 ${
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
                className={`w-44 shadow-none focus:border-[#A71D3A]/40 focus:ring-[#A71D3A]/20 ${
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

      {/* Card 2 — Table */}
      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
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

    {/* Create (Onboard user) Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(o) => { if (!o) { setIsCreateOpen(false); resetDialogState(); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t('admin.users.addUserDialogTitle')}</DialogTitle></DialogHeader>
          {dialogBody('create')}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetDialogState(); }} disabled={isCreating}>{t('actions.cancel')}</Button>
            <Button onClick={handleCreate} disabled={isCreating} style={{ background: 'linear-gradient(135deg, #A71D3A, #6B1428)', border: 'none' }} className="text-white">{isCreating ? t('admin.users.creating') : t('actions.confirmSave')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewTarget} onOpenChange={(o) => { if (!o) setViewTarget(null); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto gap-0 p-0">
          {viewTarget && (() => {
            const roleNames = userRoleNames(viewTarget);
            // Display-only identifier, same convention as REQ-/EGR- codes elsewhere.
            const userCode = `USR-${String(viewTarget.ID).padStart(4, '0')}`;
            const rows = [
              { key: 'role',    icon: Shield,   label: t('admin.users.roleIdLabel', { defaultValue: 'Role ID' }), value: roleNames.join(', ') || '—' },
              { key: 'created', icon: Calendar, label: t('admin.users.createdLabel', { defaultValue: 'Created' }), value: formatDate(viewTarget.CREATED_AT) },
              { key: 'id',      icon: IdCard,   label: t('admin.users.userIdLabel', { defaultValue: 'User ID' }), value: userCode },
            ];
            return (
              <>
                {/* Identity block — pe-12 keeps the name clear of the dialog's close button */}
                <div className="p-5 pb-4 pe-12">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-start">
                      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F3DEE4] text-lg font-bold text-[#A71D3A]">
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
                      <span key={name} className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${getRoleBadgeClass(name)}`}>
                        {toTitleCaseRole(name)}
                      </span>
                    ))}
                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                      viewTarget.IS_ACTIVE ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {viewTarget.IS_ACTIVE ? t('admin.users.statusActive') : t('admin.users.statusInactive')}
                    </span>
                  </div>
                </div>

                {/* Attribute rows — full-bleed dividers give the label/value pairs a shared
                    baseline, replacing the stack of individually-bordered grey cards. */}
                <div className="border-y border-slate-200">
                  {rows.map(({ key, icon: Icon, label, value }) => (
                    <div key={key} className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 last:border-b-0">
                      <span className="flex shrink-0 items-center gap-2 text-sm text-slate-500">
                        <Icon className="h-4 w-4 text-slate-400" />
                        {label}
                      </span>
                      <span className="truncate text-sm font-semibold text-slate-900">
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
                    style={{ background: 'linear-gradient(135deg, #A71D3A, #6B1428)', border: 'none' }}
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

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) { setEditTarget(null); resetDialogState(); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t('admin.users.editUserDialogTitle')}</DialogTitle></DialogHeader>
          {dialogBody('edit')}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditTarget(null); resetDialogState(); }} disabled={isUpdating}>{t('actions.cancel')}</Button>
            <Button onClick={handleUpdate} disabled={isUpdating} style={{ background: 'linear-gradient(135deg, #A71D3A, #6B1428)', border: 'none' }} className="text-white">{isUpdating ? t('admin.users.saving') : t('actions.saveChanges')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
