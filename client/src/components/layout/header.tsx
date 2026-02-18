import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Your cash flow at a glance' },
  '/entries': { title: 'Entries', subtitle: 'Manage income and expenses' },
  '/import': { title: 'Import', subtitle: 'Upload bank statements' },
  '/scenarios': { title: 'Scenarios', subtitle: 'Model what-if situations' },
  '/settings': { title: 'Settings', subtitle: 'Configure your workspace' },
  '/onboarding': { title: 'Welcome', subtitle: 'Let\'s set up your forecaster' },
};

export function Header() {
  const location = useLocation();
  const page = pageTitles[location.pathname] ?? { title: 'RunwayLens', subtitle: '' };

  return (
    <header className="flex h-16 items-center border-b border-border px-6">
      <div>
        <h2 className="font-display text-xl tracking-tight">{page.title}</h2>
        {page.subtitle && (
          <p className="text-xs text-muted-foreground">{page.subtitle}</p>
        )}
      </div>
    </header>
  );
}
