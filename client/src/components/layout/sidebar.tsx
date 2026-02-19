import { NavLink, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  Receipt,
  Upload,
  GitBranch,
  Settings,
  Moon,
  Sun,
  ChevronLeft,
  Telescope,
  LogOut,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/entries', icon: Receipt, label: 'Entries' },
  { to: '/import', icon: Upload, label: 'Import CSV' },
  { to: '/scenarios', icon: GitBranch, label: 'Scenarios' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

function useIsMobile() {
  return typeof window !== 'undefined' && window.innerWidth < 768;
}

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, toggleSidebar, theme, toggleTheme } = useUIStore();
  const { user, logout } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Close sidebar on route change (mobile only)
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile, setSidebarOpen]);

  return (
    <>
      {/* Mobile hamburger button — always visible on mobile */}
      <button
        onClick={toggleSidebar}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-background text-sidebar-foreground shadow-lg md:hidden"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Backdrop overlay — mobile only when sidebar is open */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-sidebar-border bg-sidebar-background transition-all duration-300',
          // Mobile: slide in/out as full overlay
          'md:z-40',
          isMobile
            ? sidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full'
            : sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary/20">
            <Telescope className="h-4 w-4 text-sidebar-primary" />
          </div>
          {(sidebarOpen || isMobile) && (
            <div className="overflow-hidden">
              <h1 className="font-display text-lg tracking-tight text-white">
                RunwayLens
              </h1>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className={cn(
              'ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground',
              !sidebarOpen && !isMobile && 'ml-0'
            )}
          >
            <ChevronLeft
              className={cn(
                'h-4 w-4 transition-transform duration-300',
                !sidebarOpen && !isMobile && 'rotate-180'
              )}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                )
              }
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              {(sidebarOpen || isMobile) && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="space-y-1 border-t border-sidebar-border p-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          >
            {theme === 'light' ? (
              <Moon className="h-4.5 w-4.5 shrink-0" />
            ) : (
              <Sun className="h-4.5 w-4.5 shrink-0" />
            )}
            {(sidebarOpen || isMobile) && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
          </button>

          {/* Logout button — always visible (collapsed sidebar shows icon only) */}
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/60 transition-colors hover:bg-red-500/10 hover:text-red-400"
            title="Sign out"
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            {(sidebarOpen || isMobile) && <span>Sign Out</span>}
          </button>

          {/* User info */}
          {user && (
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt=""
                  className="h-7 w-7 shrink-0 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium text-sidebar-foreground">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              {(sidebarOpen || isMobile) && (
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-sidebar-foreground">{user.name}</p>
                  <p className="truncate text-[10px] text-sidebar-foreground/50">{user.email}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
