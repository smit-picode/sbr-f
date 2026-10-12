import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#FFFFFF' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto pt-4 px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="max-w-[1640px] mx-auto flex min-h-full flex-col gap-4">
            <div className="flex flex-1 flex-col gap-4">{children}</div>
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}
