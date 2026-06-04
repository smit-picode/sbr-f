'use client';

import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  '/frame':      'Statistical Business Register',
  '/contacts':   'Contacts Management',
  '/addresses':  'Addresses Management',
  '/audit-log':  'Audit Log',
};

export function PageBanner() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? 'SBR Portal';

  return (
    <div
      className="h-14 flex items-center px-8 shrink-0"
      style={{ background: 'linear-gradient(to right, #A71D3A 0%, #6B1428 40%, #1a3a52 100%)' }}
    >
      <h1 className="text-white text-lg font-semibold tracking-wide">{title}</h1>
    </div>
  );
}
