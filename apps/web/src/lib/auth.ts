import NextAuth from "next-auth";
import type { DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
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
    accessToken?: string;
    refreshToken?: string;
  }
}

// Configure NextAuth.js with JWT strategy (compatible with Edge runtime)
// Database adapter is added in the API route handler
const { handlers, auth, signIn, signOut } = NextAuth({
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
    // Add user ID to JWT token
    jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
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
