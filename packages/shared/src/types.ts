import { z } from 'zod';
import type {
  cashEntrySchema,
  cashEntryCreateSchema,
  cashEntryUpdateSchema,
  cashEntryFilterSchema,
  scenarioSchema,
  scenarioCreateSchema,
  scenarioUpdateSchema,
  settingsSchema,
  settingsUpdateSchema,
  forecastRequestSchema,
  monthlyProjectionSchema,
  riskAlertSchema,
  scenarioForecastSchema,
  forecastResponseSchema,
} from './schemas.js';

// ── Cash Entry Types ────────────────────────────────────────

export type CashEntry = z.infer<typeof cashEntrySchema>;
export type CashEntryCreate = z.infer<typeof cashEntryCreateSchema>;
export type CashEntryUpdate = z.infer<typeof cashEntryUpdateSchema>;
export type CashEntryFilter = z.infer<typeof cashEntryFilterSchema>;

// ── Scenario Types ──────────────────────────────────────────

export type Scenario = z.infer<typeof scenarioSchema>;
export type ScenarioCreate = z.infer<typeof scenarioCreateSchema>;
export type ScenarioUpdate = z.infer<typeof scenarioUpdateSchema>;

// ── Settings Types ──────────────────────────────────────────

export type Settings = z.infer<typeof settingsSchema>;
export type SettingsUpdate = z.infer<typeof settingsUpdateSchema>;

// ── Forecast Types ──────────────────────────────────────────

export type ForecastRequest = z.infer<typeof forecastRequestSchema>;
export type MonthlyProjection = z.infer<typeof monthlyProjectionSchema>;
export type RiskAlert = z.infer<typeof riskAlertSchema>;
export type ScenarioForecast = z.infer<typeof scenarioForecastSchema>;
export type ForecastResponse = z.infer<typeof forecastResponseSchema>;
