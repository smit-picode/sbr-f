'use client';

import { ChartColumn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { NoData } from '@/components/common/NoData';

export function AnalysisPage() {
  const { t } = useTranslation();

  return (
    <PageContainer>
      <PageHeader
        title={t('pages.analysis.title')}
        description={t('pages.analysis.description')}
        actions={
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <ChartColumn className="h-4 w-4" />
            <span className="font-medium text-slate-700">0</span> {t('table.records')}
          </div>
        }
      />
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <NoData message={t('pages.analysis.noData')} description={t('pages.analysis.noDataDesc')} />
      </div>
    </PageContainer>
  );
}
