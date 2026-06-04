import type { Metadata } from 'next';
import './globals.css';
import { ReduxProvider } from '@/providers/ReduxProvider';
import { Toaster } from '@/components/common/Toaster';

export const metadata: Metadata = {
  title: 'SBR Portal — NPC Qatar',
  description: 'Statistical Business Register — National Planning Council Qatar',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <ReduxProvider>
          {children}
          <Toaster />
        </ReduxProvider>
      </body>
    </html>
  );
}
