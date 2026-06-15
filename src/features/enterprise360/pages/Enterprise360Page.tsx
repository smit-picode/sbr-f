'use client';

import { Orbit } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { NoData } from '@/components/common/NoData';

export function Enterprise360Page() {
  const { t } = useTranslation();

  return (
    <PageContainer>
      <PageHeader
        title={t('pages.enterprise360.title')}
        description={t('pages.enterprise360.description')}
        actions={
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Orbit className="h-4 w-4" />
            <span className="font-medium text-slate-700">0</span> {t('table.records')}
          </div>
        }
      />
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <NoData message={t('pages.enterprise360.noData')} description={t('pages.enterprise360.noDataDesc')} />
      </div>
    </PageContainer>
  );
}
