'use client';

import { Flag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { NoData } from '@/components/common/NoData';

export function QualityFindingsPage() {
  const { t } = useTranslation();

  return (
    <PageContainer>
      <PageHeader
        title={t('pages.qualityFindings.title')}
        description={t('pages.qualityFindings.description')}
        actions={
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Flag className="h-4 w-4" />
            <span className="font-medium text-slate-700">0</span> {t('table.records')}
          </div>
        }
      />
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <NoData message={t('pages.qualityFindings.noData')} description={t('pages.qualityFindings.noDataDesc')} />
      </div>
    </PageContainer>
  );
}
