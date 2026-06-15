'use client';

import { Landmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { NoData } from '@/components/common/NoData';

export function RegulatorEscalationPage() {
  const { t } = useTranslation();

  return (
    <PageContainer>
      <PageHeader
        title={t('pages.regulatorEscalation.title')}
        description={t('pages.regulatorEscalation.description')}
        actions={
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Landmark className="h-4 w-4" />
            <span className="font-medium text-slate-700">0</span> {t('table.records')}
          </div>
        }
      />
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <NoData message={t('pages.regulatorEscalation.noData')} description={t('pages.regulatorEscalation.noDataDesc')} />
      </div>
    </PageContainer>
  );
}
