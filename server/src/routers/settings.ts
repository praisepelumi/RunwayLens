import { router, protectedProcedure } from '../trpc/init.js';
import { settings } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { settingsUpdateSchema } from '@cashflow/shared';

export const settingsRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.select().from(settings).where(eq(settings.user_id, ctx.user.id));
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }

    return {
      current_cash_balance: parseInt(result.current_cash_balance ?? '0', 10),
      forecast_months: parseInt(result.forecast_months ?? '12', 10),
      currency: result.currency ?? 'USD',
      onboarding_completed: result.onboarding_completed === 'true',
    };
  }),

  update: protectedProcedure
    .input(settingsUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const entries = Object.entries(input).filter(([, v]) => v !== undefined);

      for (const [key, value] of entries) {
        const stringValue = String(value);
        const existing = await ctx.db
          .select()
          .from(settings)
          .where(and(eq(settings.user_id, ctx.user.id), eq(settings.key, key)))
          .then((r) => r[0]);

        if (existing) {
          await ctx.db
            .update(settings)
            .set({ value: stringValue })
            .where(and(eq(settings.user_id, ctx.user.id), eq(settings.key, key)));
        } else {
          await ctx.db.insert(settings).values({ user_id: ctx.user.id, key, value: stringValue });
        }
      }

      // Return updated settings
      const rows = await ctx.db.select().from(settings).where(eq(settings.user_id, ctx.user.id));
      const result: Record<string, string> = {};
      for (const row of rows) {
        result[row.key] = row.value;
      }

      return {
        current_cash_balance: parseInt(result.current_cash_balance ?? '0', 10),
        forecast_months: parseInt(result.forecast_months ?? '12', 10),
        currency: result.currency ?? 'USD',
        onboarding_completed: result.onboarding_completed === 'true',
      };
    }),
});
