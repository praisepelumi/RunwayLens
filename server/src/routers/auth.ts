import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc/init.js';
import { handleGoogleLogin, deleteSession } from '../auth/google.js';

export const authRouter = router({
  /** Verify Google ID token, create session, return user */
  googleLogin: publicProcedure
    .input(z.object({ idToken: z.string() }))
    .mutation(async ({ input }) => {
      const { sessionToken, user } = await handleGoogleLogin(input.idToken);
      return { sessionToken, user };
    }),

  /** Get current authenticated user (or null) */
  me: publicProcedure.query(async ({ ctx }) => {
    return ctx.user ?? null;
  }),

  /** Logout: delete session */
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.sessionToken) {
      await deleteSession(ctx.sessionToken);
    }
    return { success: true };
  }),
});
