'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Plus, Eye, EyeOff, RefreshCw } from 'lucide-react';
import {
  useGetUsersListQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useGetRolesListQuery,
  useGetRegulatorScopesQuery,
} from '../api/adminApi';
import { ADMIN_MAX_LENGTHS, ADMIN_DEFAULT_FILTERS, NO_SCOPE_VALUE, GLOBAL_SCOPE_VALUE } from '../constants';
import type { SbrUser, SbrRole, UserRoleInput } from '@/types';
import { cleanParams } from '@/utils/query';
import { toast } from '@/utils/toast';
import { useDebounce } from '@/hooks';
import { useTranslation } from 'react-i18next';

function getApiError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const msg = (err as { data?: { message?: string } }).data?.message;
    if (msg) return msg;
  }
  return fallback;
}

// distinct role names a user holds (for chips + super-admin guard)
function userRoleNames(user: SbrUser): string[] {
  const names = (user.roleAssignments ?? []).map((a) => a.role?.ROLE_NAME ?? '').filter(Boolean);
  return [...new Set(names)];
}

const isSuperAdminUser = (user: SbrUser) => userRoleNames(user).includes('SUPER_ADMIN');

type RoleSelection = Record<number, { EXPIRES_AT: string }>;

const EMPTY_FORM = { NAME: '', EMAIL: '', PASSWORD: '', IS_ACTIVE: 'Y', SCOPE: NO_SCOPE_VALUE };

export function UsersTab({ canEdit = false, canViewDetail = false }: { canEdit?: boolean; canViewDetail?: boolean }) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({ ...ADMIN_DEFAULT_FILTERS });
  const [editTarget, setEditTarget] = useState<SbrUser | null>(null);
  const [viewTarget, setViewTarget] = useState<SbrUser | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [selectedRoles, setSelectedRoles] = useState<RoleSelection>({});
  const [showPassword, setShowPassword] = useState(false);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
    let pwd = '';
    for (let i = 0; i < 12; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    setForm(p => ({ ...p, PASSWORD: pwd }));
    setShowPassword(true);
  };

  // Debounce only the text search — typing no longer fires an API call per keystroke
  const debouncedSearch = useDebounce(filters.search, 500);

  const { data, isLoading } = useGetUsersListQuery(
    cleanParams({ ...filters, search: debouncedSearch }),
    { refetchOnMountOrArgChange: true }
  );
  // Roles + scopes are only needed for the create/edit dialogs — skip if user can't edit
  const { data: rolesData } = useGetRolesListQuery(
    { page: 1, limit: 100 },
    { refetchOnMountOrArgChange: true, skip: !canEdit }
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
    setSelectedRoles({});
    setShowPassword(false);
  };

  const toggleRole = (roleId: number, checked: boolean) => {
    setSelectedRoles((prev) => {
      const next = { ...prev };
      if (checked) next[roleId] = next[roleId] ?? { EXPIRES_AT: '' };
      else delete next[roleId];
      return next;
    });
  };

  const setRoleExpiry = (roleId: number, expiry: string) => {
    setSelectedRoles((prev) => ({ ...prev, [roleId]: { EXPIRES_AT: expiry } }));
  };

  const buildRolesPayload = (): UserRoleInput[] =>
    Object.entries(selectedRoles).map(([roleId, sel]) => {
      const role = roles.find((r) => r.ID === Number(roleId));
      const scoped = role?.IS_SCOPED === true;
      return {
        ROLE_ID: Number(roleId),
        SCOPE: scoped && form.SCOPE !== NO_SCOPE_VALUE ? form.SCOPE : undefined,
        EXPIRES_AT: sel.EXPIRES_AT || null,
      };
    });

  const validateForm = (requirePassword: boolean): boolean => {
    if (!form.NAME.trim()) { toast.error('Name is required.'); return false; }
    if (!form.EMAIL.trim()) { toast.error('Email is required.'); return false; }
    if (requirePassword && !form.PASSWORD.trim()) { toast.error('Password is required.'); return false; }
    if (form.NAME.length > ADMIN_MAX_LENGTHS.NAME) { toast.error(`Max ${ADMIN_MAX_LENGTHS.NAME} characters for name.`); return false; }
    if (form.EMAIL.length > ADMIN_MAX_LENGTHS.EMAIL) { toast.error(`Max ${ADMIN_MAX_LENGTHS.EMAIL} characters for email.`); return false; }
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
      toast.success('User created successfully!');
      resetDialogState();
      setIsCreateOpen(false);
      setFilters({ ...ADMIN_DEFAULT_FILTERS });
    } catch (err) {
      toast.error(getApiError(err, 'Failed to create user. Please try again.'));
    }
  };

  const handleUpdate = async () => {
    if (!editTarget) return;
    if (!form.NAME.trim()) { toast.error('Name is required.'); return; }
    try {
      await updateUser({
        id: editTarget.ID,
        data: {
          NAME: form.NAME,
          IS_ACTIVE: form.IS_ACTIVE === 'Y',
          roles: buildRolesPayload(),
        },
      }).unwrap();
      toast.success('User updated successfully!');
      setEditTarget(null);
      resetDialogState();
    } catch (err) {
      toast.error(getApiError(err, 'Failed to update user. Please try again.'));
    }
  };

  const openEdit = (user: SbrUser) => {
    setEditTarget(user);
    const assignments = user.roleAssignments ?? [];
    const selection: RoleSelection = {};
    for (const a of assignments) {
      if (!selection[a.ROLE_ID]) {
        selection[a.ROLE_ID] = { EXPIRES_AT: a.EXPIRES_AT ? a.EXPIRES_AT.slice(0, 10) : '' };
      }
    }
    const scopedAssignment = assignments.find((a) => a.SCOPE && a.SCOPE !== GLOBAL_SCOPE_VALUE);
    setSelectedRoles(selection);
    setForm({
      NAME: user.NAME,
      EMAIL: user.EMAIL,
      PASSWORD: '',
      IS_ACTIVE: user.IS_ACTIVE ? 'Y' : 'N',
      SCOPE: scopedAssignment?.SCOPE ?? NO_SCOPE_VALUE,
    });
  };

  const users = data?.data ?? [];

  const roleRow = (role: SbrRole) => {
    const checked = !!selectedRoles[role.ID];
    const scoped = role.IS_SCOPED === true;
    return (
      <div key={role.ID} className="flex items-center gap-2">
        <label
          className={`flex flex-1 items-center gap-2.5 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
            checked ? 'border-[#A71D3A]/40 bg-[#F3DEE4]/40' : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <Checkbox checked={checked} onCheckedChange={(v) => toggleRole(role.ID, v === true)} />
          <span className="flex-1 text-sm text-slate-800">{role.ROLE_NAME}</span>
          {scoped && (
            <span className="text-[10px] font-bold tracking-wide text-[#A71D3A]">{t('admin.users.scopedBadge')}</span>
          )}
        </label>
        {checked && (
          <Input
            type="date"
            value={selectedRoles[role.ID]?.EXPIRES_AT ?? ''}
            onChange={(e) => setRoleExpiry(role.ID, e.target.value)}
            className="w-[150px] shrink-0"
            title={t('admin.users.expiryTitle')}
          />
        )}
      </div>
    );
  };

  // Shared dialog body for create + edit (per the onboarding reference design)
  const dialogBody = (mode: 'create' | 'edit') => (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="user-name">{t('admin.users.nameLabel')}</Label>
          <Input id="user-name" value={form.NAME} onChange={(e) => setForm(p => ({ ...p, NAME: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="user-email">{t('admin.users.emailLabel')}</Label>
          <Input id="user-email" type="email" value={form.EMAIL} disabled={mode === 'edit'}
            onChange={(e) => setForm(p => ({ ...p, EMAIL: e.target.value }))} />
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
                className="pr-9"
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
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="user-scope">{t('admin.users.regulatorScopeLabel')}</Label>
          <Select value={form.SCOPE} onValueChange={(v) => setForm(p => ({ ...p, SCOPE: v }))}>
            <SelectTrigger id="user-scope" className="focus:ring-[#A71D3A]">
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
          <Label htmlFor="user-status">{t('admin.users.statusLabel')}</Label>
          <Select value={form.IS_ACTIVE} onValueChange={(v) => setForm(p => ({ ...p, IS_ACTIVE: v }))}>
            <SelectTrigger id="user-status" className="focus:ring-[#A71D3A]">
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
        <p className="text-sm font-semibold text-slate-800">{t('admin.users.assignedRolesLabel')}</p>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder={t('admin.users.searchPlaceholder')}
          value={filters.search}
          onChange={(e) => setFilters(p => ({ ...p, search: e.target.value, page: 1 }))}
          className="max-w-xs"
        />
        {canEdit && (
          <Button onClick={() => { resetDialogState(); setIsCreateOpen(true); }} style={{ background: 'linear-gradient(135deg, #A71D3A, #6B1428)', border: 'none' }} className="text-white hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" /> {t('admin.users.addUser')}
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full">
          <thead className="bg-white border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-start text-xs font-medium text-slate-500 uppercase tracking-wide">{t('admin.users.colUser')}</th>
              <th className="px-6 py-3 text-start text-xs font-medium text-slate-500 uppercase tracking-wide">{t('admin.users.colRoles')}</th>
              <th className="px-6 py-3 text-start text-xs font-medium text-slate-500 uppercase tracking-wide">{t('admin.users.colStatus')}</th>
              <th className="px-6 py-3 text-start text-xs font-medium text-slate-500 uppercase tracking-wide">{t('admin.users.colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">{t('admin.users.loading')}</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">{t('admin.users.noUsers')}</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.ID} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-start">
                    <p className="text-sm font-semibold text-slate-900">{user.NAME}</p>
                    <p className="text-xs text-[#A71D3A]">{user.EMAIL}</p>
                  </td>
                  <td className="px-6 py-4 text-start">
                    <div className="flex flex-wrap gap-1">
                      {userRoleNames(user).length === 0 ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        userRoleNames(user).map((name) => (
                          <span key={name} className="rounded px-2 py-0.5 text-[11px] font-semibold bg-[#A71D3A] text-white whitespace-nowrap">
                            {name}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-start">
                    <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                      user.IS_ACTIVE ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {user.IS_ACTIVE ? t('admin.users.statusActive') : t('admin.users.statusInactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-2 justify-start">
                    {canViewDetail && (
                      <Button size="sm" variant="outline" onClick={() => setViewTarget(user)} title={t('admin.users.viewUserTitle')} className="h-8 w-8 p-0">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {canEdit && (
                      <Button
                        size="sm" variant="outline"
                        onClick={() => openEdit(user)}
                        disabled={isUpdating || isSuperAdminUser(user)}
                        title={isSuperAdminUser(user) ? t('admin.users.superAdminCannotEdit') : t('admin.users.editUserTitle')}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create (Onboard user) Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(o) => { if (!o) { setIsCreateOpen(false); resetDialogState(); } }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-[#F3DEE4] text-[#A71D3A] font-bold text-sm">
                {viewTarget?.NAME?.charAt(0)?.toUpperCase()}
              </span>
              {viewTarget?.NAME}
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-3">
            {[
              { label: t('admin.users.nameLabel'),  value: viewTarget?.NAME },
              { label: t('admin.users.emailLabel'), value: viewTarget?.EMAIL },
              { label: t('admin.users.colRoles'),   value: viewTarget ? userRoleNames(viewTarget).join(', ') : '' },
              { label: t('admin.users.colStatus'),  value: viewTarget ? (viewTarget.IS_ACTIVE ? t('admin.users.statusActive') : t('admin.users.statusInactive')) : '' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider w-16 shrink-0">{label}</span>
                <span className="text-sm font-medium text-slate-800">{value || '—'}</span>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewTarget(null)}>{t('admin.users.close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) { setEditTarget(null); resetDialogState(); } }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t('admin.users.editUserDialogTitle')}</DialogTitle></DialogHeader>
          {dialogBody('edit')}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditTarget(null); resetDialogState(); }} disabled={isUpdating}>{t('actions.cancel')}</Button>
            <Button onClick={handleUpdate} disabled={isUpdating} style={{ background: 'linear-gradient(135deg, #A71D3A, #6B1428)', border: 'none' }} className="text-white">{isUpdating ? t('admin.users.saving') : t('actions.saveChanges')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
