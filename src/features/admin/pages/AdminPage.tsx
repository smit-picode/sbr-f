'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Users, Key, ArrowLeft, Settings } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { useTranslation } from 'react-i18next';
import { PermissionsTab } from '../components/PermissionsTab';
import { RolesTab } from '../components/RolesTab';
import { UsersTab } from '../components/UsersTab';
import { useGetMyPermissionsQuery } from '@/features/auth/api/authApi';
import { setPermissions, logout } from '@/features/auth/authSlice';
import { baseApi } from '@/services/api';

type Tab = 'permissions' | 'roles' | 'users';

// permKey = the .view permission required to see the tab
const TAB_DEFS: { id: Tab; labelKey: string; descKey: string; icon: React.ElementType; permKey: string }[] = [
  { id: 'users',       labelKey: 'admin.tabs.users',       descKey: 'admin.tabs.usersDesc',       icon: Users,  permKey: 'admin_panel.users.view'        },
  { id: 'roles',       labelKey: 'admin.tabs.roles',       descKey: 'admin.tabs.rolesDesc',       icon: Shield, permKey: 'admin_panel.roles.view'       },
  { id: 'permissions', labelKey: 'admin.tabs.permissions', descKey: 'admin.tabs.permissionsDesc', icon: Key,    permKey: 'admin_panel.permissions.view' },
];

export function AdminPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const permissions = useAppSelector((s) => s.auth.permissions);


  // Force a fresh permissions check every time the admin panel is opened.
  // Track the first full fetch cycle using a ref so we only act on real network data,
  // not the cached snapshot that RTK Query returns on the first render.
  const { data: freshPerms, isFetching: permsFetching } = useGetMyPermissionsQuery(
    undefined,
    { refetchOnMountOrArgChange: true }
  );
  const seenFetching = useRef(false);

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
  const canEditTab = (key: string) => hasPermission(key);

  const visibleTabs = TAB_DEFS.filter(t => canViewTab(t.permKey));

  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const effectiveTab = activeTab && visibleTabs.some(t => t.id === activeTab)
    ? activeTab
    : (visibleTabs[0]?.id ?? null);

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 max-w-md w-full text-center">
          <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">{t('admin.panel.accessDenied')}</h2>
          <p className="text-sm text-slate-500">{t('admin.panel.accessDeniedDesc')}</p>
          <button
            onClick={() => router.push('/frame')}
            className="mt-6 flex items-center gap-2 mx-auto px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ background: 'linear-gradient(135deg, #A71D3A, #6B1428)' }}
          >
            <ArrowLeft className="h-4 w-4" /> {t('admin.panel.backToMain')}
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-50">
      {/* Admin Header Banner — negative margins escape the layout's p-6 so the stripe sits flush */}
      <div
        className="-mx-6 -mt-6 h-14 px-8 flex items-center justify-between shrink-0"
        style={{ background: 'linear-gradient(to right, #A71D3A 0%, #6B1428 40%, #1a3a52 100%)' }}
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-white/15 flex items-center justify-center">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-white text-lg font-semibold tracking-wide">{t('admin.panel.title')}</h1>
            <p className="text-white/60 text-xs">{t('admin.panel.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Tab Cards Row */}
      <div className="px-8 py-5 flex gap-3">
        {visibleTabs.length === 0 ? (
          <p className="text-sm text-slate-500">{t('admin.panel.noTabsAvailable')}</p>
        ) : (
          visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = effectiveTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-5 py-3 rounded-xl border transition-all text-left ${
                  isActive
                    ? 'bg-white border-[#A71D3A] shadow-sm'
                    : 'bg-white/60 border-slate-200/60 hover:bg-white hover:shadow-sm'
                }`}
              >
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                  style={isActive
                    ? { background: 'linear-gradient(135deg, #A71D3A, #6B1428)' }
                    : { background: '#f1f5f9' }
                  }
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                    {t(tab.labelKey)}
                  </p>
                  <p className="text-xs text-slate-400 hidden sm:block">{t(tab.descKey)}</p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Content Area */}
      {effectiveTab && (
        <div className="px-8 pb-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6">
              {effectiveTab === 'permissions' && <PermissionsTab />}
              {effectiveTab === 'roles'  && (
                <RolesTab
                  canEdit={isSuperAdmin || hasPermission('admin_panel.roles.edit')}
                  canViewDetail={isSuperAdmin || hasPermission('admin_panel.roles.view_detail')}
                />
              )}
              {effectiveTab === 'users'  && (
                <UsersTab
                  canEdit={isSuperAdmin || hasPermission('admin_panel.users.edit')}
                  canViewDetail={isSuperAdmin || hasPermission('admin_panel.users.view_detail')}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
