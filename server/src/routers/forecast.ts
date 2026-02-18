import { router, protectedProcedure } from '../trpc/init.js';
import { cashEntries, scenarios, settings } from '../db/schema.js';
import { eq, and, inArray } from 'drizzle-orm';
import {
  forecastRequestSchema,
  computeScenarioForecast,
  computeRiskAlerts,
} from '@cashflow/shared';
import type { CashEntry } from '@cashflow/shared';

export const forecastRouter = router({
  compute: protectedProcedure
    .input(forecastRequestSchema)
    .query(async ({ ctx, input }) => {
      // Get current cash balance from settings
      const balanceSetting = await ctx.db
        .select()
        .from(settings)
        .where(and(eq(settings.user_id, ctx.user.id), eq(settings.key, 'current_cash_balance')))
        .then((r) => r[0]);
      const currentCashBalance = parseInt(balanceSetting?.value ?? '0', 10);

      // Get all entries for this user
      const rawEntries = await ctx.db
        .select()
        .from(cashEntries)
        .where(eq(cashEntries.user_id, ctx.user.id));

      // Parse tags from JSON string to array
      const entries: CashEntry[] = rawEntries.map((e) => ({
        ...e,
        type: e.type as 'income' | 'expense',
        is_recurring: !!e.is_recurring,
        recurrence_interval: e.recurrence_interval as CashEntry['recurrence_interval'],
        end_date: e.end_date ?? null,
        source: e.source as 'manual' | 'csv_import',
        tags: JSON.parse(e.tags || '[]'),
      }));

      // Get scenarios to compute (scoped to this user)
      let scenarioRows;
      if (input.scenario_ids && input.scenario_ids.length > 0) {
        scenarioRows = await ctx.db
          .select()
          .from(scenarios)
          .where(and(
            eq(scenarios.user_id, ctx.user.id),
            inArray(scenarios.id, input.scenario_ids),
          ));
      } else {
        // Default: compute all default scenarios
        scenarioRows = await ctx.db
          .select()
          .from(scenarios)
          .where(and(
            eq(scenarios.user_id, ctx.user.id),
            eq(scenarios.is_default, true),
          ));
      }

      // Compute forecast for each scenario
      const scenarioForecasts = scenarioRows.map((scenario) =>
        computeScenarioForecast({
          entries,
          startingBalance: currentCashBalance,
          months: input.months ?? 12,
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          revenueMultiplier: scenario.revenue_multiplier,
          expenseMultiplier: scenario.expense_multiplier,
        })
      );

      // Compute risk alerts
      const riskAlerts = computeRiskAlerts(scenarioForecasts, currentCashBalance, entries);

      return {
        current_cash_balance: currentCashBalance,
        scenarios: scenarioForecasts,
        risk_alerts: riskAlerts,
      };
    }),
});
