import { z } from 'zod';
import { ENTRY_TYPES, RECURRENCE_INTERVALS } from './constants.js';

// ── Cash Entry ──────────────────────────────────────────────

export const cashEntryCreateSchema = z.object({
  type: z.enum(ENTRY_TYPES),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().int().positive('Amount must be positive (in cents)'),
  is_recurring: z.boolean().default(false),
  recurrence_interval: z.enum(RECURRENCE_INTERVALS).nullable().default(null),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').nullable().default(null),
  growth_rate: z.number().min(-1).max(10).default(0),
  tags: z.array(z.string()).default([]),
});

export const cashEntryUpdateSchema = cashEntryCreateSchema.partial();

export const cashEntrySchema = cashEntryCreateSchema.extend({
  id: z.string(),
  source: z.enum(['manual', 'csv_import']).default('manual'),
  created_at: z.string(),
  updated_at: z.string(),
});

export const cashEntryFilterSchema = z.object({
  type: z.enum(ENTRY_TYPES).optional(),
  category: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

// ── Scenario ────────────────────────────────────────────────

export const scenarioCreateSchema = z.object({
  name: z.string().min(1, 'Scenario name is required'),
  revenue_multiplier: z.number().min(0).max(5).default(1),
  expense_multiplier: z.number().min(0).max(5).default(1),
  is_preset: z.boolean().default(false),
  preset_label: z.string().nullable().default(null),
  preset_description: z.string().nullable().default(null),
});

export const scenarioUpdateSchema = scenarioCreateSchema.partial();

export const scenarioSchema = scenarioCreateSchema.extend({
  id: z.string(),
  is_default: z.boolean(),
  created_at: z.string(),
});

// ── Settings ────────────────────────────────────────────────

export const settingsSchema = z.object({
  current_cash_balance: z.number().int().default(0),
  forecast_months: z.number().int().min(1).max(24).default(12),
  currency: z.string().default('USD'),
  onboarding_completed: z.boolean().default(false),
});

export const settingsUpdateSchema = settingsSchema.partial();

// ── Forecast ────────────────────────────────────────────────

export const forecastRequestSchema = z.object({
  months: z.number().int().min(1).max(24).default(12),
  scenario_ids: z.array(z.string()).optional(),
});

export const monthlyProjectionSchema = z.object({
  month: z.number(),
  month_label: z.string(),
  income: z.number(),
  expenses: z.number(),
  net_cash_flow: z.number(),
  cumulative_balance: z.number(),
  burn_rate: z.number(),
});

export const riskAlertSchema = z.object({
  type: z.enum(['critical', 'warning', 'info', 'healthy']),
  title: z.string(),
  message: z.string(),
  month: z.number().nullable(),
});

export const scenarioForecastSchema = z.object({
  scenario_id: z.string(),
  scenario_name: z.string(),
  projections: z.array(monthlyProjectionSchema),
  runway_months: z.number().nullable(),
  projected_zero_cash_date: z.string().nullable(),
  average_burn_rate: z.number(),
  average_revenue: z.number(),
});

export const forecastResponseSchema = z.object({
  current_cash_balance: z.number(),
  scenarios: z.array(scenarioForecastSchema),
  risk_alerts: z.array(riskAlertSchema),
});
