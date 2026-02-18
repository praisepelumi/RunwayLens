import { useEffect, useRef, useCallback, useState } from 'react';
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

// ── Animated runway chart SVG ──────────────────────────────────────
// Shows three scenario lines (optimistic, expected, pessimistic) that
// draw themselves on mount, with a pulsing "danger zone" at the bottom.

const CHART_W = 600;
const CHART_H = 200;
const MONTHS = 12;
const PADDING = { top: 20, right: 20, bottom: 30, left: 50 };

const scenarioData = {
  optimistic: [500, 480, 470, 465, 468, 475, 490, 510, 535, 565, 600, 640],
  expected:   [500, 460, 420, 385, 355, 320, 290, 255, 220, 180, 140, 95],
  pessimistic:[500, 440, 375, 310, 250, 190, 130, 75,  30, -10, -40, -65],
};

const monthLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function toSvgX(i: number) {
  const plotW = CHART_W - PADDING.left - PADDING.right;
  return PADDING.left + (i / (MONTHS - 1)) * plotW;
}

function toSvgY(val: number) {
  const minVal = -100;
  const maxVal = 700;
  const plotH = CHART_H - PADDING.top - PADDING.bottom;
  return PADDING.top + plotH - ((val - minVal) / (maxVal - minVal)) * plotH;
}

function buildPath(data: number[]) {
  return data
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${toSvgX(i).toFixed(1)},${toSvgY(v).toFixed(1)}`)
    .join(' ');
}

function buildAreaPath(data: number[]) {
  const line = data
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${toSvgX(i).toFixed(1)},${toSvgY(v).toFixed(1)}`)
    .join(' ');
  const bottom = toSvgY(-100);
  return `${line} L${toSvgX(data.length - 1).toFixed(1)},${bottom} L${toSvgX(0).toFixed(1)},${bottom} Z`;
}

function RunwayChart() {
  const [visible, setVisible] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (chartRef.current) observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, []);

  const zeroY = toSvgY(0);

  const scenarios = [
    { key: 'pessimistic', data: scenarioData.pessimistic, color: '#ef4444', label: 'Pessimistic' },
    { key: 'expected',    data: scenarioData.expected,    color: '#5ba3d9', label: 'Expected' },
    { key: 'optimistic',  data: scenarioData.optimistic,  color: '#22c55e', label: 'Optimistic' },
  ];

  return (
    <div ref={chartRef} className="relative mx-auto mt-14 w-full max-w-2xl">
      {/* Glow behind chart */}
      <div className="absolute inset-0 -m-8 rounded-3xl bg-[#5ba3d9]/[0.04] blur-2xl" />

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-sm">
        {/* Chart header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-white/30">
              Cash Projection
            </p>
            <p className="mt-0.5 font-mono text-lg font-semibold text-white/80">
              $500,000
              <span className="ml-2 text-xs font-normal text-white/30">starting balance</span>
            </p>
          </div>
          {/* Legend */}
          <div className="flex gap-4">
            {scenarios.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[10px] text-white/40">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SVG Chart */}
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Gradient for danger zone */}
            <linearGradient id="dangerZone" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </linearGradient>
            {/* Area fills */}
            <linearGradient id="areaOptimistic" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="areaExpected" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5ba3d9" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#5ba3d9" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 175, 350, 525, 700].map((val) => (
            <g key={val}>
              <line
                x1={PADDING.left}
                y1={toSvgY(val)}
                x2={CHART_W - PADDING.right}
                y2={toSvgY(val)}
                stroke="white"
                strokeOpacity={val === 0 ? 0.15 : 0.05}
                strokeDasharray={val === 0 ? 'none' : '4 4'}
              />
              <text
                x={PADDING.left - 8}
                y={toSvgY(val) + 3}
                textAnchor="end"
                className="fill-white/20 text-[9px]"
                fontFamily="JetBrains Mono, monospace"
              >
                {val === 0 ? '$0' : `$${val}k`}
              </text>
            </g>
          ))}

          {/* Month labels */}
          {monthLabels.map((label, i) => (
            <text
              key={label}
              x={toSvgX(i)}
              y={CHART_H - 8}
              textAnchor="middle"
              className="fill-white/20 text-[9px]"
              fontFamily="JetBrains Mono, monospace"
            >
              {label}
            </text>
          ))}

          {/* Danger zone below $0 */}
          <rect
            x={PADDING.left}
            y={zeroY}
            width={CHART_W - PADDING.left - PADDING.right}
            height={CHART_H - PADDING.bottom - zeroY}
            fill="url(#dangerZone)"
          />

          {/* Area fills */}
          <path
            d={buildAreaPath(scenarioData.optimistic)}
            fill="url(#areaOptimistic)"
            className={`transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0'}`}
          />
          <path
            d={buildAreaPath(scenarioData.expected)}
            fill="url(#areaExpected)"
            className={`transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0'}`}
          />

          {/* Scenario lines */}
          {scenarios.map((s) => {
            const path = buildPath(s.data);
            return (
              <g key={s.key}>
                {/* Glow */}
                <path
                  d={path}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="6"
                  strokeOpacity="0.15"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`${visible ? 'animate-draw' : ''}`}
                  style={{
                    strokeDasharray: 1200,
                    strokeDashoffset: visible ? 0 : 1200,
                    transition: 'stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
                {/* Line */}
                <path
                  d={path}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: 1200,
                    strokeDashoffset: visible ? 0 : 1200,
                    transition: 'stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
                {/* End dot */}
                <circle
                  cx={toSvgX(11)}
                  cy={toSvgY(s.data[11])}
                  r="4"
                  fill={s.color}
                  className={`transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
                  style={{ transitionDelay: '2s' }}
                />
                {/* End label */}
                <text
                  x={toSvgX(11) + 8}
                  y={toSvgY(s.data[11]) + 3}
                  className={`fill-white/50 text-[9px] transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
                  fontFamily="JetBrains Mono, monospace"
                  style={{ transitionDelay: '2.2s' }}
                >
                  {s.data[11] >= 0 ? `$${s.data[11]}k` : `-$${Math.abs(s.data[11])}k`}
                </text>
              </g>
            );
          })}

          {/* Runway marker — where expected crosses $0 */}
          {(() => {
            // Find the month where expected crosses zero (between month 11 and 12 based on data)
            const data = scenarioData.expected;
            for (let i = 1; i < data.length; i++) {
              if (data[i] <= 0) {
                const ratio = data[i - 1] / (data[i - 1] - data[i]);
                const crossX = toSvgX(i - 1 + ratio);
                return (
                  <g className={`transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '2.4s' }}>
                    <line x1={crossX} y1={zeroY - 20} x2={crossX} y2={zeroY + 10} stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.6" />
                    <rect x={crossX - 32} y={zeroY - 34} width="64" height="18" rx="4" fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeOpacity="0.3" strokeWidth="0.5" />
                    <text x={crossX} y={zeroY - 22} textAnchor="middle" className="text-[8px] font-semibold" fill="#ef4444" fontFamily="JetBrains Mono, monospace">
                      RUNWAY END
                    </text>
                  </g>
                );
              }
            }
            return null;
          })()}
        </svg>
      </div>
    </div>
  );
}

// ── Main Login Page ────────────────────────────────────────────────

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
        <main className="flex flex-1 flex-col items-center px-6 pt-12 sm:pt-20">
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

          {/* Animated Runway Chart */}
          <RunwayChart />

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
          <div className="mt-16 mb-20 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
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
