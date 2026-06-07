import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import { ReduxProvider } from '@/providers/ReduxProvider';
import { Toaster } from '@/components/common/Toaster';
import { LanguageProvider } from '@/i18n';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-cairo',
});

export const metadata: Metadata = {
  title: 'SBR Portal — NPC Qatar',
  description: 'Statistical Business Register — National Planning Council Qatar',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={cairo.variable}>
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
