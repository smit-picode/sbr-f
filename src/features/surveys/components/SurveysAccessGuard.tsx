'use client';

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/common/PageContainer';
import { NoData } from '@/components/common/NoData';
import { usePermission } from '@/hooks';

// Children never mount without surveys.view, so no survey query fires and no 403 toast appears.
export function SurveysAccessGuard({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { canView } = usePermission('surveys');

  if (canView) return <>{children}</>;

  return (
    <PageContainer>
      <div className="rounded-lg bg-white shadow-card overflow-hidden">
        <NoData message={t('surveys.noViewPermission', { defaultValue: 'You do not have permission to view surveys.' })} />
      </div>
    </PageContainer>
  );
}
