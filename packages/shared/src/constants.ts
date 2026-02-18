export const ENTRY_TYPES = ['income', 'expense'] as const;
export type EntryType = (typeof ENTRY_TYPES)[number];

export const RECURRENCE_INTERVALS = ['weekly', 'monthly', 'quarterly', 'yearly'] as const;
export type RecurrenceInterval = (typeof RECURRENCE_INTERVALS)[number];

export const INCOME_CATEGORIES = [
  'Revenue',
  'Consulting',
  'Subscriptions',
  'Grants',
  'Investments',
  'Other Income',
] as const;

export const EXPENSE_CATEGORIES = [
  'Payroll',
  'Rent',
  'Utilities',
  'Software',
  'Marketing',
  'Insurance',
  'Equipment',
  'Travel',
  'Professional Services',
  'Supplies',
  'Taxes',
  'Loan Payments',
  'Other Expense',
] as const;

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES] as const;

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
] as const;

export const DEFAULT_SETTINGS = {
  current_cash_balance: 0,
  forecast_months: 12,
  currency: 'USD',
  onboarding_completed: false,
} as const;

export const RISK_THRESHOLDS = {
  /** Runway below this many months triggers high-risk alert */
  LOW_RUNWAY_MONTHS: 6,
  /** Runway below this many months triggers critical alert */
  CRITICAL_RUNWAY_MONTHS: 3,
  /** Balance below this many months of expenses triggers warning */
  LOW_BALANCE_MONTHS: 1,
  /** Burn rate increasing by more than this % MoM for 3 months triggers alert */
  BURN_RATE_INCREASE_THRESHOLD: 0.10,
  /** Single expense exceeding this % of monthly income triggers alert */
  LARGE_EXPENSE_RATIO: 0.50,
  /** Number of consecutive months of burn rate increase to trigger alert */
  CONSECUTIVE_BURN_MONTHS: 3,
} as const;
