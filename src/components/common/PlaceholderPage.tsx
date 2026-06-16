'use client';

import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';

interface PlaceholderPageProps {
  titleKey: string;
  descKey: string;
}

/**
 * Localized "coming soon" placeholder for not-yet-built admin pages.
 * Title/description come from i18n keys so the page follows the UI language.
 */
export function PlaceholderPage({ titleKey, descKey }: PlaceholderPageProps) {
  const { t } = useTranslation();
  return (
    <PageContainer>
      <PageHeader title={t(titleKey)} description={t(descKey)} />
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <p className="text-sm font-medium">{t('admin.tabs.nextPhase')}</p>
      </div>
    </PageContainer>
  );
}
