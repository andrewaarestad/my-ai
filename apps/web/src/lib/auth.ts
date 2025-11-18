import NextAuth from "next-auth";
import type { DefaultSession } from "next-auth";
import Google from "next-auth/providers/google"
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@db";
import { logInfo } from "./error-logger";
import { isDevelopment } from "./env";

// Extend the built-in session type
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

// Configure NextAuth.js with Drizzle adapter
const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
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
  callbacks: {
    // Add user ID to session
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
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
