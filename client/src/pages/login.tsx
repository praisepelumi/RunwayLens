import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import {
  Telescope,
  TrendingUp,
  ShieldCheck,
  GitBranch,
  BarChart3,
  ArrowRight,
} from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: string;
              size?: string;
              width?: number;
              text?: string;
              shape?: string;
            }
          ) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const features = [
  {
    icon: BarChart3,
    title: 'Live Dashboard',
    description: 'Real-time KPIs, burn rate, and cash projections at a glance.',
  },
  {
    icon: GitBranch,
    title: 'Scenario Modeling',
    description: 'Toggle what-if scenarios — hiring, churn, growth — instantly.',
  },
  {
    icon: TrendingUp,
    title: 'Runway Forecast',
    description: 'Know exactly when cash runs out, across every scenario.',
  },
  {
    icon: ShieldCheck,
    title: 'Risk Alerts',
    description: 'Automated warnings before burn rate spirals or reserves dip.',
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const handleCredentialResponse = useCallback(
    (response: { credential: string }) => {
      login(response.credential);
    },
    [login]
  );

  useEffect(() => {
    if (initializedRef.current) return;

    function initGoogle() {
      if (!window.google || !buttonRef.current) return;
      initializedRef.current = true;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'signin_with',
        shape: 'rectangular',
      });
    }

    if (window.google) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          initGoogle();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [handleCredentialResponse]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0a0a14]">
      {/* Ambient glow effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[40%] left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-[#5ba3d9]/[0.07] blur-[120px]" />
        <div className="absolute -bottom-[20%] -left-[10%] h-[600px] w-[600px] rounded-full bg-[#3b9b74]/[0.05] blur-[100px]" />
        <div className="absolute -right-[10%] top-[40%] h-[500px] w-[500px] rounded-full bg-[#7c5cbf]/[0.05] blur-[100px]" />
      </div>

      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-5 sm:px-12">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.08] backdrop-blur-sm ring-1 ring-white/[0.08]">
              <Telescope className="h-4.5 w-4.5 text-[#5ba3d9]" />
            </div>
            <span className="font-display text-xl tracking-tight text-white">
              RunwayLens
            </span>
          </div>
          <a
            href="https://github.com/praisepelumi/RunwayLens"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-white/60 transition-all hover:border-white/[0.15] hover:bg-white/[0.08] hover:text-white/90"
          >
            View on GitHub
            <ArrowRight className="h-3 w-3" />
          </a>
        </nav>

        {/* Hero */}
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 sm:py-24">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-xs font-medium text-white/60">
              Free for startups
            </span>
          </div>

          {/* Headline */}
          <h1 className="max-w-3xl text-center font-display text-5xl leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Know your{' '}
            <span className="bg-gradient-to-r from-[#5ba3d9] via-[#3b9b74] to-[#5ba3d9] bg-clip-text text-transparent">
              runway
            </span>
            <br />
            before it ends
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-lg text-center text-base leading-relaxed text-white/40 sm:text-lg">
            Cash flow forecasting built for founders. Model scenarios, track
            burn rate, and see exactly when the money runs out.
          </p>

          {/* CTA — Google Sign In */}
          <div className="mt-10 flex flex-col items-center gap-4">
            <div ref={buttonRef} />
            <p className="text-[11px] text-white/25">
              Your data is encrypted and scoped to your account
            </p>
          </div>

          {/* Feature Grid */}
          <div className="mt-20 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-white/[0.06] transition-colors group-hover:bg-white/[0.1]">
                    <Icon className="h-5 w-5 text-white/50 transition-colors group-hover:text-white/80" />
                  </div>
                  <h3 className="text-sm font-semibold text-white/80">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/35">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Metrics bar */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {[
              { value: '12mo', label: 'Forecast Range' },
              { value: '3', label: 'Default Scenarios' },
              { value: '<1s', label: 'Computation Time' },
              { value: '$0', label: 'Forever Free' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-mono text-2xl font-semibold text-white/80">
                  {stat.value}
                </p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-widest text-white/25">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-white/[0.06] px-6 py-6 sm:px-12">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs text-white/25">
              Built with React, tRPC, PostgreSQL & Hono
            </p>
            <p className="text-xs text-white/25">
              &copy; {new Date().getFullYear()} RunwayLens
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
