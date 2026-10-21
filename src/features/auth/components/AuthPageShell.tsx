'use client';

import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/i18n';
import { AuthBrandPanel } from './AuthBrandPanel';

// The signed-out layout: skyline panel, language switch, and a narrow column for the form.
export function AuthPageShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { isArabic, toggleLanguage } = useLanguage();
  return (
    <div className="min-h-screen flex bg-white p-4 gap-4">
      <AuthBrandPanel />
      <div className="w-full md:w-[54%] flex items-center justify-center p-6 md:p-12 lg:p-16 bg-white relative">
        <button
          type="button"
          onClick={toggleLanguage}
          className="absolute top-4 end-4 md:top-6 md:end-8 inline-flex items-center h-9 px-4 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-input"
        >
          {isArabic ? 'English' : 'عربي'}
        </button>
        <div className="w-full max-w-sm">
          {children}
          <p className="text-center text-xs text-slate-400 mt-8">
            © {new Date().getFullYear()} {t('login.copyright')}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AuthSubmitButton({ loading, children }: { loading: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading}
      className={`btn-sign-in group relative w-full h-12 mt-2 rounded-full font-bold text-white tracking-wide overflow-hidden transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:hover:translate-y-0 ${loading ? 'pointer-events-none opacity-80' : ''}`}
      style={{
        background: 'linear-gradient(135deg, #C0AC86 0%, #A29374 55%, #776848 100%)',
        boxShadow: '0 10px 24px -6px rgba(119,104,72,0.45)',
      }}
    >
      <span className="btn-sign-in-shine pointer-events-none absolute inset-0" />
      <span className="relative inline-flex items-center justify-center gap-2">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </span>
    </button>
  );
}
