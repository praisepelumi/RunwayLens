import type { ForecastResponse, RiskAlert, ScenarioForecast, MonthlyProjection } from '@cashflow/shared';

/**
 * Realistic mock data for a small marketing agency.
 * Used during Phase 2 to build the dashboard before real data is wired.
 */

function generateProjections(
  startingBalance: number,
  months: number,
  baseIncome: number,
  baseExpenses: number,
  revenueMultiplier: number,
  expenseMultiplier: number,
  incomeGrowth: number = 0.03,
  expenseGrowth: number = 0.01
): MonthlyProjection[] {
  const now = new Date();
  const projections: MonthlyProjection[] = [];
  let balance = startingBalance;

  for (let m = 0; m < months; m++) {
    const targetMonth = (now.getMonth() + m) % 12;
    const targetYear = now.getFullYear() + Math.floor((now.getMonth() + m) / 12);
    const monthLabel = new Date(targetYear, targetMonth, 1).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });

    const income = Math.round(baseIncome * revenueMultiplier * Math.pow(1 + incomeGrowth, m));
    const expenses = Math.round(baseExpenses * expenseMultiplier * Math.pow(1 + expenseGrowth, m));
    const netCashFlow = income - expenses;
    balance += netCashFlow;

    projections.push({
      month: m + 1,
      month_label: monthLabel,
      income,
      expenses,
      net_cash_flow: netCashFlow,
      cumulative_balance: balance,
      burn_rate: expenses - income,
    });
  }

  return projections;
}

function buildScenario(
  id: string,
  name: string,
  startingBalance: number,
  revenueMultiplier: number,
  expenseMultiplier: number
): ScenarioForecast {
  const projections = generateProjections(
    startingBalance,
    12,
    4200000, // $42,000/mo revenue
    3500000, // $35,000/mo expenses
    revenueMultiplier,
    expenseMultiplier
  );

  const firstNegative = projections.find((p) => p.cumulative_balance < 0);
  const runwayMonths = firstNegative ? firstNegative.month - 1 : null;

  let projectedZeroCashDate: string | null = null;
  if (runwayMonths !== null) {
    const now = new Date();
    const zeroDate = new Date(now.getFullYear(), now.getMonth() + runwayMonths, 1);
    projectedZeroCashDate = zeroDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }

  const totalBurn = projections.reduce((s, p) => s + Math.max(0, p.burn_rate), 0);
  const totalRevenue = projections.reduce((s, p) => s + p.income, 0);

  return {
    scenario_id: id,
    scenario_name: name,
    projections,
    runway_months: runwayMonths,
    projected_zero_cash_date: projectedZeroCashDate,
    average_burn_rate: Math.round(totalBurn / 12),
    average_revenue: Math.round(totalRevenue / 12),
  };
}

export const mockForecast: ForecastResponse = {
  current_cash_balance: 12500000, // $125,000
  scenarios: [
    buildScenario('s1', 'Optimistic', 12500000, 1.2, 0.95),
    buildScenario('s2', 'Expected', 12500000, 1.0, 1.0),
    buildScenario('s3', 'Pessimistic', 12500000, 0.8, 1.1),
  ],
  risk_alerts: [
    {
      type: 'warning',
      title: 'Limited Runway (Pessimistic)',
      message: 'Under pessimistic conditions, cash runs out in 8 months.',
      month: 8,
    },
    {
      type: 'info',
      title: 'Payroll is Your Largest Expense',
      message: 'Payroll ($18,000/mo) accounts for 51% of monthly expenses.',
      month: null,
    },
    {
      type: 'healthy',
      title: 'Positive Net Cash Flow',
      message: 'Expected scenario shows positive cash flow with growing balance.',
      month: null,
    },
  ],
};
