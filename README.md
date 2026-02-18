# RunwayLens

A cash flow forecasting tool for startups. Input your income and expenses, and instantly see your cash runway, burn rate, and financial health across multiple scenarios.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_18-61DAFB?logo=react&logoColor=black)
![Hono](https://img.shields.io/badge/Hono-E36002?logo=hono&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![tRPC](https://img.shields.io/badge/tRPC-2596BE?logo=trpc&logoColor=white)

## Features

- **Dashboard** — KPI cards (live cash balance, monthly burn, average revenue, net cash flow), runway countdown with projected zero-cash date, and risk alerts
- **Cash Projection Chart** — Multi-line chart comparing optimistic, expected, and pessimistic scenarios side by side
- **Income & Expense Tracking** — Full CRUD with support for recurring entries (weekly, monthly, quarterly, yearly) and growth rates
- **Scenario Analysis** — Three default scenarios (optimistic, expected, pessimistic) plus custom scenarios with adjustable revenue/expense multipliers
- **What-If Toggles** — Preset scenarios like "Hire Employee", "Lose Major Client", and "Growth Scenario" for quick modeling
- **CSV Import** — Drag-and-drop bank statement import with auto-delimiter detection, column mapping, and preview
- **Risk Alerts** — Automatic warnings for low runway, depleting cash reserves, accelerating burn rate, and large expenses
- **Google SSO** — Secure authentication with multi-user data isolation
- **Dark Mode** — Full dark/light theme support
- **Onboarding Wizard** — Guided setup for new users with a quick runway calculator

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS v4, shadcn/ui |
| API | tRPC v11 over Hono (end-to-end type safety) |
| Database | PostgreSQL (Neon) with Drizzle ORM |
| Charts | Recharts via shadcn/ui chart components |
| Auth | Google Identity Services + server-side sessions |
| Validation | Zod (shared across client, server, and DB) |
| Monorepo | pnpm workspaces |

## Architecture

```
cashflow-forecaster/
├── packages/shared/       # Zod schemas, types, forecasting engine
├── server/                # Hono + tRPC API, Drizzle ORM, auth
├── client/                # React SPA, shadcn/ui components
├── Dockerfile             # Production build
└── pnpm-workspace.yaml
```

**Key design decisions:**

- **tRPC instead of REST** — Eliminates route files, controllers, and API client wrappers. One schema change propagates from DB to UI at compile time.
- **Integer cents for money** — All monetary values stored as integers (e.g., $45.99 = 4599) to avoid floating-point rounding errors. Display divides by 100.
- **Shared forecasting engine** — The core forecast algorithm is a pure function in the shared package, used by both server (authoritative) and client (instant preview).
- **Session-based auth** — Lean Google SSO (~150 lines, no auth library). Server verifies Google ID tokens, creates sessions with 30-day expiry, all data scoped by user ID.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- A [Neon](https://neon.tech) PostgreSQL database (free tier)
- A [Google Cloud](https://console.cloud.google.com) OAuth 2.0 Client ID

### Setup

1. **Clone the repo**

   ```bash
   git clone https://github.com/yourusername/cashflow-forecaster.git
   cd cashflow-forecaster
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Fill in your values:

   ```env
   DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   PORT=3001
   ```

4. **Run database migrations and seed**

   ```bash
   pnpm --filter server db:migrate
   pnpm --filter server db:seed
   ```

5. **Start development**

   ```bash
   pnpm dev
   ```

   This starts both the server (port 3001) and client (port 5174) concurrently.

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create an OAuth 2.0 Client ID (Web application)
3. Add authorized JavaScript origins:
   - `http://localhost:5174` (development)
   - Your production URL (after deploying)
4. Copy the Client ID to both `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID` in `.env`

## Deployment (Railway)

The app includes a production `Dockerfile` that builds the client, copies it to the server for static serving, and runs everything on a single port.

1. Push your repo to GitHub
2. Create a new project on [Railway](https://railway.app)
3. Connect your GitHub repo
4. Add environment variables in Railway dashboard:
   - `DATABASE_URL` — Your Neon connection string
   - `GOOGLE_CLIENT_ID` — Your Google OAuth Client ID
   - `VITE_GOOGLE_CLIENT_ID` — Same as above
   - `PORT` — Railway sets this automatically
   - `NODE_ENV` — `production`
5. Railway will auto-detect the Dockerfile and deploy

Don't forget to add your Railway production URL to Google OAuth authorized origins.

## Forecasting Algorithm

For each month in the forecast range:

1. Sum all active income entries (applying recurrence schedules, cumulative growth rates, and scenario revenue multiplier)
2. Sum all active expense entries (same, with expense multiplier)
3. Calculate net cash flow and cumulative balance
4. Burn rate = expenses - income

**Runway** = first month where cumulative balance drops below zero.

**Risk alerts** trigger when:
- Cash runs out within the forecast period
- Balance drops below 1 month of expenses
- Burn rate increases >10% month-over-month for 3 consecutive months
- A single expense exceeds 50% of average monthly income

## License

MIT
