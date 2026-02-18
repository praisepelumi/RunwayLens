import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc/init.js';
import { cashEntries } from '../db/schema.js';
import { eq, and, gte, lte } from 'drizzle-orm';
import { ulid } from 'ulid';
import { cashEntryCreateSchema, cashEntryUpdateSchema, cashEntryFilterSchema } from '@cashflow/shared';
import { parseCSV } from '../lib/csv-parser.js';

export const entriesRouter = router({
  list: protectedProcedure
    .input(cashEntryFilterSchema.optional())
    .query(async ({ ctx, input }) => {
      const conditions = [eq(cashEntries.user_id, ctx.user.id)];
      if (input?.type) conditions.push(eq(cashEntries.type, input.type));
      if (input?.category) conditions.push(eq(cashEntries.category, input.category));
      if (input?.start_date) conditions.push(gte(cashEntries.start_date, input.start_date));
      if (input?.end_date) conditions.push(lte(cashEntries.start_date, input.end_date));

      return ctx.db.select().from(cashEntries).where(and(...conditions));
    }),

  create: protectedProcedure
    .input(cashEntryCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      const id = ulid();

      await ctx.db.insert(cashEntries).values({
        id,
        user_id: ctx.user.id,
        ...input,
        is_recurring: input.is_recurring ?? false,
        recurrence_interval: input.recurrence_interval ?? null,
        end_date: input.end_date ?? null,
        growth_rate: input.growth_rate ?? 0,
        tags: JSON.stringify(input.tags ?? []),
        source: 'manual',
        created_at: now,
        updated_at: now,
      });

      const [entry] = await ctx.db.select().from(cashEntries).where(eq(cashEntries.id, id));
      return entry;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: cashEntryUpdateSchema }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      const updateData: Record<string, unknown> = { ...input.data, updated_at: now };
      if (input.data.tags) updateData.tags = JSON.stringify(input.data.tags);

      await ctx.db.update(cashEntries).set(updateData)
        .where(and(eq(cashEntries.id, input.id), eq(cashEntries.user_id, ctx.user.id)));

      const [entry] = await ctx.db.select().from(cashEntries).where(eq(cashEntries.id, input.id));
      return entry;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(cashEntries)
        .where(and(eq(cashEntries.id, input.id), eq(cashEntries.user_id, ctx.user.id)));
      return { success: true };
    }),

  bulkCreate: protectedProcedure
    .input(z.object({ entries: z.array(cashEntryCreateSchema) }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      const ids: string[] = [];

      for (const entry of input.entries) {
        const id = ulid();
        await ctx.db.insert(cashEntries).values({
          id,
          user_id: ctx.user.id,
          ...entry,
          is_recurring: entry.is_recurring ?? false,
          recurrence_interval: entry.recurrence_interval ?? null,
          end_date: entry.end_date ?? null,
          growth_rate: entry.growth_rate ?? 0,
          tags: JSON.stringify(entry.tags ?? []),
          source: 'csv_import',
          created_at: now,
          updated_at: now,
        });
        ids.push(id);
      }

      return { count: ids.length, ids };
    }),

  parseCSV: protectedProcedure
    .input(z.object({ csvText: z.string() }))
    .mutation(async ({ input }) => {
      const result = parseCSV(input.csvText);
      return {
        headers: result.headers,
        rows: result.rows.slice(0, 500),
        totalRows: result.rows.length,
        suggestedMapping: result.suggestedMapping,
        delimiter: result.delimiter,
      };
    }),
});
