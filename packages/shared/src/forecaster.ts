import type { CashEntry, MonthlyProjection, ScenarioForecast, RiskAlert } from './types.js';
import { RISK_THRESHOLDS } from './constants.js';

/**
 * Pure forecasting engine — no side effects, no DB calls.
 * All monetary values are in integer cents.
 *
 * Shared between server (authoritative computation) and client (instant preview).
 */

interface ForecastInput {
  entries: CashEntry[];
  startingBalance: number; // cents
  months: number;
  scenarioId: string;
  scenarioName: string;
  revenueMultiplier: number;
  expenseMultiplier: number;
}

/**
 * Determine how many times a recurring entry occurs in a given month.
 * Returns 0 if the entry is not active in that month.
 */
function getRecurrenceCountInMonth(
  entry: CashEntry,
  targetYear: number,
  targetMonth: number // 0-indexed (0 = January)
): number {
  const startDate = new Date(entry.start_date);
  const targetDate = new Date(targetYear, targetMonth, 1);

  // Check if target month is before start
  if (targetDate < new Date(startDate.getFullYear(), startDate.getMonth(), 1)) {
    return 0;
  }

  // Check if target month is after end
  if (entry.end_date) {
    const endDate = new Date(entry.end_date);
    if (targetDate > new Date(endDate.getFullYear(), endDate.getMonth(), 1)) {
      return 0;
    }
  }

  if (!entry.is_recurring) {
    // One-time entry: only counts in its start month
    if (startDate.getFullYear() === targetYear && startDate.getMonth() === targetMonth) {
      return 1;
    }
    return 0;
  }

  // Recurring entry
  const monthsSinceStart =
    (targetYear - startDate.getFullYear()) * 12 + (targetMonth - startDate.getMonth());

  switch (entry.recurrence_interval) {
    case 'weekly':
      // Approximate: ~4.33 weeks per month
      return 4;
    case 'monthly':
      return 1;
    case 'quarterly':
      return monthsSinceStart % 3 === 0 ? 1 : 0;
    case 'yearly':
      return monthsSinceStart % 12 === 0 ? 1 : 0;
    default:
      return 1;
  }
}

/**
 * Calculate the cumulative growth multiplier for a recurring entry.
 * growth_rate is monthly % as decimal (e.g., 0.05 = 5% per month).
 */
function getGrowthMultiplier(entry: CashEntry, monthsElapsed: number): number {
  if (!entry.growth_rate || entry.growth_rate === 0) return 1;
  return Math.pow(1 + entry.growth_rate, monthsElapsed);
}

/**
 * Compute forecast for a single scenario.
 */
export function computeScenarioForecast(input: ForecastInput): ScenarioForecast {
  const { entries, startingBalance, months, scenarioId, scenarioName, revenueMultiplier, expenseMultiplier } = input;

  const now = new Date();
  const startYear = now.getFullYear();
  const startMonth = now.getMonth(); // 0-indexed

  const projections: MonthlyProjection[] = [];
  let cumulativeBalance = startingBalance;

  for (let m = 0; m < months; m++) {
    const targetMonth = (startMonth + m) % 12;
    const targetYear = startYear + Math.floor((startMonth + m) / 12);

    const monthLabel = new Date(targetYear, targetMonth, 1).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const entry of entries) {
      const count = getRecurrenceCountInMonth(entry, targetYear, targetMonth);
      if (count === 0) continue;

      const startDate = new Date(entry.start_date);
      const monthsElapsed =
        (targetYear - startDate.getFullYear()) * 12 + (targetMonth - startDate.getMonth());
      const growthMultiplier = getGrowthMultiplier(entry, monthsElapsed);

      const amount = Math.round(entry.amount * count * growthMultiplier);

      if (entry.type === 'income') {
        totalIncome += Math.round(amount * revenueMultiplier);
      } else {
        totalExpenses += Math.round(amount * expenseMultiplier);
      }
    }

    const netCashFlow = totalIncome - totalExpenses;
    cumulativeBalance += netCashFlow;
    const burnRate = totalExpenses - totalIncome;

    projections.push({
      month: m + 1,
      month_label: monthLabel,
      income: totalIncome,
      expenses: totalExpenses,
      net_cash_flow: netCashFlow,
      cumulative_balance: cumulativeBalance,
      burn_rate: burnRate,
    });
  }

  // Calculate runway
  const firstNegativeMonth = projections.find((p) => p.cumulative_balance < 0);
  const runwayMonths = firstNegativeMonth ? firstNegativeMonth.month - 1 : null;

  // Calculate projected zero-cash date
  let projectedZeroCashDate: string | null = null;
  if (runwayMonths !== null) {
    const zeroDate = new Date(startYear, startMonth + runwayMonths, 1);
    projectedZeroCashDate = zeroDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }

  // Average metrics
  const totalBurn = projections.reduce((sum, p) => sum + Math.max(0, p.burn_rate), 0);
  const totalRevenue = projections.reduce((sum, p) => sum + p.income, 0);

  return {
    scenario_id: scenarioId,
    scenario_name: scenarioName,
    projections,
    runway_months: runwayMonths,
    projected_zero_cash_date: projectedZeroCashDate,
    average_burn_rate: months > 0 ? Math.round(totalBurn / months) : 0,
    average_revenue: months > 0 ? Math.round(totalRevenue / months) : 0,
  };
}

/**
 * Generate risk alerts based on forecast results.
 */
export function computeRiskAlerts(
  scenarioForecasts: ScenarioForecast[],
  startingBalance: number,
  entries: CashEntry[]
): RiskAlert[] {
  const alerts: RiskAlert[] = [];

  // Use the "expected" scenario (or first available)
  const primary = scenarioForecasts.find((s) =>
    s.scenario_name.toLowerCase() === 'expected'
  ) ?? scenarioForecasts[0];

  if (!primary || primary.projections.length === 0) {
    return [{
      type: 'info',
      title: 'No Data',
      message: 'Add income and expense entries to see your cash flow forecast.',
      month: null,
    }];
  }

  // ── Alert: Balance drops below $0 ─────────────────────────
  if (primary.runway_months !== null) {
    const severity = primary.runway_months <= RISK_THRESHOLDS.CRITICAL_RUNWAY_MONTHS ? 'critical' : 'warning';
    alerts.push({
      type: severity,
      title: severity === 'critical' ? 'Critical: Cash Runs Out Soon' : 'Warning: Limited Runway',
      message: `At current pace, cash runs out in ${primary.runway_months} month${primary.runway_months !== 1 ? 's' : ''} (${primary.projected_zero_cash_date}).`,
      month: primary.runway_months,
    });
  }

  // ── Alert: Balance drops below 1 month of expenses ────────
  const avgMonthlyExpenses = primary.projections.reduce((s, p) => s + p.expenses, 0) / primary.projections.length;
  const lowBalanceMonth = primary.projections.find(
    (p) => p.cumulative_balance > 0 && p.cumulative_balance < avgMonthlyExpenses * RISK_THRESHOLDS.LOW_BALANCE_MONTHS
  );
  if (lowBalanceMonth && (primary.runway_months === null || lowBalanceMonth.month < primary.runway_months)) {
    alerts.push({
      type: 'warning',
      title: 'Low Cash Reserve',
      message: `Cash balance drops below 1 month of expenses in ${lowBalanceMonth.month_label}.`,
      month: lowBalanceMonth.month,
    });
  }

  // ── Alert: Burn rate increasing >10% MoM for 3 consecutive months ─
  let consecutiveIncreases = 0;
  for (let i = 1; i < primary.projections.length; i++) {
    const prev = primary.projections[i - 1].burn_rate;
    const curr = primary.projections[i].burn_rate;
    if (prev > 0 && curr > prev) {
      const increaseRate = (curr - prev) / prev;
      if (increaseRate >= RISK_THRESHOLDS.BURN_RATE_INCREASE_THRESHOLD) {
        consecutiveIncreases++;
        if (consecutiveIncreases >= RISK_THRESHOLDS.CONSECUTIVE_BURN_MONTHS) {
          alerts.push({
            type: 'warning',
            title: 'Accelerating Burn Rate',
            message: `Burn rate has increased by more than 10% for ${consecutiveIncreases} consecutive months.`,
            month: primary.projections[i].month,
          });
          break;
        }
      } else {
        consecutiveIncreases = 0;
      }
    } else {
      consecutiveIncreases = 0;
    }
  }

  // ── Alert: Single expense > 50% of monthly income ────────
  const monthlyIncomes = primary.projections.map((p) => p.income);
  for (const entry of entries) {
    if (entry.type !== 'expense') continue;
    const avgIncome = monthlyIncomes.reduce((a, b) => a + b, 0) / monthlyIncomes.length;
    if (avgIncome > 0 && entry.amount > avgIncome * RISK_THRESHOLDS.LARGE_EXPENSE_RATIO) {
      alerts.push({
        type: 'warning',
        title: 'Large Expense Detected',
        message: `"${entry.description}" ($${(entry.amount / 100).toLocaleString()}/occurrence) exceeds 50% of average monthly income.`,
        month: null,
      });
    }
  }

  // ── Healthy status ────────────────────────────────────────
  if (alerts.length === 0) {
    const lastProjection = primary.projections[primary.projections.length - 1];
    alerts.push({
      type: 'healthy',
      title: 'Financial Health: Strong',
      message: `Net cash flow is positive. Projected balance in ${lastProjection.month_label}: $${(lastProjection.cumulative_balance / 100).toLocaleString()}.`,
      month: null,
    });
  }

  return alerts;
}
