'use client';

import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Small "awaiting approval" badge shown on list rows that have an open change request.
export function PendingBadge() {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
      <Clock className="h-3 w-3" /> {t('common.pending', { defaultValue: 'Pending' })}
    </span>
  );
}
