import { TopNav } from './TopNav';
import { PageBanner } from './PageBanner';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#F5F5F5' }}>
      <TopNav />
      <PageBanner />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}
