import type { Metadata } from 'next';
import { Cairo, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ReduxProvider } from '@/providers/ReduxProvider';
import { Toaster } from '@/components/common/Toaster';
import { LanguageProvider } from '@/i18n';

// The reference vendors Cairo for Arabic (theme.js's `fontArabic` stack) — Noto Sans Arabic is a
// visually different typeface, so Arabic text wasn't actually matching the client font even
// though the CSS variable was (confusingly) still named --font-cairo.
const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-cairo',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-jakarta',
});

export const metadata: Metadata = {
  // Every page previously set its own `title: '{Page} — SBR Portal'` override, which beat this
  // root default per Next.js's metadata inheritance — so the browser tab showed a different
  // title on every route. All of those per-page overrides were removed so this one title now
  // applies everywhere, consistently, as requested.
  title: 'SBR Portal — Statistical Business Register',
  description: 'Statistical Business Register — National Planning Council Qatar',
  icons: {
    icon: '/sbr-logo.png',
    shortcut: '/sbr-logo.png',
    apple: '/sbr-logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${cairo.variable} ${jakarta.variable}`}>
      <body suppressHydrationWarning>
        <ReduxProvider>
          <LanguageProvider>
            {children}
            <Toaster />
          </LanguageProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
