'use client';

import Image from 'next/image';
import { withBasePath } from '@/utils/basePath';
import { useTranslation } from 'react-i18next';

// Shell footer — the NPC secondary (vertical) lockup on one side, the copyright line on the other.
export function Footer() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-1 pb-3 pt-6 text-[12px] text-slate-400">
      <div className="shrink-0 p-4">
        <Image
          src={withBasePath('/assets/npc-logo-secondary.png')}
          alt={t('login.brandingSub', { defaultValue: 'National Planning Council' })}
          width={160}
          height={64}
          className="h-16 w-auto object-contain"
        />
      </div>
      <span>
        © {new Date().getFullYear()}. {t('login.rights', { defaultValue: 'All rights reserved' })}
      </span>
    </div>
  );
}
