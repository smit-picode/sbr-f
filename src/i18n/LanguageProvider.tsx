'use client';

import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from './config';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Restore persisted language preference
    const saved = localStorage.getItem('sbr_language');
    if (saved === 'ar' || saved === 'en') {
      i18n.changeLanguage(saved);
    }

    // Apply RTL/LTR direction whenever language changes
    const applyDir = (lng: string) => {
      document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lng;
      localStorage.setItem('sbr_language', lng);
    };

    applyDir(i18n.language);
    i18n.on('languageChanged', applyDir);

    return () => {
      i18n.off('languageChanged', applyDir);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
