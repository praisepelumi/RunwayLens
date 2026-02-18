import { z } from 'zod';
import { router, protectedProcedure } from '../trpc/init.js';
import { scenarios } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { ulid } from 'ulid';
import { scenarioCreateSchema, scenarioUpdateSchema } from '@cashflow/shared';
import { TRPCError } from '@trpc/server';

export const scenariosRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(scenarios).where(eq(scenarios.user_id, ctx.user.id));
  }),

  create: protectedProcedure
    .input(scenarioCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      const id = ulid();

      await ctx.db.insert(scenarios).values({
        id,
        user_id: ctx.user.id,
        ...input,
        is_default: false,
        is_preset: input.is_preset ?? false,
        preset_label: input.preset_label ?? null,
        preset_description: input.preset_description ?? null,
        created_at: now,
      });

      const [scenario] = await ctx.db.select().from(scenarios).where(eq(scenarios.id, id));
      return scenario;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: scenarioUpdateSchema }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db.select().from(scenarios)
        .where(and(eq(scenarios.id, input.id), eq(scenarios.user_id, ctx.user.id)));

      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Scenario not found' });

      await ctx.db.update(scenarios).set(input.data)
        .where(and(eq(scenarios.id, input.id), eq(scenarios.user_id, ctx.user.id)));

      const [updated] = await ctx.db.select().from(scenarios).where(eq(scenarios.id, input.id));
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db.select().from(scenarios)
        .where(and(eq(scenarios.id, input.id), eq(scenarios.user_id, ctx.user.id)));

      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Scenario not found' });
      if (existing.is_default) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot delete default scenarios' });
      }

      await ctx.db.delete(scenarios)
        .where(and(eq(scenarios.id, input.id), eq(scenarios.user_id, ctx.user.id)));
      return { success: true };
    }),
});
