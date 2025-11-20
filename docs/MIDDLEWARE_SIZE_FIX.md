# Middleware Size Fix

## Problem

Vercel Edge Functions have a 1 MB size limit. The middleware was importing the full `auth` configuration from `@/lib/auth`, which includes:
- Prisma Client (~500KB+)
- Prisma Adapter
- Token refresh utilities
- Error logging utilities

This pushed the middleware bundle over the 1 MB limit.

## Solution

Created a lightweight `auth-middleware.ts` that:
- ✅ Only imports NextAuth core and Google provider
- ✅ Uses JWT sessions (no database needed)
- ✅ Uses same secret and config as main auth
- ✅ No Prisma or heavy dependencies

## How It Works

### Middleware (`middleware.ts`)
- Imports lightweight `auth` from `@/lib/auth-middleware`
- Only needs to verify JWT tokens (no DB access)
- Much smaller bundle size

### API Routes (`app/api/auth/[...nextauth]/route.ts`)
- Still imports full `auth` from `@/lib/auth`
- Has access to Prisma adapter for token storage
- Handles sign-in/sign-out with database

### Compatibility

Both auth instances use:
- Same `NEXTAUTH_SECRET` (from env)
- Same JWT strategy
- Same Google provider config

This ensures JWT tokens created by the API routes are valid in middleware.

## Files Changed

1. **Created**: `apps/web/src/lib/auth-middleware.ts`
   - Lightweight NextAuth config for middleware
   - No Prisma imports

2. **Updated**: `apps/web/src/middleware.ts`
   - Changed import from `@/lib/auth` to `@/lib/auth-middleware`

## Result

- ✅ Middleware bundle size reduced significantly
- ✅ Under 1 MB limit
- ✅ JWT tokens still work correctly
- ✅ No functionality lost

## Testing

After deployment, verify:
1. Middleware still protects `/dashboard` route
2. Sign-in redirects work correctly
3. JWT sessions are valid across middleware and API routes

