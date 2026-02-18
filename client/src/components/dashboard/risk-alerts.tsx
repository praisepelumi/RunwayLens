import type { RiskAlert } from '@cashflow/shared';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface RiskAlertsProps {
  alerts: RiskAlert[];
}

const alertConfig = {
  critical: {
    icon: AlertOctagon,
    bg: 'bg-danger/8 border-danger/20',
    iconColor: 'text-danger',
    textColor: 'text-danger',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-warning/8 border-warning/20',
    iconColor: 'text-warning',
    textColor: 'text-warning',
  },
  info: {
    icon: Info,
    bg: 'bg-primary/8 border-primary/20',
    iconColor: 'text-primary',
    textColor: 'text-primary',
  },
  healthy: {
    icon: CheckCircle2,
    bg: 'bg-success/8 border-success/20',
    iconColor: 'text-success',
    textColor: 'text-success',
  },
};

export function RiskAlerts({ alerts }: RiskAlertsProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Risk Insights
      </h3>
      <div className="space-y-2">
        {alerts.map((alert, i) => {
          const config = alertConfig[alert.type];
          const Icon = config.icon;
          return (
            <div
              key={i}
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3.5 transition-colors',
                config.bg
              )}
            >
              <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', config.iconColor)} />
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm font-medium', config.textColor)}>
                  {alert.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {alert.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
