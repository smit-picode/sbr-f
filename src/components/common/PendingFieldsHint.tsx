'use client';

import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Shown at the top of an edit dialog when some fields already have a change waiting for approval.
export function PendingFieldsHint({ pendingFields }: { pendingFields?: Record<string, number> }) {
  const { t } = useTranslation();
  if (!pendingFields || !Object.values(pendingFields).some((count) => count > 0)) return null;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
      <Clock className="h-3.5 w-3.5 shrink-0" />
      {t('common.pendingFieldsHint', { defaultValue: "Greyed fields already have a change waiting for approval and can't be edited until it is decided." })}
    </div>
  );
}
