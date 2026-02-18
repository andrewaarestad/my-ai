import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/environment";

interface GoogleTokenResponse {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  token_type?: string;
  scope?: string;
  id_token?: string;
}

interface GoogleUserInfo {
  id: string; // Google's unique user ID (used as providerAccountId)
  email: string;
  name?: string;
  picture?: string;
}

/**
 * GET /api/auth/link/google/callback
 *
 * Handles the OAuth callback from Google during the account-linking flow.
 * Exchanges the auth code for tokens, then creates an Account row pointing
 * to the user who initiated the link (from the cookie), NOT a new User.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = env.NEXTAUTH_URL;
  const accountsUrl = new URL("/dashboard/accounts", baseUrl);

  // User denied consent
  if (error) {
    accountsUrl.searchParams.set("link_error", "oauth_denied");
    return NextResponse.redirect(accountsUrl.toString());
  }

  if (!code || !state) {
    accountsUrl.searchParams.set("link_error", "missing_params");
    return NextResponse.redirect(accountsUrl.toString());
  }

  // Read and validate the link-mode cookie
  const cookieStore = await cookies();
  const linkCookie = cookieStore.get("authjs.link-mode");

  if (!linkCookie?.value) {
    accountsUrl.searchParams.set("link_error", "expired");
    return NextResponse.redirect(accountsUrl.toString());
  }

  let linkData: { userId: string; state: string; codeVerifier: string };
  try {
    linkData = JSON.parse(linkCookie.value) as typeof linkData;
  } catch {
    accountsUrl.searchParams.set("link_error", "invalid_cookie");
    return NextResponse.redirect(accountsUrl.toString());
  }

  // CSRF verification
  if (state !== linkData.state) {
    accountsUrl.searchParams.set("link_error", "invalid_state");
    return NextResponse.redirect(accountsUrl.toString());
  }

  // Clear the cookie immediately
  cookieStore.delete("authjs.link-mode");

  // Exchange authorization code for tokens
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: `${baseUrl}/api/auth/link/google/callback`,
      code_verifier: linkData.codeVerifier,
    }),
  });

  if (!tokenResponse.ok) {
    accountsUrl.searchParams.set("link_error", "token_exchange");
    return NextResponse.redirect(accountsUrl.toString());
  }

  const tokens = (await tokenResponse.json()) as GoogleTokenResponse;

  // Get the Google user's profile to determine their providerAccountId
  const userinfoResponse = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    { headers: { Authorization: `Bearer ${tokens.access_token}` } }
  );

  if (!userinfoResponse.ok) {
    accountsUrl.searchParams.set("link_error", "userinfo_failed");
    return NextResponse.redirect(accountsUrl.toString());
  }

  const userinfo = (await userinfoResponse.json()) as GoogleUserInfo;
  const providerAccountId = userinfo.id;

  // Check if this Google account is already linked to any user
  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: "google",
        providerAccountId,
      },
    },
  });

  if (existingAccount) {
    if (existingAccount.userId === linkData.userId) {
      // Already linked to this user — just refresh the tokens
      await prisma.account.update({
        where: {
          provider_providerAccountId: {
            provider: "google",
            providerAccountId,
          },
        },
        data: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: Math.floor(Date.now() / 1000) + (tokens.expires_in ?? 3600),
          id_token: tokens.id_token,
          scope: tokens.scope,
        },
      });
      accountsUrl.searchParams.set("linked", "refreshed");
      return NextResponse.redirect(accountsUrl.toString());
    }

    // Linked to a different user — cannot steal it
    accountsUrl.searchParams.set("link_error", "already_linked_other");
    return NextResponse.redirect(accountsUrl.toString());
  }

  // Create new Account row linked to the current user
  await prisma.account.create({
    data: {
      userId: linkData.userId,
      type: "oauth",
      provider: "google",
      providerAccountId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + (tokens.expires_in ?? 3600),
      token_type: tokens.token_type ?? "Bearer",
      scope: tokens.scope,
      id_token: tokens.id_token,
    },
  });

  accountsUrl.searchParams.set("linked", "true");
  return NextResponse.redirect(accountsUrl.toString());
}
