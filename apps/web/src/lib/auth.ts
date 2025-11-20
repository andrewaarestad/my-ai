import NextAuth from "next-auth";
import type { DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { refreshUserTokens } from "./token-refresh";
import { logInfo } from "./error-logger";
import { isDevelopment } from "./env";

// Extend the built-in session type
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface JWT {
    id?: string;
    lastTokenRefresh?: number; // Timestamp of last token refresh check
  }
}

// Configure NextAuth.js with Prisma adapter for storing OAuth tokens
// Using JWT strategy for sessions (compatible with Edge runtime)
// OAuth tokens are stored in database via Prisma adapter
const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          // Request offline access to get refresh token
          access_type: "offline",
          // Force consent screen to ensure we get refresh token
          prompt: "consent",
          // Basic scopes for user identity
          scope: [
            "openid",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
            // Add Google service scopes here for data access
            "https://www.googleapis.com/auth/calendar.readonly",
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/drive.readonly",
          ].join(" "),
        },
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  // Use JWT strategy for Edge runtime compatibility
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // Add user ID to JWT token and refresh OAuth tokens if expired
    // JWT callback refreshes OAuth tokens stored in database by Prisma adapter
    async jwt({ token, user, trigger }) {
      // On initial sign-in, set user ID
      if (user) {
        token.id = user.id;
        token.lastTokenRefresh = Date.now();
      }

      // Refresh tokens if user ID exists and enough time has passed since last check
      // Check every 5 minutes to avoid excessive database queries
      if (token.id) {
        const now = Date.now();
        const lastRefresh = (token.lastTokenRefresh as number | undefined) ?? 0;
        const fiveMinutes = 5 * 60 * 1000;

        // Only check token refresh if:
        // 1. It's been 5+ minutes since last check, OR
        // 2. Session is being updated (trigger === "update")
        if (trigger === "update" || (now - lastRefresh) >= fiveMinutes) {
          try {
            if (typeof token.id === "string") {
              try {
                const refreshed = await refreshUserTokens(token.id, "google");
                if (refreshed) {
                  token.lastTokenRefresh = now;
                  if (isDevelopment()) {
                    await logInfo("Token refresh check completed", {
                      userId: token.id,
                    });
                  }
                }
              } catch (error) {
                // Log error but don't fail the request
                if (isDevelopment()) {
                  await logInfo("Error refreshing tokens in JWT callback", {
                    userId: token.id,
                    error: error instanceof Error ? error.message : String(error),
                  });
                }
              }
            }
          } catch (error) {
            // Log error but don't fail the request
            console.error("Error in token refresh check:", error);
          }
        }
      }

      return token;
    },
    // Add user ID to session from JWT
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      // Log successful sign-ins in development/preview for debugging
      if (isDevelopment()) {
        await logInfo("User signed in successfully", {
          userId: user.id,
          email: user.email || undefined,
          provider: account?.provider,
        });
      }
    },
    async signOut() {
      // Log sign-outs in development for debugging
      if (isDevelopment()) {
        await logInfo("User signed out");
      }
    },
  },
  debug: process.env.NODE_ENV === "development",
});

// Export individual functions to avoid TS2742 error with declaration generation
export { handlers, auth, signIn, signOut };
