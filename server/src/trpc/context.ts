import { db } from '../db/connection.js';
import { validateSession } from '../auth/google.js';

export interface User {
  id: string;
  email: string;
  name: string;
  picture: string | null;
}

export async function createContext(opts: { sessionToken?: string }) {
  let user: User | null = null;

  if (opts.sessionToken) {
    user = await validateSession(opts.sessionToken);
  }

  return { db, user, sessionToken: opts.sessionToken ?? null };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
