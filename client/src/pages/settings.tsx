import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { CURRENCIES } from '@cashflow/shared';
import { parseDollarsToCents, formatCurrency } from '@/lib/utils';
import { Save, Check } from 'lucide-react';

export default function SettingsPage() {
  const utils = trpc.useUtils();
  const settingsQuery = trpc.settings.getAll.useQuery();
  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      utils.settings.getAll.invalidate();
      utils.forecast.compute.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const [cashBalance, setCashBalance] = useState('');
  const [forecastMonths, setForecastMonths] = useState('12');
  const [currency, setCurrency] = useState('USD');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settingsQuery.data) {
      setCashBalance(String(settingsQuery.data.current_cash_balance / 100));
      setForecastMonths(String(settingsQuery.data.forecast_months));
      setCurrency(settingsQuery.data.currency);
    }
  }, [settingsQuery.data]);

  function handleSave() {
    updateMutation.mutate({
      current_cash_balance: parseDollarsToCents(cashBalance),
      forecast_months: parseInt(forecastMonths, 10),
      currency,
    });
  }

  if (settingsQuery.isLoading) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl border bg-muted/30" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Financial Settings</CardTitle>
          <CardDescription>
            Configure your starting cash balance and forecast parameters.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Current Cash Balance */}
          <div className="space-y-1.5">
            <Label htmlFor="cash_balance">Current Cash Balance</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="cash_balance"
                type="number"
                step="0.01"
                min="0"
                value={cashBalance}
                onChange={(e) => setCashBalance(e.target.value)}
                className="pl-7 font-mono"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Your current total cash on hand.
            </p>
          </div>

          {/* Forecast Period */}
          <div className="space-y-1.5">
            <Label htmlFor="forecast_months">Forecast Period</Label>
            <Select value={forecastMonths} onValueChange={setForecastMonths}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[3, 6, 9, 12, 18, 24].map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m} months
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Currency */}
          <div className="space-y-1.5">
            <Label htmlFor="currency">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.symbol} {c.name} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="w-full gap-2"
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
