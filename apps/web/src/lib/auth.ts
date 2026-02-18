import NextAuth from "next-auth";
import type { DefaultSession, Session } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { refreshUserTokens } from "./token-refresh";
import { logInfo } from "./error-logger";
import { env } from "./environment";

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

// Lazy singleton — NextAuth is initialized on first use, not at import time.
// This ensures env vars are read at runtime (when they exist), not during
// `next build` (when they don't).
let _nextAuth: ReturnType<typeof NextAuth> | null = null;

function getNextAuth() {
  if (!_nextAuth) {
    _nextAuth = NextAuth({
      adapter: PrismaAdapter(prisma),
      secret: env.NEXTAUTH_SECRET,
      providers: [
        Google({
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          // Safe for Google since emails are verified — allows signing in with
          // a Google account whose email matches an existing user to auto-link
          // instead of throwing OAuthAccountNotLinked error.
          allowDangerousEmailAccountLinking: true,
          authorization: {
            params: {
              access_type: "offline",
              prompt: "consent",
              scope: [
                "openid",
                "https://www.googleapis.com/auth/userinfo.email",
                "https://www.googleapis.com/auth/userinfo.profile",
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
      session: {
        strategy: "jwt",
      },
      cookies: {
        pkceCodeVerifier: {
          name: `authjs.pkce.code_verifier`,
          options: {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: env.isSecure,
          },
        },
        state: {
          name: `authjs.state`,
          options: {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: env.isSecure,
          },
        },
        callbackUrl: {
          name: `authjs.callback_url`,
          options: {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: env.isSecure,
          },
        },
        sessionToken: {
          name: `${env.isSecure ? "__Secure-" : ""}authjs.session-token`,
          options: {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: env.isSecure,
          },
        },
      },
      callbacks: {
        async jwt({ token, user, trigger }) {
          if (user) {
            token.id = user.id;
            token.lastTokenRefresh = Date.now();
          }

          if (token.id) {
            const now = Date.now();
            const lastRefresh = (token.lastTokenRefresh as number | undefined) ?? 0;
            const fiveMinutes = 5 * 60 * 1000;

            if (trigger === "update" || (now - lastRefresh) >= fiveMinutes) {
              try {
                if (typeof token.id === "string") {
                  try {
                    const refreshed = await refreshUserTokens(token.id, "google");
                    if (refreshed) {
                      token.lastTokenRefresh = now;
                      if (env.isDevelopment) {
                        await logInfo("Token refresh check completed", {
                          userId: token.id,
                        });
                      }
                    }
                  } catch (error) {
                    if (env.isDevelopment) {
                      await logInfo("Error refreshing tokens in JWT callback", {
                        userId: token.id,
                        error: error instanceof Error ? error.message : String(error),
                      });
                    }
                  }
                }
              } catch (error) {
                console.error("Error in token refresh check:", error);
              }
            }
          }

          return token;
        },
        session({ session, token }) {
          if (session.user && token.id) {
            session.user.id = token.id as string;
          }
          return session;
        },
      },
      events: {
        async signIn({ user, account }) {
          if (env.isDevelopment) {
            await logInfo("User signed in successfully", {
              userId: user.id,
              email: user.email || undefined,
              provider: account?.provider,
            });
          }
        },
        async signOut() {
          if (env.isDevelopment) {
            await logInfo("User signed out");
          }
        },
      },
      debug: env.isDevelopment,
    });
  }
  return _nextAuth;
}

// Lazy wrappers that forward to the singleton on first call.
// NextAuth's return types aren't fully exported, so we use `any` for the proxy layer.
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
type AnyFunction = (...args: any[]) => any;

export const handlers = {
  GET: ((...args: any[]) => (getNextAuth().handlers.GET as AnyFunction)(...args)) as AnyFunction,
  POST: ((...args: any[]) => (getNextAuth().handlers.POST as AnyFunction)(...args)) as AnyFunction,
};

export const auth = ((...args: any[]) =>
  (getNextAuth().auth as AnyFunction)(...args)) as (...args: any[]) => Promise<Session | null>;

export const signIn = ((...args: any[]) =>
  (getNextAuth().signIn as AnyFunction)(...args)) as AnyFunction;

export const signOut = ((...args: any[]) =>
  (getNextAuth().signOut as AnyFunction)(...args)) as AnyFunction;
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
