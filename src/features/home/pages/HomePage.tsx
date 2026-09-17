'use client';

import { Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { NoData } from '@/components/common/NoData';
import { usePermission } from '@/hooks';
import { ExecutiveHomePage } from './ExecutiveHomePage';

export function HomePage() {
  const { t } = useTranslation();
  // Role-gated Home page variant: a role holding home_executive.view sees the management
  // dashboard instead of the plain placeholder below. SUPER_ADMIN gets it too, via
  // usePermission's own bypass — same rule every other permission in the app follows.
  const { canView: canViewExecutiveHome } = usePermission('home_executive');

  if (canViewExecutiveHome) return <ExecutiveHomePage />;

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
