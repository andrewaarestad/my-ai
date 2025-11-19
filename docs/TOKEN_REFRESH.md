# Automatic Token Refresh Implementation

This document explains how automatic OAuth token refresh works in the My AI platform.

## Overview

The platform automatically refreshes expired Google OAuth access tokens using refresh tokens stored in the database. This ensures users don't need to re-authenticate when their access tokens expire.

## How It Works

### 1. Token Storage

When a user signs in with Google:
- Access token and refresh token are stored in the `accounts` table
- `expires_at` field stores the token expiration timestamp (Unix seconds)

### 2. Automatic Refresh

Token refresh happens automatically in two scenarios:

#### A. JWT Callback (Every Request)
- The JWT callback checks token expiration every 5 minutes
- If expired or expiring soon, it refreshes the token
- Refreshed tokens are updated in the database
- Prevents excessive database queries with 5-minute throttling

#### B. Manual Refresh (API Routes)
- Use `getValidAccessToken()` or `refreshUserTokens()` utilities
- Useful when making Google API calls
- Automatically refreshes if expired

### 3. Refresh Process

1. **Check Expiration**: Compare `expires_at` with current time (60-second buffer)
2. **Fetch New Token**: Call Google OAuth token endpoint with refresh token
3. **Update Database**: Save new access token and expiration time
4. **Handle Errors**: Log errors but don't fail the request

## Implementation Details

### Files

- **`apps/web/src/lib/token-refresh.ts`**: Core token refresh logic
- **`apps/web/src/lib/auth.ts`**: NextAuth configuration with JWT callback

### Key Functions

#### `refreshUserTokens(userId, provider)`

Refreshes OAuth tokens for a user if expired.

```typescript
const tokens = await refreshUserTokens(userId, "google");
// Returns: { access_token, expires_at, refresh_token } | null
```

#### `getValidAccessToken(userId, provider)`

Gets a valid access token, refreshing if needed.

```typescript
const token = await getValidAccessToken(userId, "google");
// Returns: string | null
```

### JWT Callback Logic

```typescript
async jwt({ token, user, trigger }) {
  // On sign-in, set user ID
  if (user) {
    token.id = user.id;
    token.lastTokenRefresh = Date.now();
  }

  // Check token refresh every 5 minutes
  if (token.id && (trigger === "update" || enoughTimePassed)) {
    await refreshUserTokens(token.id, "google");
  }
}
```

## Usage Examples

### Example 1: Get Access Token in API Route

```typescript
import { auth } from "@/lib/auth";
import { getValidAccessToken } from "@/lib/token-refresh";

export async function GET(request: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Get valid access token (refreshes if expired)
  const accessToken = await getValidAccessToken(session.user.id, "google");
  
  if (!accessToken) {
    return new Response("Failed to get access token", { status: 500 });
  }

  // Use token for Google API calls
  const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return Response.json(await response.json());
}
```

### Example 2: Manual Token Refresh

```typescript
import { refreshUserTokens } from "@/lib/token-refresh";

// Refresh tokens for a specific user
const tokens = await refreshUserTokens(userId, "google");

if (tokens) {
  console.log("Access token:", tokens.access_token);
  console.log("Expires at:", new Date(tokens.expires_at * 1000));
} else {
  console.error("Failed to refresh tokens");
}
```

### Example 3: Check Token Status

```typescript
import { prisma } from "@/lib/prisma";

const account = await prisma.account.findFirst({
  where: { userId, provider: "google" },
});

if (account) {
  const isExpired = Date.now() >= (account.expires_at || 0) * 1000;
  console.log("Token expired:", isExpired);
  console.log("Expires at:", new Date((account.expires_at || 0) * 1000));
}
```

## Token Expiration

### Google OAuth Tokens

- **Access Token**: Expires in ~1 hour (3600 seconds)
- **Refresh Token**: Does not expire (unless revoked)
- **Buffer**: Tokens are refreshed 60 seconds before expiration

### Expiration Check

```typescript
function isTokenExpired(expiresAt: number | null, bufferSeconds = 60): boolean {
  if (!expiresAt) return true;
  return Date.now() >= (expiresAt - bufferSeconds) * 1000;
}
```

## Error Handling

### Refresh Failures

- Errors are logged but don't fail the request
- Failed refreshes return `null`
- Users may need to re-authenticate if refresh token is invalid

### Common Errors

1. **Invalid Refresh Token**: User needs to re-authenticate
2. **Network Error**: Retry logic can be added
3. **Rate Limiting**: Google may throttle requests

## Performance Considerations

### Throttling

- JWT callback checks every 5 minutes (not every request)
- Prevents excessive database queries
- Manual refresh always checks expiration

### Database Queries

- One query to fetch account
- One query to update account (if refresh needed)
- Cached in JWT to reduce checks

## Testing

### Test Token Refresh

1. **Sign in** with Google
2. **Check database**:
   ```bash
   pnpm db:studio
   ```
3. **Note expiration time** in `accounts.expires_at`
4. **Wait for expiration** or manually expire token
5. **Make a request** (triggers JWT callback)
6. **Check database** - token should be refreshed

### Manual Test

```typescript
// Force refresh by setting old expiration
await prisma.account.update({
  where: { /* ... */ },
  data: { expires_at: Math.floor(Date.now() / 1000) - 3600 },
});

// Trigger refresh
const tokens = await refreshUserTokens(userId, "google");
console.log("Refreshed:", tokens !== null);
```

## Monitoring

### Logs

In development mode, token refresh is logged:
```
Token refresh check completed for user <userId>
Successfully refreshed google token for user <userId>
```

### Database

Check `accounts.updatedAt` to see when tokens were last refreshed.

## Troubleshooting

### Issue: Tokens not refreshing

**Check**:
1. Refresh token exists in database
2. `expires_at` is set correctly
3. JWT callback is being called
4. No errors in console/logs

### Issue: "Failed to refresh token"

**Possible causes**:
- Refresh token revoked by user
- Google OAuth credentials invalid
- Network connectivity issues

**Solution**: User needs to re-authenticate

### Issue: Excessive refresh calls

**Check**: 5-minute throttling is working
**Solution**: Verify `lastTokenRefresh` in JWT is being set

## Future Improvements

- [ ] Add retry logic for network failures
- [ ] Implement token refresh queue for batch operations
- [ ] Add metrics/monitoring for refresh success rate
- [ ] Support for multiple OAuth providers
- [ ] Token refresh webhook/background job

## Resources

- [Google OAuth Token Refresh](https://developers.google.com/identity/protocols/oauth2/web-server#offline)
- [NextAuth.js Callbacks](https://authjs.dev/getting-started/adapters/prisma#callbacks)
- [Prisma Adapter Documentation](https://authjs.dev/getting-started/adapters/prisma)

