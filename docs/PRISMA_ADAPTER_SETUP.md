# Prisma Adapter Setup for NextAuth

This document explains how NextAuth is configured to use the Prisma adapter for storing OAuth tokens in the database.

## Overview

NextAuth is now configured to use the **Prisma adapter**, which automatically stores OAuth tokens (access tokens, refresh tokens, etc.) in the database instead of only in JWT cookies.

## What Changed

### 1. Created Prisma Client Instance

**File**: `apps/web/src/lib/prisma.ts`

- Singleton pattern for Prisma Client
- Prevents multiple instances in development (hot reload)
- Properly configured logging

### 2. Updated NextAuth Configuration

**File**: `apps/web/src/lib/auth.ts`

**Changes**:
- ✅ Added `PrismaAdapter` import from `@auth/prisma-adapter`
- ✅ Added `prisma` import from `./prisma`
- ✅ Added `adapter: PrismaAdapter(prisma)` to NextAuth config
- ✅ Simplified JWT callbacks (tokens now stored in DB automatically)
- ✅ Removed manual token storage from JWT (handled by adapter)

## How It Works

### Token Storage Flow

1. **User signs in with Google**
   - NextAuth handles OAuth flow
   - Prisma adapter automatically stores tokens in `accounts` table

2. **What Gets Stored in Database**

   **`accounts` table**:
   - `access_token` - Google OAuth access token
   - `refresh_token` - Google OAuth refresh token
   - `expires_at` - Token expiration timestamp
   - `token_type` - Usually "Bearer"
   - `scope` - Granted OAuth scopes
   - `id_token` - OpenID Connect ID token
   - `provider` - "google"
   - `providerAccountId` - Google user ID
   - `userId` - Reference to user in `users` table

   **`users` table**:
   - User profile information (name, email, image)
   - Created/updated timestamps

3. **Sessions**
   - Still using JWT strategy (Edge runtime compatible)
   - Session tokens stored in cookies (not database)
   - User ID included in JWT for quick access

### Benefits

✅ **Persistent Token Storage**: Tokens survive server restarts  
✅ **Token Refresh Ready**: Refresh tokens stored for automatic renewal  
✅ **Multi-Account Support**: Can link multiple OAuth accounts per user  
✅ **Audit Trail**: All OAuth connections tracked in database  
✅ **Secure**: Tokens stored server-side, not exposed in cookies  

## Database Schema

The Prisma adapter uses these tables:

### `users`
- User accounts
- One record per user

### `accounts`
- OAuth provider accounts
- Stores all OAuth tokens
- Links to `users` via `userId`
- Composite key: `[provider, providerAccountId]`

### `sessions`
- Currently unused (using JWT sessions)
- Available if switching to database sessions

### `verification_tokens`
- Email verification tokens
- Used for email-based auth flows

## Verifying Setup

### 1. Check Database Tables

```bash
# Open Prisma Studio
pnpm db:studio
```

Navigate to `accounts` table - you should see OAuth tokens after signing in.

### 2. Test Sign-In

1. Start dev server: `pnpm dev`
2. Sign in with Google
3. Check database:
   ```bash
   pnpm db:studio
   ```
4. Verify:
   - `users` table has your user record
   - `accounts` table has Google OAuth tokens

### 3. Query Tokens Programmatically

```typescript
import { prisma } from "@/lib/prisma";

// Get user's Google account tokens
const account = await prisma.account.findFirst({
  where: {
    userId: "user-id",
    provider: "google",
  },
});

console.log({
  accessToken: account?.access_token,
  refreshToken: account?.refresh_token,
  expiresAt: account?.expires_at,
});
```

## Token Refresh

The Prisma adapter stores refresh tokens, but **automatic token refresh is not yet implemented**. 

To implement token refresh:

1. Check if access token is expired (`expires_at`)
2. Use `refresh_token` to get new access token from Google
3. Update `accounts` table with new tokens

See: [NextAuth Token Refresh Documentation](https://authjs.dev/getting-started/adapters/prisma#token-refresh)

## Troubleshooting

### Issue: "PrismaClient is not defined"

**Solution**: Make sure Prisma client is generated:
```bash
pnpm db:generate
```

### Issue: Tokens not appearing in database

**Check**:
1. Verify adapter is configured: `adapter: PrismaAdapter(prisma)`
2. Check database connection: `pnpm db:studio`
3. Verify user signed in successfully
4. Check browser console for errors

### Issue: "Cannot find module './prisma'"

**Solution**: Make sure `apps/web/src/lib/prisma.ts` exists and exports `prisma`

## Next Steps

- [x] Implement automatic token refresh (Done in `token-refresh.ts`)
- [x] Add token expiration checking (Done in `isTokenExpired()`)
- [x] Create utility functions to access tokens (Done: `getValidAccessToken`, `refreshUserTokens`)
- [ ] Consider switching to database sessions (if Edge runtime not needed)

## Resources

- [NextAuth Prisma Adapter Docs](https://authjs.dev/getting-started/adapters/prisma)
- [Prisma Client Documentation](https://www.prisma.io/docs/concepts/components/prisma-client)
- [NextAuth v5 Documentation](https://authjs.dev/)

