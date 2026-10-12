import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { ReduxProvider } from '@/providers/ReduxProvider';
import { Toaster } from '@/components/common/Toaster';
import { LanguageProvider } from '@/i18n';

const cairo = localFont({
  src: './fonts/cairo-arabic-wght-normal.woff2',
  weight: '200 1000',
  display: 'swap',
  variable: '--font-cairo',
});

const jakarta = localFont({
  src: './fonts/plus-jakarta-sans-latin-wght-normal.woff2',
  weight: '200 800',
  display: 'swap',
  variable: '--font-jakarta',
});

export const metadata: Metadata = {
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
