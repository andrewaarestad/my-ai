import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";

// Extend the built-in session type
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

// Global PrismaClient instance to avoid creating multiple connections
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const { handlers, auth, signIn, signOut } = NextAuth({
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
  },
  callbacks: {
    // Add user ID to session
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
    // Control who can sign in
    async signIn({ user, account, profile }) {
      // You can add custom logic here to restrict who can sign in
      // For example, check if email domain is allowed
      return true;
    },
  },
  events: {
    async createUser({ user }) {
      // This event fires when a new user signs in for the first time
      console.log(`New user created: ${user.email}`);
    },
  },
  debug: process.env.NODE_ENV === "development",
});
