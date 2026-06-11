'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Pencil, Plus, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import { useAppSelector } from '@/hooks';
import {
  useGetRolesListQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useGetPermissionsListQuery,
  useGetRolePermissionsQuery,
  useAssignRolePermissionsMutation,
} from '../api/adminApi';
import { ADMIN_FIELD_LABELS, ADMIN_DEFAULT_FILTERS } from '../constants';
import type { SbrRole, SbrPermission } from '@/types';
import { cleanParams } from '@/utils/query';
import { toast } from '@/utils/toast';
import { formatPermissionName } from '@/utils/format';
import { useTranslation } from 'react-i18next';
import { PERMISSION_TREE, CHILD_PERMISSION_KEYS, type PermissionNode } from '@/constants/permissionTree';

function getApiError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const msg = (err as { data?: { message?: string } }).data?.message;
    if (msg) return msg;
  }
  return fallback;
}

// Recursive tree node type — supports unlimited nesting depth
type TreeNode = { perm: SbrPermission | null; node: PermissionNode; children: TreeNode[] };

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

// Recursively collect all leaf-level SbrPermission objects under a node list
function flatLeafPerms(items: TreeNode[]): Array<SbrPermission | null> {
  const result: Array<SbrPermission | null> = [];
  for (const item of items) {
    if (item.children.length > 0) result.push(...flatLeafPerms(item.children));
    else result.push(item.perm);
  }
  return result;
}

// Sub-group block (e.g. "PERMISSIONS TAB" inside "Admin Panel") — needs its own useState for collapse
function PermSubGroup({
  treeNode, grantedIds, onToggle, onToggleAll, canEdit, childLabel, grantLabel, masterCollapsed,
}: {
  treeNode: TreeNode;
  grantedIds: Set<number>;
  onToggle: (id: number, granted: boolean) => void;
  onToggleAll: (perms: Array<SbrPermission | null>, granted: boolean) => void;
  canEdit: boolean;
  childLabel: (key: string, fallback: string) => string;
  grantLabel: string;
  masterCollapsed?: boolean;
}) {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  useEffect(() => { if (masterCollapsed !== undefined) setIsCollapsed(masterCollapsed); }, [masterCollapsed]);
  const { node: cn, children: grandchildren } = treeNode;
  const subLeafs      = flatLeafPerms(grandchildren);
  const subAllGranted = subLeafs.length > 0 && subLeafs.every(p => p && grantedIds.has(p.ID));
  const subSome       = subLeafs.some(p => p && grantedIds.has(p.ID));

  return (
    <div>
      {/* Sub-group header */}
      <div className="flex items-center gap-3 px-4 py-2 bg-slate-100/70 border-t border-slate-200">
        <button
          type="button"
          onClick={() => setIsCollapsed(v => !v)}
          className="flex items-center justify-center h-4 w-4 shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label={isCollapsed ? 'Expand sub-group' : 'Collapse sub-group'}
        >
          {isCollapsed
            ? <ChevronRight className="h-3.5 w-3.5" />
            : <ChevronDown className="h-3.5 w-3.5" />
          }
        </button>
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex-1">
          {childLabel(cn.key, cn.label)}
        </span>
        {canEdit && subLeafs.length > 0 && (
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              checked={subAllGranted}
              className={subSome && !subAllGranted ? 'opacity-60' : ''}
              onCheckedChange={(v) => onToggleAll(subLeafs, !!v)}
            />
            <span className="text-xs text-slate-500">{t('admin.roles.selectAll')}</span>
          </label>
        )}
      </div>
      {/* Sub-group permission rows */}
      {!isCollapsed && grandchildren.map(({ node: gn, perm: gp }) => {
        if (!gp) return null;
        const granted = grantedIds.has(gp.ID);
        return (
          <div key={gn.key} className="flex items-center gap-3 pl-8 pr-4 py-2 bg-white border-t border-slate-100 hover:bg-slate-50 transition-colors">
            <span className="text-slate-300 text-xs shrink-0">└</span>
            <span className="text-sm text-slate-600 flex-1">{childLabel(gn.key, gn.label)}</span>
            {canEdit ? (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox checked={granted} onCheckedChange={(v) => onToggle(gp.ID, !!v)} />
                <span className="text-xs text-slate-500">{grantLabel}</span>
              </label>
            ) : granted ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">✓ {grantLabel}</span>
            ) : (
              <span className="text-xs text-slate-300">—</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Renders one permission group with support for 3-level nesting:
// - Section header with Select All (toggles all leaf permissions)
// - Child items that are either:
//   a) Simple permission rows (no grandchildren)
//   b) Sub-group headers (with their own children + Select All)
function PermSection({
  node, items, grantedIds, onToggle, onToggleAll, canEdit, label, childLabel, grantLabel, masterCollapsed,
}: {
  node: PermissionNode;
  items: TreeNode[];
  grantedIds: Set<number>;
  onToggle: (id: number, granted: boolean) => void;
  onToggleAll: (perms: Array<SbrPermission | null>, granted: boolean) => void;
  canEdit: boolean;
  label: string;
  childLabel: (key: string, fallback: string) => string;
  grantLabel: string;
  masterCollapsed?: boolean;
}) {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  useEffect(() => { if (masterCollapsed !== undefined) setIsCollapsed(masterCollapsed); }, [masterCollapsed]);
  const allLeafs    = flatLeafPerms(items);
  const allGranted  = allLeafs.length > 0 && allLeafs.every(p => p && grantedIds.has(p.ID));
  const someGranted = allLeafs.some(p => p && grantedIds.has(p.ID));

  const GrantedBadge = () => (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
      ✓ {grantLabel}
    </span>
  );

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* Top-level section header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50">
        <button
          type="button"
          onClick={() => setIsCollapsed(v => !v)}
          className="flex items-center justify-center h-5 w-5 shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
        >
          {isCollapsed
            ? <ChevronRight className="h-4 w-4" />
            : <ChevronDown className="h-4 w-4" />
          }
        </button>
        <span className="text-sm font-semibold text-slate-800 flex-1">{label}</span>
        {canEdit && allLeafs.length > 0 && (
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              checked={allGranted}
              className={someGranted && !allGranted ? 'opacity-60' : ''}
              onCheckedChange={(v) => onToggleAll(allLeafs, !!v)}
            />
            <span className="text-xs font-medium text-slate-500">{t('admin.roles.selectAll')}</span>
          </label>
        )}
      </div>

      {/* Children — can be simple rows or sub-group blocks */}
      {!isCollapsed && items.map((childNode) => {
        const { node: cn, perm: cp, children: grandchildren } = childNode;
        if (grandchildren.length > 0) {
          return (
            <PermSubGroup
              key={cn.key}
              treeNode={childNode}
              grantedIds={grantedIds}
              onToggle={onToggle}
              onToggleAll={onToggleAll}
              canEdit={canEdit}
              childLabel={childLabel}
              grantLabel={grantLabel}
              masterCollapsed={masterCollapsed}
            />
          );
        }

        // Simple permission row (no sub-group)
        if (!cp) return null;
        const granted = grantedIds.has(cp.ID);
        return (
          <div key={cn.key} className="flex items-center gap-3 px-4 py-2.5 bg-white border-t border-slate-100 hover:bg-slate-50 transition-colors">
            <span className="text-slate-300 text-xs shrink-0">└</span>
            <span className="text-sm text-slate-600 flex-1">{childLabel(cn.key, cn.label)}</span>
            {canEdit ? (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox checked={granted} onCheckedChange={(v) => onToggle(cp.ID, !!v)} />
                <span className="text-xs text-slate-500">{grantLabel}</span>
              </label>
            ) : granted ? <GrantedBadge /> : <span className="text-xs text-slate-300">—</span>}
          </div>
        );
      })}
    </div>
  );
}

export function RolesTab({ canEdit = false, canViewDetail = false }: { canEdit?: boolean; canViewDetail?: boolean }) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({ ...ADMIN_DEFAULT_FILTERS });
  const [editTarget, setEditTarget] = useState<SbrRole | null>(null);
  const [viewTarget, setViewTarget] = useState<SbrRole | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({ ROLE_NAME: '' });
  const [grantedIds, setGrantedIds] = useState<Set<number>>(new Set());
  const [editAllCollapsed, setEditAllCollapsed] = useState(false);
  const [createAllCollapsed, setCreateAllCollapsed] = useState(false);
  const [viewAllCollapsed, setViewAllCollapsed] = useState(false);
  const user = useAppSelector((s) => s.auth.user);
  const permissions = useAppSelector((s) => s.auth.permissions);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role?.toUpperCase() === 'SUPER_ADMIN';
  // Load permissions list if user can edit roles (to assign) or view permissions tab
  const hasPermPermission = isSuperAdmin || permissions.some(p =>
    p.permissionName === 'admin_panel.roles.edit' ||
    p.permissionName === 'admin_panel.permissions.view'
  );

  const { data, isLoading } = useGetRolesListQuery(cleanParams(filters), { refetchOnMountOrArgChange: true });
  // Fetch permissions if: user has admin_panel.permissions OR when editing/viewing a role (to assign perms)
  const { data: permData } = useGetPermissionsListQuery(
    { page: 1, limit: 100 },
    { skip: !hasPermPermission && !editTarget && !viewTarget }
  );
  const { data: rolePermData } = useGetRolePermissionsQuery(editTarget?.ID ?? 0, { skip: !editTarget });
  const { data: viewRolePermData } = useGetRolePermissionsQuery(viewTarget?.ID ?? 0, { skip: !viewTarget });
  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const [assignPermissions, { isLoading: isAssigning }] = useAssignRolePermissionsMutation();

  const allPermissions = permData?.data ?? [];

  // Pre-populate granted IDs when edit dialog opens
  useEffect(() => {
    if (!editTarget) return;
    if (rolePermData?.data) {
      const existing = (rolePermData?.data as unknown as Array<{ PERMISSION_ID?: number }>) ?? [];
      setGrantedIds(new Set(existing.map((rp) => rp.PERMISSION_ID).filter((id): id is number => id !== undefined)));
    } else {
      setGrantedIds(new Set());
    }
  }, [editTarget, rolePermData]);

  // Reset master collapse state to "all expanded" whenever a dialog opens
  useEffect(() => { if (editTarget) setEditAllCollapsed(false); }, [editTarget]);
  useEffect(() => { if (isCreateOpen) setCreateAllCollapsed(false); }, [isCreateOpen]);
  useEffect(() => { if (viewTarget) setViewAllCollapsed(false); }, [viewTarget]);

  const handleCreate = async () => {
    if (!form.ROLE_NAME.trim()) {
      toast.error('Role name is required.');
      return;
    }
    try {
      await createRole({ ROLE_NAME: form.ROLE_NAME, permissions: Array.from(grantedIds) }).unwrap();
      toast.success('Role created successfully!');
      setForm({ ROLE_NAME: '' });
      setGrantedIds(new Set());
      setIsCreateOpen(false);
      setFilters({ ...ADMIN_DEFAULT_FILTERS });
    } catch (err) {
      toast.error(getApiError(err, 'Failed to create role. Please try again.'));
    }
  };

  const handleUpdate = async () => {
    if (!editTarget) return;
    if (!form.ROLE_NAME.trim()) {
      toast.error('Role name is required.');
      return;
    }
    if (form.ROLE_NAME === editTarget.ROLE_NAME) {
      toast.info('No changes detected.');
      return;
    }
    try {
      await updateRole({ id: editTarget.ID, data: { ROLE_NAME: form.ROLE_NAME } }).unwrap();
      toast.success('Role updated successfully!');
      setEditTarget(null);
      setForm({ ROLE_NAME: '' });
    } catch (err) {
      toast.error(getApiError(err, 'Failed to update role. Please try again.'));
    }
  };

  const handleAssignPermissions = async () => {
    if (!editTarget) return;
    // Capture values and close the dialog BEFORE the mutation fires.
    // Closing first releases the getRolePermissions(editTarget.ID) subscription so it
    // is already inactive when invalidateTags(['Admin']) runs — prevents the stale
    // refetch from being aborted mid-flight and triggering the error toast.
    const roleId = editTarget.ID;
    const permIds = Array.from(grantedIds);
    setEditTarget(null);
    try {
      await assignPermissions({ roleId, permissions: permIds }).unwrap();
      toast.success('Permissions saved successfully!');
    } catch (err) {
      toast.error(getApiError(err, 'Failed to save permissions. Please try again.'));
    }
  };

  const roles = data?.data ?? [];
  const permTree = buildTree(allPermissions);

  const handleToggle = (id: number, granted: boolean) => {
    setGrantedIds(prev => {
      const next = new Set(prev);
      if (granted) next.add(id); else next.delete(id);
      return next;
    });
  };

  const handleToggleAll = (childPerms: Array<SbrPermission | null>, granted: boolean) => {
    setGrantedIds(prev => {
      const next = new Set(prev);
      childPerms.forEach(p => { if (p) { if (granted) next.add(p.ID); else next.delete(p.ID); } });
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder={t('admin.roles.searchPlaceholder')}
          value={filters.search}
          onChange={(e) => setFilters(p => ({ ...p, search: e.target.value, page: 1 }))}
          className="max-w-xs"
        />
        {canEdit && (
          <Button onClick={() => { setForm({ ROLE_NAME: '' }); setGrantedIds(new Set()); setIsCreateOpen(true); }} style={{ background: 'linear-gradient(135deg, #A71D3A, #6B1428)', border: 'none' }} className="text-white hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" /> {t('admin.roles.addRole')}
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full">
          <thead className="bg-white border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-start text-xs font-medium text-slate-500 uppercase tracking-wide">{t('admin.roles.colName')}</th>
              <th className="px-6 py-3 text-start text-xs font-medium text-slate-500 uppercase tracking-wide">{t('admin.roles.colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={2} className="px-6 py-8 text-center text-slate-500">{t('admin.roles.loading')}</td></tr>
            ) : roles.length === 0 ? (
              <tr><td colSpan={2} className="px-6 py-8 text-center text-slate-500">{t('admin.roles.noRoles')}</td></tr>
            ) : (
              roles.map((role) => (
                <tr key={role.ID} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-700 text-start">{role.ROLE_NAME}</td>
                  <td className="px-6 py-4 flex gap-2 justify-start">
                    {canViewDetail && (
                      <Button
                        size="sm" variant="outline"
                        onClick={() => setViewTarget(role)}
                        title={t('admin.roles.viewPermissionsTitle')}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {canEdit && (
                      <Button
                        size="sm" variant="outline"
                        onClick={() => {
                          setForm({ ROLE_NAME: role.ROLE_NAME });
                          setEditTarget(role);
                        }}
                        disabled={isUpdating || role.ROLE_NAME === 'SUPER_ADMIN'}
                        title={role.ROLE_NAME === 'SUPER_ADMIN' ? t('admin.roles.superAdminCannotEdit') : t('admin.roles.editRoleTitle')}
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

      {/* View Dialog — same grouped layout as Edit, read-only */}
      <Dialog open={!!viewTarget} onOpenChange={(o) => { if (!o) setViewTarget(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                {viewTarget?.ROLE_NAME?.charAt(0)}
              </span>
              {viewTarget?.ROLE_NAME}
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-4">
            {/* Role badge */}
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">{t('admin.roles.roleLabel')}</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                {viewTarget?.ROLE_NAME}
              </span>
            </div>

            {/* Permissions — grouped by section, identical structure to Edit dialog */}
            {(() => {
              const rawList = ((viewRolePermData?.data as unknown) as Array<{ PERMISSION_ID?: number }>) ?? [];
              const viewGrantedIds = new Set(rawList.map(r => r.PERMISSION_ID).filter(Boolean) as number[]);
              const assignedCount = viewGrantedIds.size;

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('admin.roles.assignedPermissions')}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">{t('admin.roles.permissionsCount', { count: assignedCount })}</span>
                      {assignedCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setViewAllCollapsed(v => !v)}
                          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                        >
                          {viewAllCollapsed
                            ? <><ChevronDown className="h-3.5 w-3.5" /> {t('admin.roles.expandAll')}</>
                            : <><ChevronRight className="h-3.5 w-3.5" /> {t('admin.roles.collapseAll')}</>
                          }
                        </button>
                      )}
                    </div>
                  </div>

                  {assignedCount === 0 ? (
                    <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                      <p className="text-sm text-slate-400">{t('admin.roles.noPermissionsAssigned')}</p>
                    </div>
                  ) : (
                    permTree.map(({ node, children }) => (
                      <PermSection
                        key={node.key}
                        node={node}
                        items={children}
                        grantedIds={viewGrantedIds}
                        onToggle={() => {}}
                        onToggleAll={() => {}}
                        canEdit={false}
                        label={t(`admin.permLabels.${node.key.replace(/\./g, '_')}`, { defaultValue: node.label })}
                        childLabel={(key, fb) => t(`admin.permLabels.${key.replace(/\./g, '_')}`, { defaultValue: fb })}
                        grantLabel={t('admin.roles.grantLabel')}
                        masterCollapsed={viewAllCollapsed}
                      />
                    ))
                  )}
                </div>
              );
            })()}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewTarget(null)}>{t('admin.roles.close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t('admin.roles.addRoleDialogTitle')}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="role-name">{t('admin.roles.roleName')}</Label>
              <Input
                id="role-name"
                value={form.ROLE_NAME}
                onChange={(e) => setForm(p => ({ ...p, ROLE_NAME: e.target.value }))}
                placeholder={t('admin.roles.roleNamePlaceholder')}
              />
            </div>

            {permTree.length > 0 && (
              <div className="space-y-2 border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">{t('admin.roles.assignPermissions')}</Label>
                  <button
                    type="button"
                    onClick={() => setCreateAllCollapsed(v => !v)}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    {createAllCollapsed
                      ? <><ChevronDown className="h-3.5 w-3.5" /> {t('admin.roles.expandAll')}</>
                      : <><ChevronRight className="h-3.5 w-3.5" /> {t('admin.roles.collapseAll')}</>
                    }
                  </button>
                </div>
                {permTree.map(({ node, children }) => (
                  <PermSection
                    key={node.key}
                    node={node}
                    items={children}
                    grantedIds={grantedIds}
                    onToggle={handleToggle}
                    onToggleAll={handleToggleAll}
                    canEdit={true}
                    label={t(`admin.permLabels.${node.key.replace(/\./g, '_')}`, { defaultValue: node.label })}
                    childLabel={(key, fb) => t(`admin.permLabels.${key.replace(/\./g, '_')}`, { defaultValue: fb })}
                    grantLabel={t('admin.roles.grantLabel')}
                    masterCollapsed={createAllCollapsed}
                  />
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>{t('actions.cancel')}</Button>
            <Button onClick={handleCreate} disabled={isCreating} style={{ background: 'linear-gradient(135deg, #A71D3A, #6B1428)', border: 'none' }} className="text-white">{isCreating ? t('admin.roles.creating') : t('actions.confirmSave')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t('admin.roles.editRoleDialogTitle', { name: editTarget?.ROLE_NAME })}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="edit-role-name">{t('admin.roles.roleName')}</Label>
              <Input
                id="edit-role-name"
                value={form.ROLE_NAME}
                onChange={(e) => setForm(p => ({ ...p, ROLE_NAME: e.target.value }))}
                disabled={editTarget?.ROLE_NAME === 'SUPER_ADMIN'}
              />
            </div>

            {permTree.length > 0 && (
              <div className="space-y-2 border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">{t('admin.roles.permissionsSection')}</Label>
                  <button
                    type="button"
                    onClick={() => setEditAllCollapsed(v => !v)}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    {editAllCollapsed
                      ? <><ChevronDown className="h-3.5 w-3.5" /> {t('admin.roles.expandAll')}</>
                      : <><ChevronRight className="h-3.5 w-3.5" /> {t('admin.roles.collapseAll')}</>
                    }
                  </button>
                </div>
                {permTree.map(({ node, children }) => (
                  <PermSection
                    key={node.key}
                    node={node}
                    items={children}
                    grantedIds={grantedIds}
                    onToggle={handleToggle}
                    onToggleAll={handleToggleAll}
                    canEdit={true}
                    label={t(`admin.permLabels.${node.key.replace(/\./g, '_')}`, { defaultValue: node.label })}
                    childLabel={(key, fb) => t(`admin.permLabels.${key.replace(/\./g, '_')}`, { defaultValue: fb })}
                    grantLabel={t('admin.roles.grantLabel')}
                    masterCollapsed={editAllCollapsed}
                  />
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)} disabled={isUpdating || isAssigning}>{t('actions.cancel')}</Button>
            <Button onClick={handleAssignPermissions} disabled={isAssigning} style={{ background: 'linear-gradient(135deg, #A71D3A, #6B1428)', border: 'none' }} className="text-white">
              {isAssigning ? t('admin.roles.saving') : t('admin.roles.savePermissions')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
