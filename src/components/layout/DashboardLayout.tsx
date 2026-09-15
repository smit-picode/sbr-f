import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#FFFFFF' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* pt-4 (not p-5/p-6's top) so the content's top edge lines up exactly with the
            Sidebar's own `my-4` top margin — otherwise the banner starts a few px lower
            than the sidebar. */}
        <main className="flex-1 overflow-y-auto pt-4 px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="max-w-[1640px] mx-auto flex flex-col gap-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
