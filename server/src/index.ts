import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getCookie } from 'hono/cookie';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from './trpc/router.js';
import { createContext } from './trpc/context.js';
import { runMigrations } from './db/migrate.js';

const app = new Hono();

// CORS for dev (Vite runs on 5173)
app.use(
  '/trpc/*',
  cors({
    origin: ['http://localhost:5174', 'http://localhost:5173', 'http://localhost:3000', 'https://runwaylens-production.up.railway.app'],
    credentials: true,
  })
);

// Mount tRPC — extract session token from Authorization header or cookie
app.use('/trpc/*', async (c) => {
  // Check Authorization header first (Bearer token), fall back to cookie
  const authHeader = c.req.header('authorization');
  let sessionToken: string | undefined;

  if (authHeader?.startsWith('Bearer ')) {
    sessionToken = authHeader.slice(7);
  } else {
    sessionToken = getCookie(c, 'session') ?? undefined;
  }

  const response = await fetchRequestHandler({
    endpoint: '/trpc',
    req: c.req.raw,
    router: appRouter,
    createContext: () => createContext({ sessionToken }),
  });
  return response;
});

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// In production, serve the built client
if (process.env.NODE_ENV === 'production') {
  app.use('/*', serveStatic({ root: './public' }));
  // SPA fallback: serve index.html for non-API routes
  app.get('*', serveStatic({ root: './public', path: 'index.html' }));
}

const port = parseInt(process.env.PORT || '3001', 10);

// Run migrations then start server
async function start() {
  await runMigrations();

  console.log(`\n🚀 RunwayLens API running at http://localhost:${port}`);
  console.log(`   tRPC endpoint: http://localhost:${port}/trpc\n`);

  serve({ fetch: app.fetch, port, hostname: '0.0.0.0' });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
