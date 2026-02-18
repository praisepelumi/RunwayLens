import { MetricCards } from '@/components/dashboard/metric-cards';
import { RunwayBadge } from '@/components/dashboard/runway-badge';
import { CashProjectionChart } from '@/components/dashboard/cash-projection-chart';
import { BurnRateChart } from '@/components/dashboard/burn-rate-chart';
import { RiskAlerts } from '@/components/dashboard/risk-alerts';
import { EmptyState } from '@/components/dashboard/empty-state';
import { trpc } from '@/lib/trpc';

export default function DashboardPage() {
  const forecastQuery = trpc.forecast.compute.useQuery({ months: 12 });
  const entriesQuery = trpc.entries.list.useQuery();
  const settingsQuery = trpc.settings.getAll.useQuery();

  const isLoading = forecastQuery.isLoading || entriesQuery.isLoading;
  const hasEntries = (entriesQuery.data?.length ?? 0) > 0;

  // Show empty state when no entries exist
  if (!isLoading && !hasEntries) {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <EmptyState />
      </div>
    );
  }

  // Loading state
  if (isLoading || !forecastQuery.data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border bg-muted/30" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="h-20 animate-pulse rounded-xl border bg-muted/30" />
          <div className="col-span-2 h-20 animate-pulse rounded-xl border bg-muted/30" />
        </div>
        <div className="h-96 animate-pulse rounded-xl border bg-muted/30" />
      </div>
    );
  }

  const forecast = forecastQuery.data;
  const expected = forecast.scenarios.find((s) => s.scenario_name === 'Expected') ?? forecast.scenarios[0];

  if (!expected) {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Metric Cards */}
      <MetricCards
        currentCash={expected.projections[0]?.cumulative_balance ?? forecast.current_cash_balance}
        monthlyBurn={expected.average_burn_rate}
        avgRevenue={expected.average_revenue}
        netCashFlow={expected.average_revenue - expected.average_burn_rate}
        currency={settingsQuery.data?.currency}
      />

      {/* Runway + Risk Alerts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <RunwayBadge
            runwayMonths={expected.runway_months}
            projectedZeroCashDate={expected.projected_zero_cash_date}
          />
        </div>
        <div className="lg:col-span-2">
          <RiskAlerts alerts={forecast.risk_alerts} />
        </div>
      </div>

      {/* Cash Projection Chart */}
      <CashProjectionChart
        scenarios={forecast.scenarios}
        currency={settingsQuery.data?.currency}
      />

      {/* Income vs Expenses Chart */}
      <BurnRateChart
        projections={expected.projections}
        currency={settingsQuery.data?.currency}
      />
    </div>
  );
}
