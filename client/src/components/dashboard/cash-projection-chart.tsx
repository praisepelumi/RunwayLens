import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { ScenarioForecast } from '@cashflow/shared';

interface CashProjectionChartProps {
  scenarios: ScenarioForecast[];
  currency?: string;
}

const SCENARIO_COLORS: Record<string, string> = {
  Optimistic: '#3b9b74',
  Expected: '#2d5a7b',
  Pessimistic: '#d05858',
};

const FALLBACK_COLORS = ['#2d5a7b', '#3b9b74', '#e4a853', '#d05858', '#7c5cbf'];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;

  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg">
      <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-mono font-medium">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function CashProjectionChart({ scenarios, currency = 'USD' }: CashProjectionChartProps) {
  if (scenarios.length === 0) return null;

  // Build unified dataset keyed by month_label
  const baseProjections = scenarios[0].projections;
  const data = baseProjections.map((proj, i) => {
    const point: Record<string, any> = {
      month_label: proj.month_label,
    };
    for (const scenario of scenarios) {
      point[scenario.scenario_name] = scenario.projections[i]?.cumulative_balance ?? 0;
    }
    return point;
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Cash Balance Projection
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
              <XAxis
                dataKey="month_label"
                tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--color-border)' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => {
                  const dollars = v / 100;
                  if (Math.abs(dollars) >= 1000000) return `$${(dollars / 1000000).toFixed(1)}M`;
                  if (Math.abs(dollars) >= 1000) return `$${(dollars / 1000).toFixed(0)}K`;
                  return `$${dollars}`;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
              />
              <ReferenceLine
                y={0}
                stroke="var(--color-danger)"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
                label={{
                  value: '$0',
                  position: 'right',
                  fill: 'var(--color-danger)',
                  fontSize: 10,
                }}
              />
              {scenarios.map((scenario, i) => (
                <Line
                  key={scenario.scenario_id}
                  type="monotone"
                  dataKey={scenario.scenario_name}
                  stroke={SCENARIO_COLORS[scenario.scenario_name] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
                  strokeWidth={scenario.scenario_name === 'Expected' ? 2.5 : 1.5}
                  strokeDasharray={scenario.scenario_name === 'Expected' ? undefined : '6 3'}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
