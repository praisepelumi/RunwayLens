import { cn } from '@/lib/utils';
import { Clock, ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface RunwayBadgeProps {
  runwayMonths: number | null;
  projectedZeroCashDate: string | null;
}

export function RunwayBadge({ runwayMonths, projectedZeroCashDate }: RunwayBadgeProps) {
  const isInfinite = runwayMonths === null;
  const isCritical = !isInfinite && runwayMonths <= 3;
  const isWarning = !isInfinite && runwayMonths <= 6;
  const isHealthy = isInfinite || runwayMonths > 6;

  const StatusIcon = isCritical
    ? AlertOctagon
    : isWarning
    ? AlertTriangle
    : ShieldCheck;

  return (
    <Card
      className={cn(
        'relative overflow-hidden',
        isCritical && 'border-danger/30 bg-danger/5',
        isWarning && !isCritical && 'border-warning/30 bg-warning/5',
        isHealthy && 'border-success/30 bg-success/5'
      )}
    >
      <CardContent className="flex items-center gap-5 p-5">
        <div
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-xl',
            isCritical && 'bg-danger/15 text-danger',
            isWarning && !isCritical && 'bg-warning/15 text-warning',
            isHealthy && 'bg-success/15 text-success'
          )}
        >
          <StatusIcon className="h-7 w-7" />
        </div>

        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                'font-mono text-3xl font-bold tracking-tighter',
                isCritical && 'text-danger',
                isWarning && !isCritical && 'text-warning',
                isHealthy && 'text-success'
              )}
            >
              {isInfinite ? '24+' : runwayMonths}
            </span>
            <span className="text-sm font-medium text-muted-foreground">months of runway</span>
          </div>

          {projectedZeroCashDate ? (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Cash runs out {projectedZeroCashDate}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">
              No cash depletion projected in forecast period
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
