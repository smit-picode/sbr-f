'use client';

import { useTranslation } from 'react-i18next';
import { RESPONSE_STATUS_COLORS, RESPONSE_STATUS_KEY } from '../constants';
import type { ResponseStatus } from '../types';

export function ResponseStatusBadge({ status }: { status: ResponseStatus }) {
  const { t } = useTranslation();
  const c = RESPONSE_STATUS_COLORS[status] ?? RESPONSE_STATUS_COLORS.Pending;
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: c.bg, color: c.fg }}>
      {t(`surveySamples.${RESPONSE_STATUS_KEY[status]}`, { defaultValue: status })}
    </span>
  );
}
