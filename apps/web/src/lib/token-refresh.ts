import { prisma } from "./prisma";

/**
 * Refresh a Google OAuth access token using the refresh token
 *
 * @param refreshToken - The refresh token from the database
 * @returns New access token, refresh token (if rotated), and expiration time
 */
async function refreshGoogleToken(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to refresh token: ${response.status} ${response.statusText}. ${JSON.stringify(error)}`
    );
  }

  const tokens = await response.json();

  return {
    access_token: tokens.access_token,
    expires_at: Math.floor(Date.now() / 1000) + (tokens.expires_in || 3600),
    refresh_token: tokens.refresh_token || refreshToken, // Google may not return refresh_token if unchanged
    expires_in: tokens.expires_in || 3600,
  };
}

/**
 * Check if a token is expired or will expire soon
 *
 * @param expiresAt - Unix timestamp in seconds
 * @param bufferSeconds - Buffer time in seconds before considering token expired (default: 60)
 * @returns true if token is expired or will expire soon
 */
function isTokenExpired(expiresAt: number | null, bufferSeconds = 60): boolean {
  if (!expiresAt) return true;
  // Add buffer to refresh before actual expiration
  return Date.now() >= (expiresAt - bufferSeconds) * 1000;
}

/**
 * Get a valid access token for a user, refreshing if expired
 *
 * @param userId - User ID to get tokens for
 * @param provider - OAuth provider (default: "google")
 * @returns Valid access token, or null if unavailable
 */
export async function getValidAccessToken(
  userId: string,
  provider = "google"
): Promise<string | null> {
  const tokens = await refreshUserTokens(userId, provider);
  return tokens?.access_token || null;
}

/**
 * Refresh Google OAuth tokens for a user if expired
 *
 * @param userId - User ID to refresh tokens for
 * @param provider - OAuth provider (default: "google")
 * @returns Updated account with fresh tokens, or null if refresh failed/not needed
 */
export async function refreshUserTokens(
  userId: string,
  provider = "google"
): Promise<{
  access_token: string;
  expires_at: number;
  refresh_token: string;
} | null> {
  try {
    // Find the user's account
    const account = await prisma.account.findFirst({
      where: {
        userId,
        provider,
      },
    });

    if (!account) {
      console.warn(`No ${provider} account found for user ${userId}`);
      return null;
    }

    if (!account.refresh_token) {
      console.warn(`No refresh token found for user ${userId}`);
      return null;
    }

    // Check if token needs refreshing
    if (!isTokenExpired(account.expires_at)) {
      // Token is still valid
      return {
        access_token: account.access_token || "",
        expires_at: account.expires_at || 0,
        refresh_token: account.refresh_token,
      };
    }

    // Token is expired, refresh it
    console.log(`Refreshing ${provider} token for user ${userId}`);

    const newTokens = await refreshGoogleToken(account.refresh_token);

    // Update account in database
    await prisma.account.update({
      where: {
        provider_providerAccountId: {
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        },
      },
      data: {
        access_token: newTokens.access_token,
        expires_at: newTokens.expires_at,
        refresh_token: newTokens.refresh_token,
        updatedAt: new Date(),
      },
    });

    console.log(`Successfully refreshed ${provider} token for user ${userId}`);

    return {
      access_token: newTokens.access_token,
      expires_at: newTokens.expires_at,
      refresh_token: newTokens.refresh_token,
    };
  } catch (error) {
    console.error(`Error refreshing ${provider} token for user ${userId}:`, error);
    return null;
  }
}

