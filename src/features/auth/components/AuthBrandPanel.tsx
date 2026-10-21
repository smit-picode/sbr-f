'use client';

import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { withBasePath } from '@/utils/basePath';

// The skyline panel beside every signed-out screen (sign in, forgot and reset password).
export function AuthBrandPanel() {
  const { t } = useTranslation();
  return (
    <div className="hidden md:flex md:w-[46%] relative overflow-hidden rounded-3xl text-white">
      <div
        className="absolute inset-0"
        style={{ background: `#0E1A2B url('${withBasePath('/assets/login-skyline.jpg')}') center / cover no-repeat` }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(10,20,40,.15) 0%, rgba(10,20,40,.35) 60%, rgba(10,20,40,.85) 100%)' }}
      />

      <div className="relative flex flex-col justify-between w-full p-9">
        <div className="flex flex-col items-start gap-3">
          <Image src={withBasePath('/assets/npc-logo-primary-white.png')} alt="National Planning Council" width={257} height={90} className="h-16 w-auto object-contain -ms-2" priority />
          <span className="text-[15px] font-bold ps-0.5">SBR Portal</span>
        </div>

        <div>
          <h2 className="text-[40px] font-extrabold leading-[1.1] max-w-md">{t('login.branding')}</h2>
          <p className="text-[15px] text-white/85 mt-4 max-w-md leading-relaxed">{t('login.brandingSub')} · {t('login.brandingCountry')}</p>
          <p className="text-[12px] text-white/60 mt-6">© {new Date().getFullYear()} {t('login.copyright')}</p>
        </div>
      </div>
    </div>
  );
}
