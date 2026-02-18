import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardsProps {
  currentCash: number;
  monthlyBurn: number;
  avgRevenue: number;
  netCashFlow: number;
  currency?: string;
}

interface MetricCardData {
  label: string;
  value: number;
  icon: React.ElementType;
  format: (v: number) => string;
  trend?: 'positive' | 'negative' | 'neutral';
  bgAccent: string;
  iconColor: string;
}

export function MetricCards({ currentCash, monthlyBurn, avgRevenue, netCashFlow, currency = 'USD' }: MetricCardsProps) {
  const fmt = (v: number) => formatCurrency(v, currency);

  const metrics: MetricCardData[] = [
    {
      label: 'Current Cash',
      value: currentCash,
      icon: Wallet,
      format: fmt,
      bgAccent: 'bg-blue-50 dark:bg-blue-950/30',
      iconColor: 'text-chart-1',
    },
    {
      label: 'Monthly Burn',
      value: monthlyBurn,
      icon: TrendingDown,
      format: fmt,
      trend: monthlyBurn > 0 ? 'negative' : 'positive',
      bgAccent: 'bg-red-50 dark:bg-red-950/30',
      iconColor: 'text-chart-4',
    },
    {
      label: 'Avg Revenue',
      value: avgRevenue,
      icon: TrendingUp,
      format: fmt,
      trend: 'positive',
      bgAccent: 'bg-emerald-50 dark:bg-emerald-950/30',
      iconColor: 'text-chart-2',
    },
    {
      label: 'Net Cash Flow',
      value: netCashFlow,
      icon: ArrowUpDown,
      format: fmt,
      trend: netCashFlow >= 0 ? 'positive' : 'negative',
      bgAccent: 'bg-purple-50 dark:bg-purple-950/30',
      iconColor: 'text-chart-5',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.label} className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {metric.label}
                  </p>
                  <p
                    className={cn(
                      'font-mono text-2xl font-semibold tracking-tight',
                      metric.trend === 'positive' && 'text-success',
                      metric.trend === 'negative' && 'text-danger'
                    )}
                  >
                    {metric.format(metric.value)}
                  </p>
                </div>
                <div className={cn('rounded-lg p-2.5', metric.bgAccent)}>
                  <Icon className={cn('h-5 w-5', metric.iconColor)} />
                </div>
              </div>
            </CardContent>
            {/* Subtle gradient accent at top */}
            <div
              className={cn(
                'absolute inset-x-0 top-0 h-0.5',
                metric.trend === 'positive' && 'bg-success',
                metric.trend === 'negative' && 'bg-danger',
                !metric.trend && 'bg-primary'
              )}
            />
          </Card>
        );
      })}
    </div>
  );
}
