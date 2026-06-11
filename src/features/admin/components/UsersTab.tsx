'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Plus, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useGetUsersListQuery, useCreateUserMutation, useUpdateUserMutation, useGetRolesListQuery } from '../api/adminApi';
import { ADMIN_MAX_LENGTHS, ADMIN_DEFAULT_FILTERS } from '../constants';
import type { SbrUser } from '@/types';
import { cleanParams } from '@/utils/query';
import { toast } from '@/utils/toast';
import { useTranslation } from 'react-i18next';

function getApiError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const msg = (err as { data?: { message?: string } }).data?.message;
    if (msg) return msg;
  }
  return fallback;
}

export function UsersTab({ canEdit = false, canViewDetail = false }: { canEdit?: boolean; canViewDetail?: boolean }) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({ ...ADMIN_DEFAULT_FILTERS });
  const [editTarget, setEditTarget] = useState<SbrUser | null>(null);
  const [viewTarget, setViewTarget] = useState<SbrUser | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({ NAME: '', EMAIL: '', PASSWORD: '', ROLE_ID: '' });
  const [showPassword, setShowPassword] = useState(false);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
    let pwd = '';
    for (let i = 0; i < 12; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    setForm(p => ({ ...p, PASSWORD: pwd }));
    setShowPassword(true);
  };

  const { data, isLoading } = useGetUsersListQuery(cleanParams(filters), { refetchOnMountOrArgChange: true });
  // Roles list is only needed for create/edit dialogs — skip if user can't edit
  const { data: rolesData } = useGetRolesListQuery(
    { page: 1, limit: 100 },
    { refetchOnMountOrArgChange: true, skip: !canEdit }
  );
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const roles = rolesData?.data ?? [];

  const handleCreate = async () => {
    if (!form.NAME.trim()) {
      toast.error('Name is required.');
      return;
    }
    if (!form.EMAIL.trim()) {
      toast.error('Email is required.');
      return;
    }
    if (!form.PASSWORD.trim()) {
      toast.error('Password is required.');
      return;
    }
    if (!form.ROLE_ID) {
      toast.error('Role is required.');
      return;
    }
    if (form.NAME.length > ADMIN_MAX_LENGTHS.NAME) {
      toast.error(`Max ${ADMIN_MAX_LENGTHS.NAME} characters for name.`);
      return;
    }
    if (form.EMAIL.length > ADMIN_MAX_LENGTHS.EMAIL) {
      toast.error(`Max ${ADMIN_MAX_LENGTHS.EMAIL} characters for email.`);
      return;
    }

    try {
      await createUser({
        NAME: form.NAME,
        EMAIL: form.EMAIL,
        PASSWORD: form.PASSWORD,
        ROLE_ID: Number(form.ROLE_ID),
      }).unwrap();
      toast.success('User created successfully!');
      setForm({ NAME: '', EMAIL: '', PASSWORD: '', ROLE_ID: '' });
      setShowPassword(false);
      setIsCreateOpen(false);
      setFilters({ ...ADMIN_DEFAULT_FILTERS });
    } catch (err) {
      toast.error(getApiError(err, 'Failed to create user. Please try again.'));
    }
  };

  const handleUpdate = async () => {
    if (!editTarget) return;
    if (!form.NAME.trim()) {
      toast.error('Name is required.');
      return;
    }
    if (!form.ROLE_ID) {
      toast.error('Role is required.');
      return;
    }

    const hasChanges = form.NAME !== editTarget.NAME || form.ROLE_ID !== String(editTarget.ROLE_ID);
    if (!hasChanges) {
      toast.info('No changes detected.');
      return;
    }

    try {
      await updateUser({
        id: editTarget.ID,
        data: {
          NAME: form.NAME,
          ROLE_ID: Number(form.ROLE_ID),
        },
      }).unwrap();
      toast.success('User updated successfully!');
      setEditTarget(null);
      setForm({ NAME: '', EMAIL: '', PASSWORD: '', ROLE_ID: '' });
    } catch (err) {
      toast.error(getApiError(err, 'Failed to update user. Please try again.'));
    }
  };

  const users = data?.data ?? [];

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
          <Button onClick={() => { setForm({ NAME: '', EMAIL: '', PASSWORD: '', ROLE_ID: '' }); setShowPassword(false); setIsCreateOpen(true); }} style={{ background: 'linear-gradient(135deg, #A71D3A, #6B1428)', border: 'none' }} className="text-white hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" /> {t('admin.users.addUser')}
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full">
          <thead className="bg-white border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-start text-xs font-medium text-slate-500 uppercase tracking-wide">{t('admin.users.colName')}</th>
              <th className="px-6 py-3 text-start text-xs font-medium text-slate-500 uppercase tracking-wide">{t('admin.users.colEmail')}</th>
              <th className="px-6 py-3 text-start text-xs font-medium text-slate-500 uppercase tracking-wide">{t('admin.users.colRole')}</th>
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
                  <td className="px-6 py-4 text-sm text-slate-700 text-start">{user.NAME}</td>
                  <td className="px-6 py-4 text-sm text-slate-700 text-start">{user.EMAIL}</td>
                  <td className="px-6 py-4 text-sm text-slate-700 text-start">{user.role?.ROLE_NAME || '—'}</td>
                  <td className="px-6 py-4 flex gap-2 justify-start">
                    {canViewDetail && (
                      <Button
                        size="sm" variant="outline"
                        onClick={() => setViewTarget(user)}
                        title={t('admin.users.viewUserTitle')}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {canEdit && (
                      <Button
                        size="sm" variant="outline"
                        onClick={() => {
                          setEditTarget(user);
                          setForm({ NAME: user.NAME, EMAIL: user.EMAIL, PASSWORD: '', ROLE_ID: String(user.ROLE_ID) });
                        }}
                        disabled={isUpdating || user.role?.ROLE_NAME === 'SUPER_ADMIN'}
                        title={user.role?.ROLE_NAME === 'SUPER_ADMIN' ? t('admin.users.superAdminCannotEdit') : t('admin.users.editUserTitle')}
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

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t('admin.users.addUserDialogTitle')}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="user-name">{t('admin.users.nameLabel')}</Label>
              <Input id="user-name" value={form.NAME} onChange={(e) => setForm(p => ({ ...p, NAME: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="user-email">{t('admin.users.emailLabel')}</Label>
              <Input id="user-email" type="email" value={form.EMAIL} onChange={(e) => setForm(p => ({ ...p, EMAIL: e.target.value }))} />
            </div>
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={generatePassword}
                  title="Auto-generate password"
                  className="h-9 px-3 shrink-0"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="user-role">{t('admin.users.roleLabel')}</Label>
              <Select value={form.ROLE_ID || undefined} onValueChange={(v) => setForm(p => ({ ...p, ROLE_ID: v }))}>
                <SelectTrigger id="user-role" className="focus:ring-[#A71D3A]">
                  <SelectValue placeholder={t('admin.users.selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.ID} value={String(role.ID)} className="focus:bg-[#A71D3A] focus:text-white">
                      {role.ROLE_NAME}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>{t('actions.cancel')}</Button>
            <Button onClick={handleCreate} disabled={isCreating} style={{ background: 'linear-gradient(135deg, #A71D3A, #6B1428)', border: 'none' }} className="text-white">{isCreating ? t('admin.users.creating') : t('actions.confirmSave')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewTarget} onOpenChange={(o) => { if (!o) setViewTarget(null); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                {viewTarget?.NAME?.charAt(0)?.toUpperCase()}
              </span>
              {viewTarget?.NAME}
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-3">
            {[
              { label: t('admin.users.nameLabel'),  value: viewTarget?.NAME },
              { label: t('admin.users.emailLabel'), value: viewTarget?.EMAIL },
              { label: t('admin.users.roleLabel'),  value: viewTarget?.role?.ROLE_NAME },
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
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t('admin.users.editUserDialogTitle')}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="edit-user-name">{t('admin.users.nameLabel')}</Label>
              <Input id="edit-user-name" value={form.NAME} onChange={(e) => setForm(p => ({ ...p, NAME: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-user-email">{t('admin.users.emailLabel')}</Label>
              <Input id="edit-user-email" type="email" value={form.EMAIL} disabled />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-user-role">{t('admin.users.roleLabel')}</Label>
              <Select value={form.ROLE_ID || undefined} onValueChange={(v) => setForm(p => ({ ...p, ROLE_ID: v }))}>
                <SelectTrigger id="edit-user-role" className="focus:ring-[#A71D3A]">
                  <SelectValue placeholder={t('admin.users.selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.ID} value={String(role.ID)} className="focus:bg-[#A71D3A] focus:text-white">
                      {role.ROLE_NAME}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)} disabled={isUpdating}>{t('actions.cancel')}</Button>
            <Button onClick={handleUpdate} disabled={isUpdating} style={{ background: 'linear-gradient(135deg, #A71D3A, #6B1428)', border: 'none' }} className="text-white">{isUpdating ? t('admin.users.saving') : t('actions.saveChanges')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
