import { create } from 'zustand';

function isMobile() {
  return typeof window !== 'undefined' && window.innerWidth < 768;
}

interface UIState {
  sidebarOpen: boolean;
  activeScenarioIds: string[];
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveScenarioIds: (ids: string[]) => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Sidebar starts closed on mobile, open on desktop
  sidebarOpen: !isMobile(),
  activeScenarioIds: [],
  theme: (typeof window !== 'undefined' && localStorage.getItem('theme') as 'light' | 'dark') || 'light',

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveScenarioIds: (ids) => set({ activeScenarioIds: ids }),
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      return { theme: next };
    }),
}));
