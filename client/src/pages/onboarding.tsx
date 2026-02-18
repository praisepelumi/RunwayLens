import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import { Card, CardContent } from '@/components/ui/card';
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
import { Telescope, ArrowRight, ArrowLeft, BarChart3, Rocket } from 'lucide-react';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Step 1 data
  const [cashBalance, setCashBalance] = useState('50000');
  const [currency, setCurrency] = useState('USD');

  // Step 2 data (quick estimate)
  const [monthlyRevenue, setMonthlyRevenue] = useState('');
  const [monthlyExpenses, setMonthlyExpenses] = useState('');

  const updateSettings = trpc.settings.update.useMutation();
  const createEntry = trpc.entries.create.useMutation();

  // Quick runway calculation for step 2 preview
  const revCents = parseDollarsToCents(monthlyRevenue || '0');
  const expCents = parseDollarsToCents(monthlyExpenses || '0');
  const balCents = parseDollarsToCents(cashBalance || '0');
  const monthlyNet = revCents - expCents;
  const quickRunway = monthlyNet >= 0
    ? null
    : Math.floor(balCents / Math.abs(monthlyNet));

  async function handleFinish() {
    // Save settings
    await updateSettings.mutateAsync({
      current_cash_balance: balCents,
      currency,
      onboarding_completed: true,
    });

    // Create quick estimate entries if provided
    const today = new Date().toISOString().split('T')[0];
    if (revCents > 0) {
      await createEntry.mutateAsync({
        type: 'income',
        category: 'Revenue',
        description: 'Monthly Revenue (estimated)',
        amount: revCents,
        is_recurring: true,
        recurrence_interval: 'monthly',
        start_date: today,
        end_date: null,
        growth_rate: 0,
        tags: ['onboarding'],
      });
    }
    if (expCents > 0) {
      await createEntry.mutateAsync({
        type: 'expense',
        category: 'Other Expense',
        description: 'Monthly Expenses (estimated)',
        amount: expCents,
        is_recurring: true,
        recurrence_interval: 'monthly',
        start_date: today,
        end_date: null,
        growth_rate: 0,
        tags: ['onboarding'],
      });
    }

    navigate('/');
  }

  const steps = [
    // ── Step 0: Welcome ──
    <div key="welcome" className="space-y-6 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
        <Telescope className="h-10 w-10 text-primary" />
      </div>
      <div>
        <h1 className="font-display text-4xl tracking-tight">
          Welcome to RunwayLens
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Understand your business cash flow in minutes. See how long your
          runway lasts and what risks lie ahead — no finance degree required.
        </p>
      </div>
      <div className="space-y-4 text-left mx-auto max-w-sm">
        <div className="space-y-1.5">
          <Label>What currency do you operate in?</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.symbol} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Current cash on hand</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
            <Input
              type="number"
              min="0"
              value={cashBalance}
              onChange={(e) => setCashBalance(e.target.value)}
              className="pl-7 font-mono"
              placeholder="50,000"
            />
          </div>
        </div>
      </div>
      <Button onClick={() => setStep(1)} className="gap-2">
        Next <ArrowRight className="h-4 w-4" />
      </Button>
    </div>,

    // ── Step 1: Quick Estimate ──
    <div key="estimate" className="space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-chart-2/10">
        <BarChart3 className="h-8 w-8 text-chart-2" />
      </div>
      <div>
        <h2 className="font-display text-2xl tracking-tight">
          Quick Estimate
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Enter rough monthly numbers for an instant runway preview.
          You can add detailed entries later.
        </p>
      </div>
      <div className="space-y-4 text-left mx-auto max-w-sm">
        <div className="space-y-1.5">
          <Label>Approximate monthly revenue</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
            <Input
              type="number"
              min="0"
              value={monthlyRevenue}
              onChange={(e) => setMonthlyRevenue(e.target.value)}
              className="pl-7 font-mono"
              placeholder="10,000"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Approximate monthly expenses</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
            <Input
              type="number"
              min="0"
              value={monthlyExpenses}
              onChange={(e) => setMonthlyExpenses(e.target.value)}
              className="pl-7 font-mono"
              placeholder="8,000"
            />
          </div>
        </div>

        {/* Instant runway preview */}
        {(revCents > 0 || expCents > 0) && (
          <div className="rounded-lg border bg-muted/30 p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Estimated Runway
            </p>
            <p className="mt-1 font-mono text-3xl font-bold tracking-tighter text-primary">
              {quickRunway === null ? '24+' : quickRunway} <span className="text-base font-normal text-muted-foreground">months</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Net: {formatCurrency(monthlyNet)}/mo
            </p>
          </div>
        )}
      </div>
      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={() => setStep(0)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={() => setStep(2)} className="gap-2">
          Next <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>,

    // ── Step 2: Finish ──
    <div key="finish" className="space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-chart-3/10">
        <Rocket className="h-8 w-8 text-chart-3" />
      </div>
      <div>
        <h2 className="font-display text-2xl tracking-tight">
          You're All Set
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Your forecaster is ready. You can add detailed entries, import bank
          statements, and create scenarios from the dashboard.
        </p>
      </div>
      <div className="mx-auto max-w-sm rounded-lg border bg-muted/20 p-4 text-left text-sm space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cash Balance</span>
          <span className="font-mono font-medium">{formatCurrency(balCents)}</span>
        </div>
        {revCents > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Monthly Revenue</span>
            <span className="font-mono font-medium text-success">{formatCurrency(revCents)}</span>
          </div>
        )}
        {expCents > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Monthly Expenses</span>
            <span className="font-mono font-medium text-danger">{formatCurrency(expCents)}</span>
          </div>
        )}
      </div>
      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button
          onClick={handleFinish}
          disabled={updateSettings.isPending}
          className="gap-2"
        >
          Launch Dashboard <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>,
  ];

  // Step indicator
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        {/* Step dots */}
        <div className="mb-8 flex justify-center gap-2">
          {[0, 1, 2].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step ? 'w-8 bg-primary' : 'w-1.5 bg-border'
              }`}
            />
          ))}
        </div>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            {steps[step]}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
