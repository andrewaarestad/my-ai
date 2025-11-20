import NextAuth from "next-auth";
import type { DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";

// Extend the built-in session type (must match auth.ts)
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface JWT {
    id?: string;
    lastTokenRefresh?: number;
  }
}

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
      clientId: process.env.GOOGLE_CLIENT_ID || "dummy-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy-client-secret",
    }),
  ],
  // Use JWT strategy for Edge runtime compatibility
  session: {
    strategy: "jwt",
  },
  // Must use same secret as main auth config
  secret: process.env.NEXTAUTH_SECRET || "dummy-secret-for-build",
  callbacks: {
    // Minimal JWT callback - just pass through the token
    // The main auth.ts adds user.id, but middleware can read it without this callback
    jwt({ token }) {
      return token;
    },
    // Minimal session callback - just pass through the session
    session({ session, token }) {
      // Add user ID if present in token (set by main auth.ts)
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  // No adapter needed in middleware - JWT sessions don't require DB
  // No events needed - middleware doesn't handle sign-in/sign-out
});

