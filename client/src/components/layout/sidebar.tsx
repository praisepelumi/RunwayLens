import { NavLink } from 'react-router-dom';
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

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, theme, toggleTheme } = useUIStore();
  const { user, logout } = useAuth();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar-background transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary/20">
          <Telescope className="h-4 w-4 text-sidebar-primary" />
        </div>
        {sidebarOpen && (
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
            !sidebarOpen && 'ml-0'
          )}
        >
          <ChevronLeft
            className={cn(
              'h-4 w-4 transition-transform duration-300',
              !sidebarOpen && 'rotate-180'
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
            {sidebarOpen && <span>{label}</span>}
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
          {sidebarOpen && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
        </button>

        {/* User info + logout */}
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
            {sidebarOpen && (
              <div className="flex min-w-0 flex-1 items-center justify-between">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-sidebar-foreground">{user.name}</p>
                  <p className="truncate text-[10px] text-sidebar-foreground/50">{user.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
