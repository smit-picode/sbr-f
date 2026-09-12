import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#FFFFFF' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="max-w-[1640px] mx-auto flex flex-col gap-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
