'use client';

import { useTranslation } from 'react-i18next';
import i18n from './config';

export function useLanguage() {
  useTranslation(); // subscribes component to language changes
  const isArabic = i18n.language === 'ar';

  return {
    language: i18n.language as 'en' | 'ar',
    isArabic,
    dir: isArabic ? ('rtl' as const) : ('ltr' as const),
    toggleLanguage: () => i18n.changeLanguage(isArabic ? 'en' : 'ar'),
  };
}
