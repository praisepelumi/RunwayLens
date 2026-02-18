import { router } from './init.js';
import { authRouter } from '../routers/auth.js';
import { entriesRouter } from '../routers/entries.js';
import { scenariosRouter } from '../routers/scenarios.js';
import { forecastRouter } from '../routers/forecast.js';
import { settingsRouter } from '../routers/settings.js';

export const appRouter = router({
  auth: authRouter,
  entries: entriesRouter,
  scenarios: scenariosRouter,
  forecast: forecastRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
