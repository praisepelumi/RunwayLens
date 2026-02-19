import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { useUIStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export function AppShell() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div
        className={cn(
          'flex flex-1 flex-col transition-all duration-300',
          // Mobile: no left margin (sidebar is an overlay)
          // Desktop: margin shifts based on sidebar width
          'ml-0 md:ml-16',
          sidebarOpen && 'md:ml-64'
        )}
      >
        <Header />
        {/* pt-16 on mobile to account for the fixed hamburger button */}
        <main className="flex-1 overflow-y-auto p-4 pt-16 md:p-6 md:pt-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
