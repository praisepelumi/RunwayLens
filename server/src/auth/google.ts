import { OAuth2Client } from 'google-auth-library';
import { db } from '../db/connection.js';
import { users, sessions } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import { seedUserData } from '../db/seed.js';
import crypto from 'crypto';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Verify a Google ID token and return/create the user.
 * Returns a session token (random string) set as an HttpOnly cookie.
 */
export async function handleGoogleLogin(idToken: string): Promise<{
  sessionToken: string;
  user: { id: string; email: string; name: string; picture: string | null };
}> {
  // 1. Verify the token with Google
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error('Invalid Google token');
  }

  const { email, name, picture, sub: googleId } = payload;
  const now = new Date().toISOString();

  // 2. Find or create user
  let user = await db.select().from(users).where(eq(users.email, email)).then((r) => r[0]);

  if (!user) {
    const userId = ulid();
    await db.insert(users).values({
      id: userId,
      email,
      name: name ?? email,
      picture: picture ?? null,
      created_at: now,
    });
    user = { id: userId, email, name: name ?? email, picture: picture ?? null, created_at: now };

    // Seed default data for new user
    await seedUserData(userId);
  }

  // 3. Create session
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  await db.insert(sessions).values({
    id: sessionToken,
    user_id: user.id,
    expires_at: expiresAt,
    created_at: now,
  });

  return {
    sessionToken,
    user: { id: user.id, email: user.email, name: user.name, picture: user.picture },
  };
}

/**
 * Validate a session token. Returns the user or null if invalid/expired.
 */
export async function validateSession(sessionToken: string): Promise<{
  id: string;
  email: string;
  name: string;
  picture: string | null;
} | null> {
  const session = await db.select().from(sessions).where(eq(sessions.id, sessionToken)).then((r) => r[0]);

  if (!session) return null;

  // Check expiry
  if (new Date(session.expires_at) < new Date()) {
    await db.delete(sessions).where(eq(sessions.id, sessionToken));
    return null;
  }

  const user = await db.select().from(users).where(eq(users.id, session.user_id)).then((r) => r[0]);
  if (!user) return null;

  return { id: user.id, email: user.email, name: user.name, picture: user.picture };
}

/**
 * Delete a session (logout).
 */
export async function deleteSession(sessionToken: string) {
  await db.delete(sessions).where(eq(sessions.id, sessionToken));
}
