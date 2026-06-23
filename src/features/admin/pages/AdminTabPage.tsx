'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Users, Key, ArrowLeft, Plus } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { PermissionsTab } from '../components/PermissionsTab';
import { RolesTab } from '../components/RolesTab';
import { UsersTab } from '../components/UsersTab';
import { useGetMyPermissionsQuery } from '@/features/auth/api/authApi';
import { setPermissions, logout } from '@/features/auth/authSlice';

export type AdminTab = 'permissions' | 'roles' | 'users';

// permKey = the .view permission required to see the tab
const TAB_DEFS: { id: AdminTab; href: string; labelKey: string; descKey: string; icon: React.ElementType; permKey: string }[] = [
  { id: 'users',       href: '/admin/users',       labelKey: 'admin.tabs.users',       descKey: 'admin.tabs.usersDesc',       icon: Users,  permKey: 'admin_panel.users.view'       },
  { id: 'roles',       href: '/admin/roles',       labelKey: 'admin.tabs.roles',       descKey: 'admin.tabs.rolesDesc',       icon: Shield, permKey: 'admin_panel.roles.view'       },
  { id: 'permissions', href: '/admin/permissions', labelKey: 'admin.tabs.permissions', descKey: 'admin.tabs.permissionsDesc', icon: Key,    permKey: 'admin_panel.permissions.view' },
];

export function AdminTabPage({ tab }: { tab: AdminTab }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const permissions = useAppSelector((s) => s.auth.permissions);

  // Force a fresh permissions check every time an admin tab is opened.
  // Track the first full fetch cycle using a ref so we only act on real network data,
  // not the cached snapshot that RTK Query returns on the first render.
  const { data: freshPerms, isFetching: permsFetching } = useGetMyPermissionsQuery(
    undefined,
    { refetchOnMountOrArgChange: true }
  );
  const seenFetching = useRef(false);
  const usersOpenCreate = useRef<(() => void) | null>(null);
  const rolesOpenCreate = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (permsFetching) { seenFetching.current = true; return; }
    // Only act after we've seen at least one real network round-trip (not just cached read)
    if (!seenFetching.current || !freshPerms?.data) return;
    dispatch(setPermissions(freshPerms.data));
  }, [permsFetching, freshPerms, dispatch]);

  const isSuperAdmin = !!(user?.role && (
    user.role === 'SUPER_ADMIN' || user.role?.toUpperCase() === 'SUPER_ADMIN'
  ));

  const hasPermission = (key: string) => isSuperAdmin || permissions.some(p => p.permissionName === key);
  // Access requires admin_panel.view (general access) OR at least one tab permission
  const hasAdminAccess = isSuperAdmin || hasPermission('admin_panel.view') || TAB_DEFS.some(tab => hasPermission(tab.permKey));
  const canViewTab = (key: string) => hasPermission(key);

  const visibleTabs = TAB_DEFS.filter(t => canViewTab(t.permKey));
  const currentDef = TAB_DEFS.find(d => d.id === tab)!;
  const canSeeCurrent = visibleTabs.some(t => t.id === tab);

  // If this tab is not permitted but another one is, fall back to the first visible tab
  // (mirrors the old AdminPage behaviour where effectiveTab fell back to visibleTabs[0])
  useEffect(() => {
    if (!hasAdminAccess) return;
    if (visibleTabs.length > 0 && !canSeeCurrent) {
      router.replace(visibleTabs[0].href);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAdminAccess, canSeeCurrent, visibleTabs.length, router]);

  // After the live permissions check completes, redirect to login if access was revoked.
  useEffect(() => {
    if (permsFetching || !seenFetching.current || isSuperAdmin) return;
    if (!hasAdminAccess) {
      dispatch(logout());
      router.replace('/login');
    }
  }, [permsFetching, hasAdminAccess, isSuperAdmin, dispatch, router]);

  if (!hasAdminAccess) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 max-w-md w-full text-center">
          <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">{t('admin.panel.accessDenied')}</h2>
          <p className="text-sm text-slate-500">{t('admin.panel.accessDeniedDesc')}</p>
          <button
            onClick={() => router.push('/legal-units')}
            className="mt-6 flex items-center gap-2 mx-auto px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ background: 'linear-gradient(135deg, #A71D3A, #6B1428)' }}
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t('admin.panel.backToMain')}
          </button>
        </div>
      </div>
    );
  }

  const canEditUsers = isSuperAdmin || hasPermission('admin_panel.users.edit');
  const canEditRoles = isSuperAdmin || hasPermission('admin_panel.roles.edit');
  const canCreateRoles = isSuperAdmin || hasPermission('admin_panel.roles.create');

  return (
    <PageContainer>
      <PageHeader
        title={t(currentDef.labelKey)}
        description={t(currentDef.descKey)}
        actions={
          tab === 'users' && canEditUsers ? (
            <Button
              onClick={() => usersOpenCreate.current?.()}
              style={{ background: 'linear-gradient(135deg, #A71D3A, #6B1428)', border: 'none' }}
              className="text-white hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-2" /> {t('admin.users.addUser')}
            </Button>
          ) : tab === 'roles' && canCreateRoles ? (
            <Button
              onClick={() => rolesOpenCreate.current?.()}
              style={{ background: 'linear-gradient(135deg, #A71D3A, #6B1428)', border: 'none' }}
              className="text-white hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-2" /> {t('admin.roles.addRole')}
            </Button>
          ) : undefined
        }
      />

      {visibleTabs.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <p className="text-sm text-slate-500">{t('admin.panel.noTabsAvailable')}</p>
        </div>
      ) : canSeeCurrent ? (
        <>
          {/* Users tab manages its own two-card layout */}
          {tab === 'users' && (
            <UsersTab
              canEdit={canEditUsers}
              canViewDetail={isSuperAdmin || hasPermission('admin_panel.users.view_detail')}
              canSearch={isSuperAdmin || hasPermission('admin_panel.users.search')}
              onRegisterCreate={(fn) => { usersOpenCreate.current = fn; }}
            />
          )}
          {/* Roles — own layout like Users, no card wrapper */}
          {tab === 'roles' && (
            <RolesTab
              canEdit={canEditRoles}
              canCreate={canCreateRoles}
              onRegisterCreate={(fn) => { rolesOpenCreate.current = fn; }}
            />
          )}
          {/* Permissions stays inside a single card */}
          {tab === 'permissions' && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="p-6">
                <PermissionsTab />
              </div>
            </div>
          )}
        </>
      ) : null}
    </PageContainer>
  );
}
