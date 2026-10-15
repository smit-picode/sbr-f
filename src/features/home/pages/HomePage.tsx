'use client';

import { useEffect } from 'react';
import { Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { NoData } from '@/components/common/NoData';
import { RouteSkeleton } from '@/components/common/RouteSkeleton';
import { useRouter } from '@/hooks/useAppRouter';
import { useAppSelector, usePersistedState } from '@/hooks';
import { useGetMyPermissionsQuery } from '@/features/auth/api/authApi';
import { getFirstAccessibleHref, hasAnyNavPermission, hasNavPermission } from '@/utils/navAccess';
import type { UserPermission, HomeScreen } from '@/types';
import { ExecutiveHomePage } from './ExecutiveHomePage';
import { ReviewerHomePage } from './ReviewerHomePage';
import { StewardHomePage } from './StewardHomePage';
import { HomeScreenSwitcher } from '../components/HomeScreenSwitcher';
import { HOME_DASHBOARD_PERMISSIONS, HOME_SCREENS } from '../constants';

const toName = (p: UserPermission | string): string => (typeof p === 'string' ? p : p.permissionName);

export function HomePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);
  const storedPermissions = useAppSelector((s) => s.auth.permissions);
  const { data: freshPermissions, isLoading: permissionsLoading } = useGetMyPermissionsQuery();
  const [chosenScreen, setChosenScreen] = usePersistedState<HomeScreen | null>('sbr:home:screen', null);

  const isSuperAdmin = user?.role?.toUpperCase() === 'SUPER_ADMIN';
  const permissionNames = freshPermissions?.data
    ? freshPermissions.data.map(toName)
    : storedPermissions.map((p) => p.permissionName);
  const access = { isSuperAdmin, permissionNames };

  const awaitingPermissions = !isSuperAdmin && permissionsLoading && storedPermissions.length === 0;
  const hasAnyDashboard = hasAnyNavPermission(HOME_DASHBOARD_PERMISSIONS, access);
  const redirectHref = !awaitingPermissions && !hasAnyDashboard ? getFirstAccessibleHref(access, '/home') : null;

  useEffect(() => {
    if (redirectHref) router.replace(redirectHref);
  }, [redirectHref, router]);

  if (awaitingPermissions || redirectHref) return <RouteSkeleton />;

  const screens = HOME_SCREENS.filter((s) => isSuperAdmin || hasNavPermission(s.permission, access));
  const screen = screens.find((s) => s.key === chosenScreen)?.key ?? screens[0]?.key;
  const switcher = screen && screens.length > 1
    ? <HomeScreenSwitcher value={screen} options={screens} onChange={setChosenScreen} />
    : undefined;

  if (screen === 'executive') return <ExecutiveHomePage switcher={switcher} />;
  if (screen === 'reviewer') return <ReviewerHomePage switcher={switcher} />;
  if (screen === 'steward') return <StewardHomePage switcher={switcher} />;

  return (
    <PageContainer>
      <PageHeader
        title={t('pages.home.title')}
        description={t('pages.home.description')}
        actions={
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Home className="h-4 w-4" />
            <span className="font-medium text-slate-700">0</span> {t('table.records')}
          </div>
        }
      />
      <div className="rounded-lg bg-white shadow-card overflow-hidden">
        <NoData message={t('pages.home.noData')} description={t('pages.home.noDataDesc')} />
      </div>
    </PageContainer>
  );
}
