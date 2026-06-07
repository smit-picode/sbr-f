'use client';

import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';

const BANNER_KEY_MAP: Record<string, string> = {
  '/frame':      'pageBanner.frame',
  '/contacts':   'pageBanner.contacts',
  '/addresses':  'pageBanner.addresses',
  '/audit-log':  'pageBanner.auditLog',
};

export function PageBanner() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const key = BANNER_KEY_MAP[pathname] ?? 'pageBanner.frame';

  return (
    <div
      className="h-14 flex items-center px-8 shrink-0"
      style={{ background: 'linear-gradient(to right, #A71D3A 0%, #6B1428 40%, #1a3a52 100%)' }}
    >
      <h1 className="text-white text-lg font-semibold tracking-wide">{t(key)}</h1>
    </div>
  );
}
