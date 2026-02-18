import { db } from './connection.js';
import { scenarios, settings } from './schema.js';
import { ulid } from 'ulid';
import { eq, and } from 'drizzle-orm';

/**
 * Seed default data for a new user (called on first login).
 */
export async function seedUserData(userId: string) {
  const now = new Date().toISOString();

  // Check if user already has scenarios
  const existing = await db.select().from(scenarios).where(eq(scenarios.user_id, userId));
  if (existing.length > 0) return;

  // Seed default scenarios
  await db.insert(scenarios).values([
    {
      id: ulid(),
      user_id: userId,
      name: 'Optimistic',
      revenue_multiplier: 1.2,
      expense_multiplier: 0.95,
      is_default: true,
      is_preset: false,
      created_at: now,
    },
    {
      id: ulid(),
      user_id: userId,
      name: 'Expected',
      revenue_multiplier: 1.0,
      expense_multiplier: 1.0,
      is_default: true,
      is_preset: false,
      created_at: now,
    },
    {
      id: ulid(),
      user_id: userId,
      name: 'Pessimistic',
      revenue_multiplier: 0.8,
      expense_multiplier: 1.1,
      is_default: true,
      is_preset: false,
      created_at: now,
    },
    {
      id: ulid(),
      user_id: userId,
      name: 'Hire Employee',
      revenue_multiplier: 1.0,
      expense_multiplier: 1.15,
      is_default: false,
      is_preset: true,
      preset_label: 'Hire Employee',
      preset_description: 'Adds ~15% to monthly expenses (salary, benefits, equipment)',
      created_at: now,
    },
    {
      id: ulid(),
      user_id: userId,
      name: 'Lose Major Client',
      revenue_multiplier: 0.7,
      expense_multiplier: 1.0,
      is_default: false,
      is_preset: true,
      preset_label: 'Lose Major Client',
      preset_description: 'Revenue drops by 30% — simulates losing your biggest account',
      created_at: now,
    },
    {
      id: ulid(),
      user_id: userId,
      name: 'Growth Scenario',
      revenue_multiplier: 1.5,
      expense_multiplier: 1.2,
      is_default: false,
      is_preset: true,
      preset_label: 'Growth Scenario',
      preset_description: 'Revenue increases 50% with 20% higher expenses from scaling',
      created_at: now,
    },
  ]);

  // Seed default settings
  await db.insert(settings).values([
    { user_id: userId, key: 'current_cash_balance', value: '0' },
    { user_id: userId, key: 'forecast_months', value: '12' },
    { user_id: userId, key: 'currency', value: 'USD' },
    { user_id: userId, key: 'onboarding_completed', value: 'false' },
  ]);

  console.log(`✓ Seeded default data for user ${userId}`);
}
