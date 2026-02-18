import { pgTable, text, integer, real, boolean, primaryKey } from 'drizzle-orm/pg-core';

// ── Users (from Google SSO) ──

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  picture: text('picture'),
  created_at: text('created_at').notNull(),
});

// ── Sessions ──

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires_at: text('expires_at').notNull(),
  created_at: text('created_at').notNull(),
});

// ── Cash Entries ──

export const cashEntries = pgTable('cash_entries', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  amount: integer('amount').notNull(),
  is_recurring: boolean('is_recurring').notNull().default(false),
  recurrence_interval: text('recurrence_interval'),
  start_date: text('start_date').notNull(),
  end_date: text('end_date'),
  growth_rate: real('growth_rate').notNull().default(0),
  source: text('source').notNull().default('manual'),
  tags: text('tags').notNull().default('[]'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

// ── Scenarios ──

export const scenarios = pgTable('scenarios', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  revenue_multiplier: real('revenue_multiplier').notNull().default(1),
  expense_multiplier: real('expense_multiplier').notNull().default(1),
  is_default: boolean('is_default').notNull().default(false),
  is_preset: boolean('is_preset').notNull().default(false),
  preset_label: text('preset_label'),
  preset_description: text('preset_description'),
  created_at: text('created_at').notNull(),
});

// ── Settings (per-user key-value) ──

export const settings = pgTable('settings', {
  user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  value: text('value').notNull(),
}, (table) => [
  primaryKey({ columns: [table.user_id, table.key] }),
]);
