import type { Metadata } from 'next';
import { Tajawal, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ReduxProvider } from '@/providers/ReduxProvider';
import { Toaster } from '@/components/common/Toaster';
import { LanguageProvider } from '@/i18n';

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '700', '800'],
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
  title: 'SBR Portal — NPC Qatar',
  description: 'Statistical Business Register — National Planning Council Qatar',
  icons: {
    icon: '/sbr-logo.png',
    shortcut: '/sbr-logo.png',
    apple: '/sbr-logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${tajawal.variable} ${jakarta.variable}`}>
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
