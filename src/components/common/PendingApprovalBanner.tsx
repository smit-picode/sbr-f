'use client';

import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Shown on a detail page when the record has an open change request awaiting approval.
export function PendingApprovalBanner() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
      <Clock className="h-4 w-4 shrink-0" />
      {t('common.pendingApprovalBanner', { defaultValue: 'This record has an edit request awaiting approval. You can still edit it.' })}
    </div>
  );
}
