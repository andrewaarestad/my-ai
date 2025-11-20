import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Lightweight NextAuth configuration for middleware
 * 
 * This version doesn't import Prisma or other heavy dependencies,
 * making it suitable for Edge runtime (Vercel middleware).
 * 
 * Since we use JWT sessions, middleware only needs to verify the JWT token,
 * which doesn't require database access.
 * 
 * IMPORTANT: This must use the same secret and JWT configuration as the
 * main auth config in auth.ts to ensure JWT tokens are compatible.
 */
export const { auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  // Use JWT strategy for Edge runtime compatibility
  session: {
    strategy: "jwt",
  },
  // Must use same secret as main auth config
  secret: process.env.NEXTAUTH_SECRET,
  // No adapter needed in middleware - JWT sessions don't require DB
  // No callbacks needed - just verifying JWT token
  // No events needed - middleware doesn't handle sign-in/sign-out
});

