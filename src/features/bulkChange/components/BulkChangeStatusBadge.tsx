'use client';

import { useTranslation } from 'react-i18next';
import { BULK_CHANGE_STATUS_CLASSES, BULK_CHANGE_STATUS_DEFAULTS } from '../constants';
import type { BulkChangeStatus } from '../types';

// A bulk batch's status is DERIVED from its member change requests, and the underlying
// procedures are best-effort — so a batch can legitimately be part-approved. This renders all
// six states, not just the three a single change request has.
export function BulkChangeStatusBadge({ status }: { status: BulkChangeStatus }) {
  const { t } = useTranslation();
  const cls = BULK_CHANGE_STATUS_CLASSES[status] ?? BULK_CHANGE_STATUS_CLASSES.FAILED;

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${cls}`}>
      {t(`bulkChange.status.${status}`, { defaultValue: BULK_CHANGE_STATUS_DEFAULTS[status] ?? status })}
    </span>
  );
}
