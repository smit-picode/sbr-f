'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Pencil, ShieldCheck, Info, Check } from 'lucide-react';
import { InfoTooltip } from '@/components/common/InfoTooltip';
import { SearchInput } from '@/components/common/SearchInput';
import { useAppSelector, useAppDispatch } from '@/hooks';
import {
  adminApi,
  useGetRolesListQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useGetPermissionsListQuery,
  useGetRolePermissionsQuery,
  useAssignRolePermissionsMutation,
} from '../api/adminApi';
import { ADMIN_DEFAULT_FILTERS } from '../constants';
import type { SbrRole, SbrPermission } from '@/types';
import { cleanParams } from '@/utils/query';
import { toast } from '@/utils/toast';
import { useTranslation } from 'react-i18next';
import { PERMISSION_TREE, type PermissionNode } from '@/constants/permissionTree';

function getApiError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const msg = (err as { data?: { message?: string } }).data?.message;
    if (msg) return msg;
  }
  return fallback;
}

// ─── Tree helpers ────────────────────────────────────────────────────────────

type TreeNode  = { perm: SbrPermission | null; node: PermissionNode; children: TreeNode[] };
type LeafEntry = { perm: SbrPermission; label: string; nodeKey: string };

function buildTreeNode(node: PermissionNode, byName: Record<string, SbrPermission>): TreeNode {
  return {
    perm: byName[node.key] ?? null,
    node,
    children: (node.children ?? []).map(child => buildTreeNode(child, byName)),
  };
}

function buildTree(allPerms: SbrPermission[]): TreeNode[] {
  const byName = Object.fromEntries(allPerms.map(p => [p.PERMISSION_NAME, p]));
  return PERMISSION_TREE.map(node => buildTreeNode(node, byName));
}

function flatLeafEntries(items: TreeNode[]): LeafEntry[] {
  const result: LeafEntry[] = [];
  for (const item of items) {
    if (item.children.length > 0) result.push(...flatLeafEntries(item.children));
    else if (item.perm) result.push({ perm: item.perm, label: item.node.label, nodeKey: item.node.key });
  }
  return result;
}

// ─── Role display name — replaces _ with space for human-readable labels ─────
function displayRoleName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\B\w/g, (c) => c.toLowerCase());
}

// ─── Permission label helper ─────────────────────────────────────────────────

// Permission and section labels are always shown in English regardless of UI language
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pLabel(_key: string, fallback: string, _t: any): string {
  return fallback;
}

// ─── Permission grid (2-column card grid) ────────────────────────────────────

function PermissionGrid({
  entries, grantedIds, onToggle, canEdit,
}: {
  entries:    LeafEntry[];
  grantedIds: Set<number>;
  onToggle:   (id: number, granted: boolean) => void;
  canEdit:    boolean;
}) {
  const { t } = useTranslation();
  if (entries.length === 0) return null;
  return (
    <div className="grid sm:grid-cols-2 gap-2">
      {entries.map(({ perm, label, nodeKey }) => {
        const granted = grantedIds.has(perm.ID);
        return (
          <div
            key={perm.ID}
            className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors ${
              granted
                ? 'border-[#A71D3A]/40 bg-[#FCF4F6]'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <button
              type="button"
              onClick={() => canEdit && onToggle(perm.ID, !granted)}
              disabled={!canEdit}
              className={`flex items-center gap-2.5 flex-1 text-start min-w-0 ${
                canEdit ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded border shrink-0 ${
                  granted ? 'border-[#A71D3A] bg-[#A71D3A] text-white' : 'border-slate-300'
                }`}
              >
                {granted && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              <span className="text-[12.5px] text-slate-700 truncate">
                {pLabel(nodeKey, label, t)}
              </span>
            </button>
            <span className="relative group shrink-0">
              <Info className="h-3.5 w-3.5 text-slate-300 group-hover:text-[#A71D3A] cursor-help" />
              <span className="pointer-events-none absolute z-50 end-0 top-6 w-56 rounded-lg bg-slate-900 text-white text-[11px] leading-snug px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
                <span className="block font-semibold mb-0.5">{pLabel(nodeKey, label, t)}</span>
                <span className="block font-mono text-[10px] text-slate-300">{perm.PERMISSION_NAME}</span>
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Permission section (one top-level tree node) ────────────────────────────

function PermSection({
  treeNode, grantedIds, onToggle, canEdit,
}: {
  treeNode:   TreeNode;
  grantedIds: Set<number>;
  onToggle:   (id: number, granted: boolean) => void;
  canEdit:    boolean;
}) {
  const { t } = useTranslation();
  const { node, children } = treeNode;
  const sectionLabel  = pLabel(node.key, node.label, t);
  const hasSubGroups  = children.some(c => c.children.length > 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      {/* Section label — inside the card */}
      <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2.5">
        {sectionLabel}
      </h3>

      {hasSubGroups ? (
        <div className="space-y-3">
          {children.map(child => {
            if (child.children.length > 0) {
              return (
                <div key={child.node.key}>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">
                    {pLabel(child.node.key, child.node.label, t)}
                  </p>
                  <PermissionGrid
                    entries={flatLeafEntries(child.children)}
                    grantedIds={grantedIds}
                    onToggle={onToggle}
                    canEdit={canEdit}
                  />
                </div>
              );
            }
            if (child.perm) {
              return (
                <PermissionGrid
                  key={child.node.key}
                  entries={[{ perm: child.perm, label: child.node.label, nodeKey: child.node.key }]}
                  grantedIds={grantedIds}
                  onToggle={onToggle}
                  canEdit={canEdit}
                />
              );
            }
            return null;
          })}
        </div>
      ) : (
        <PermissionGrid
          entries={flatLeafEntries(children)}
          grantedIds={grantedIds}
          onToggle={onToggle}
          canEdit={canEdit}
        />
      )}
    </div>
  );
}

// ─── Loading skeleton — mirrors the roles list + permission panel layout ─────

function RolesTabSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start animate-pulse">
      {/* Roles list card */}
      <div className="rounded-xl border border-slate-200 bg-white p-2">
        <div className="h-3 w-16 bg-slate-200 rounded mx-2 my-2" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 px-2.5 py-2">
            <span className="h-2 w-2 rounded-full bg-slate-200 shrink-0" />
            <span className="h-3 flex-1 bg-slate-200 rounded" />
            <span className="h-3 w-4 bg-slate-200 rounded" />
          </div>
        ))}
      </div>

      {/* Permission panel */}
      <div className="lg:col-span-3 space-y-3">
        {/* Role header box */}
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <span className="h-7 w-7 rounded-lg bg-slate-200 shrink-0" />
          <div className="space-y-1.5">
            <span className="block h-3 w-32 bg-slate-200 rounded" />
            <span className="block h-2.5 w-20 bg-slate-200 rounded" />
          </div>
          <span className="ms-auto h-3 w-24 bg-slate-200 rounded" />
        </div>

        {/* Section cards */}
        {Array.from({ length: 3 }).map((_, s) => (
          <div key={s} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="h-2.5 w-24 bg-slate-200 rounded mb-3" />
            <div className="grid sm:grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2">
                  <span className="h-4 w-4 rounded bg-slate-200 shrink-0" />
                  <span className="h-3 flex-1 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RolesTab({
  canEdit = false,
  canCreate = false,
  onRegisterCreate,
}: {
  canEdit?: boolean;
  canCreate?: boolean;
  onRegisterCreate?: (fn: () => void) => void;
}) {
  const { t } = useTranslation();

  // ── local state ──
  const [selectedRole, setSelectedRole]   = useState<SbrRole | null>(null);
  const [grantedIds, setGrantedIds]       = useState<Set<number>>(new Set());
  const [originalIds, setOriginalIds]     = useState<Set<number>>(new Set());
  const [isCreateOpen, setIsCreateOpen]   = useState(false);
  const [editTarget, setEditTarget]       = useState<SbrRole | null>(null);
  const [form, setForm]                   = useState({ ROLE_NAME: '' });
  const [permSearch, setPermSearch]       = useState('');

  // ── permission gate ──
  const dispatch    = useAppDispatch();
  const user        = useAppSelector((s) => s.auth.user);
  const permissions = useAppSelector((s) => s.auth.permissions);
  const isSA        = user?.role === 'SUPER_ADMIN' || user?.role?.toUpperCase() === 'SUPER_ADMIN';
  // The permission listing/matrix is gated SOLELY by permissions.view. roles.edit lets a
  // user toggle & save a role's permissions, but only once they can already SEE the listing
  // (permissions.view). roles.edit or roles.view alone never reveals the permission listing.
  const canFetchPerms = isSA || permissions.some(p =>
    p.permissionName === 'admin_panel.permissions.view'
  );
  // Whether the current user may use the permission search bar
  const canSearchPerms = isSA || permissions.some(p => p.permissionName === 'admin_panel.permissions.search');

  // ── queries ──
  const { data: rolesData, isLoading: isRolesLoading } = useGetRolesListQuery(
    cleanParams({ ...ADMIN_DEFAULT_FILTERS, limit: 100 }),
    { refetchOnMountOrArgChange: true },
  );
  const { data: permData, isLoading: isPermsLoading } = useGetPermissionsListQuery(
    { page: 1, limit: 100 },
    { skip: !canFetchPerms },
  );
  const { data: rolePermData } = useGetRolePermissionsQuery(
    selectedRole?.ID ?? 0,
    { skip: !selectedRole || !canFetchPerms, refetchOnMountOrArgChange: true },
  );

  // ── mutations ──
  const [createRole,       { isLoading: isCreating  }] = useCreateRoleMutation();
  const [updateRole,       { isLoading: isUpdating  }] = useUpdateRoleMutation();
  const [assignPermissions,{ isLoading: isAssigning }] = useAssignRolePermissionsMutation();

  const roles          = rolesData?.data ?? [];
  const allPermissions = permData?.data  ?? [];
  const permTree       = buildTree(allPermissions);

  // Search filter for the permission list (matches by label or permission key)
  const permSearchQuery   = permSearch.trim().toLowerCase();
  const filteredPermEntries = permSearchQuery
    ? flatLeafEntries(permTree).filter(e =>
        e.label.toLowerCase().includes(permSearchQuery) ||
        e.perm.PERMISSION_NAME.toLowerCase().includes(permSearchQuery))
    : [];

  // Pre-fetch all role permissions so counts are visible upfront in the sidebar
  useEffect(() => {
    if (!canFetchPerms || roles.length === 0) return;
    const subs = roles.map(role =>
      dispatch(adminApi.endpoints.getRolePermissions.initiate(role.ID)),
    );
    return () => { subs.forEach(sub => sub.unsubscribe()); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles, canFetchPerms]);

  // Read permission counts for all roles from the RTK Query cache
  const cachedCounts = useAppSelector(state =>
    roles.reduce<Record<number, number>>((acc, role) => {
      const result = adminApi.endpoints.getRolePermissions.select(role.ID)(state);
      if (result.data) {
        const raw = (result.data.data as unknown as unknown[]) ?? [];
        acc[role.ID] = raw.length;
      }
      return acc;
    }, {}),
  );

  // Register the "open create dialog" callback with the parent page header (gated by the create permission)
  useEffect(() => {
    if (canCreate && onRegisterCreate) {
      onRegisterCreate(() => { setForm({ ROLE_NAME: '' }); setIsCreateOpen(true); });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canCreate, onRegisterCreate]);

  // Auto-select first role on load
  useEffect(() => {
    if (roles.length > 0 && !selectedRole) setSelectedRole(roles[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles]);

  // Load permissions when selected role or its data changes
  useEffect(() => {
    const raw = ((rolePermData?.data as unknown) as Array<{ PERMISSION_ID?: number }>) ?? [];
    const ids = new Set(
      raw.map(r => r.PERMISSION_ID).filter((id): id is number => id !== undefined),
    );
    setGrantedIds(ids);
    setOriginalIds(new Set(ids));
  }, [selectedRole?.ID, rolePermData]);

  // ── dirty check ──
  const isDirty = (() => {
    if (grantedIds.size !== originalIds.size) return true;
    for (const id of grantedIds) if (!originalIds.has(id)) return true;
    return false;
  })();

  // ── handlers ──
  const handleToggle = (id: number, granted: boolean) => {
    const toggled = allPermissions.find(p => p.ID === id);

    if (granted) {
      // Block enabling any admin_panel child if admin_panel.view is not granted
      const isAdminChild =
        toggled?.PERMISSION_NAME?.startsWith('admin_panel.') &&
        toggled?.PERMISSION_NAME !== 'admin_panel.view';
      if (isAdminChild) {
        const viewAdminPerm = allPermissions.find(p => p.PERMISSION_NAME === 'admin_panel.view');
        if (viewAdminPerm && !grantedIds.has(viewAdminPerm.ID)) {
          toast.warning('Please enable "View Admin Panel" permission first.');
          return;
        }
      }
      setGrantedIds(prev => { const next = new Set(prev); next.add(id); return next; });
    } else {
      setGrantedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        // When "View Admin Panel" is unchecked, cascade-remove all its child permissions
        if (toggled?.PERMISSION_NAME === 'admin_panel.view') {
          allPermissions
            .filter(p => p.PERMISSION_NAME?.startsWith('admin_panel.') && p.PERMISSION_NAME !== 'admin_panel.view')
            .forEach(p => next.delete(p.ID));
        }
        return next;
      });
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    const roleId  = selectedRole.ID;
    const permIds = Array.from(grantedIds);
    try {
      await assignPermissions({ roleId, permissions: permIds }).unwrap();
      setOriginalIds(new Set(grantedIds));
      toast.success('Permissions saved successfully!');
    } catch (err) {
      toast.error(getApiError(err, 'Failed to save permissions. Please try again.'));
    }
  };

  const handleCreate = async () => {
    if (!form.ROLE_NAME.trim()) { toast.error('Role name is required.'); return; }
    try {
      await createRole({ ROLE_NAME: form.ROLE_NAME, permissions: [] }).unwrap();
      toast.success('Role created successfully!');
      setForm({ ROLE_NAME: '' });
      setIsCreateOpen(false);
    } catch (err) {
      toast.error(getApiError(err, 'Failed to create role. Please try again.'));
    }
  };

  const handleUpdate = async () => {
    if (!editTarget) return;
    if (!form.ROLE_NAME.trim()) { toast.error('Role name is required.'); return; }
    if (form.ROLE_NAME === editTarget.ROLE_NAME) { toast.info('No changes detected.'); return; }
    try {
      await updateRole({ id: editTarget.ID, data: { ROLE_NAME: form.ROLE_NAME } }).unwrap();
      toast.success('Role updated successfully!');
      setEditTarget(null);
      setForm({ ROLE_NAME: '' });
    } catch (err) {
      toast.error(getApiError(err, 'Failed to update role. Please try again.'));
    }
  };

  // Toggling & saving the permission matrix is gated by permissions.edit (editing the
  // permission listing) — NOT roles.edit (which only governs role-level actions like rename).
  // SUPER_ADMIN's own permissions are never editable.
  const canEditPerms = isSA || permissions.some(p => p.permissionName === 'admin_panel.permissions.edit');
  const canEditPermissions = canEditPerms && selectedRole?.ROLE_NAME !== 'SUPER_ADMIN';

  // Show a skeleton while the initial roles/permissions data is loading
  const isInitialLoading = isRolesLoading || (canFetchPerms && isPermsLoading);

  // ─────────────────────────────────────────────────────────────────────────
  if (isInitialLoading) return <RolesTabSkeleton />;

  return (
    <>
      {/* ── 4-column grid: roles list (1) │ permission panel (3) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">

        {/* ══ Roles list card ══ */}
        <div className="rounded-xl border border-slate-200 bg-white p-2">
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 px-2 py-1.5">
            {t('admin.roles.rolesLabel', { defaultValue: 'Roles' })}
          </div>
          {roles.map((role) => {
            const isSelected = selectedRole?.ID === role.ID;
            const count      = cachedCounts[role.ID];
            return (
              <button
                key={role.ID}
                onClick={() => setSelectedRole(role)}
                className={`group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-[12.5px] transition-colors ${
                  isSelected ? 'bg-[#FAEDF0]' : 'hover:bg-slate-50'
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ background: isSelected ? '#A71D3A' : '#94a3b8' }}
                />
                <span className={`flex-1 truncate ${
                  isSelected ? 'font-bold text-[#A71D3A]' : 'text-slate-700'
                }`}>
                  {role.ROLE_NAME}
                </span>

                {canEdit && role.ROLE_NAME !== 'SUPER_ADMIN' && (
                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setForm({ ROLE_NAME: role.ROLE_NAME });
                      setEditTarget(role);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5 hover:bg-slate-200"
                    title={t('admin.roles.editRoleTitle')}
                  >
                    <Pencil className="h-3 w-3 text-slate-400" />
                  </span>
                )}

                {count !== undefined && (
                  <span className="text-[10.5px] text-slate-400 tabular-nums">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ══ Permission matrix (3 cols) ══ */}
        {selectedRole ? (
          <div className="lg:col-span-3 space-y-3">

            {/* ── Role header — separate box ── */}
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <span className="h-7 w-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-[#A71D3A]">
                <ShieldCheck className="h-[15px] w-[15px]" />
              </span>
              <div className="min-w-0">
                <div className="font-bold text-slate-800 text-[14px] truncate">
                  {selectedRole.ROLE_NAME}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[11.5px] text-slate-400">
                    {selectedRole.IS_SCOPED
                      ? t('admin.roles.scopedRole', { defaultValue: 'Scoped Role' })
                      : t('admin.roles.globalRole', { defaultValue: 'Global Role' })}
                  </span>
                  <InfoTooltip content="This feature will be implemented in the next phase." iconClassName="h-3 w-3" contentClassName="max-w-[220px]" />
                </div>
              </div>
              <div className="ms-auto flex items-center gap-3">
                {canFetchPerms && (
                  <span className="text-[12px] text-slate-500 whitespace-nowrap" dir="ltr">
                    {grantedIds.size} / {allPermissions.length}
                    {' '}<span dir="auto">{t('admin.roles.permissions', { defaultValue: 'permissions' })}</span>
                  </span>
                )}
                {canEditPermissions && isDirty && (
                  <Button
                    size="sm"
                    onClick={handleSavePermissions}
                    disabled={isAssigning}
                    style={{ background: 'linear-gradient(135deg, #A71D3A, #6B1428)', border: 'none' }}
                    className="text-white hover:opacity-90 text-xs h-8 px-3"
                  >
                    {isAssigning ? t('admin.roles.saving') : t('admin.roles.savePermissions')}
                  </Button>
                )}
              </div>
            </div>

            {/* ── Search permissions (gated by admin_panel.permissions.search) ── */}
            {allPermissions.length > 0 && canSearchPerms && (
              <SearchInput
                value={permSearch}
                onChange={(v) => setPermSearch(v)}
                placeholder={t('admin.roles.searchPermissions', { defaultValue: 'Search permissions...' })}
                className="!w-full shadow-none"
              />
            )}

            {/* ── Permission groups — each a separate card ── */}
            {!canFetchPerms ? (
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-16 text-center text-sm text-slate-400">
                {t('admin.roles.noViewPermission', { defaultValue: 'You do not have permission to view permissions.' })}
              </div>
            ) : allPermissions.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-16 text-center text-sm text-slate-400">
                {t('admin.roles.noPermissionsAssigned')}
              </div>
            ) : (canSearchPerms && permSearchQuery) ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2.5">
                  {t('admin.roles.searchResults', { defaultValue: 'Search results' })}
                </h3>
                {filteredPermEntries.length > 0 ? (
                  <PermissionGrid
                    entries={filteredPermEntries}
                    grantedIds={grantedIds}
                    onToggle={handleToggle}
                    canEdit={canEditPermissions}
                  />
                ) : (
                  <p className="py-8 text-center text-sm text-slate-400">
                    {t('admin.roles.noPermissionsFound', { defaultValue: 'No permissions found' })}
                  </p>
                )}
              </div>
            ) : (
              permTree.map(treeNode => (
                <PermSection
                  key={treeNode.node.key}
                  treeNode={treeNode}
                  grantedIds={grantedIds}
                  onToggle={handleToggle}
                  canEdit={canEditPermissions}
                />
              ))
            )}
          </div>
        ) : (
          <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white px-4 py-16 text-center text-sm text-slate-400">
            {t('admin.roles.selectRolePrompt', { defaultValue: 'Select a role to view permissions' })}
          </div>
        )}
      </div>

      {/* ── Create Role dialog ── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('admin.roles.addRoleDialogTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="role-name">{t('admin.roles.roleName')}</Label>
              <Input
                id="role-name"
                value={form.ROLE_NAME}
                onChange={(e) => setForm(p => ({ ...p, ROLE_NAME: e.target.value }))}
                placeholder={t('admin.roles.roleNamePlaceholder')}
                className="focus:border-[#A71D3A]/40 focus:ring-[#A71D3A]/20"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Label>Category</Label>
                <InfoTooltip content="This feature will be implemented in the next phase." contentClassName="max-w-[220px]" />
              </div>
              <div className="relative">
                <select
                  disabled
                  className="flex h-9 w-full appearance-none rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-400 cursor-not-allowed"
                >
                  <option>SBR Managers</option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-slate-300">
                  ▾
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>
              {t('actions.cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isCreating}
              style={{ background: 'linear-gradient(135deg, #A71D3A, #6B1428)', border: 'none' }}
              className="text-white"
            >
              {isCreating ? t('admin.roles.creating') : t('actions.confirmSave')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Role Name dialog ── */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t('admin.roles.editRoleDialogTitle', { name: editTarget ? displayRoleName(editTarget.ROLE_NAME) : '' })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="edit-role-name">{t('admin.roles.roleName')}</Label>
              <Input
                id="edit-role-name"
                value={form.ROLE_NAME}
                onChange={(e) => setForm(p => ({ ...p, ROLE_NAME: e.target.value }))}
                className="focus:border-[#A71D3A]/40 focus:ring-[#A71D3A]/20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)} disabled={isUpdating}>
              {t('actions.cancel')}
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              style={{ background: 'linear-gradient(135deg, #A71D3A, #6B1428)', border: 'none' }}
              className="text-white"
            >
              {isUpdating ? t('admin.roles.saving') : t('actions.confirmSave')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
