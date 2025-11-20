# Session Management vs OAuth Token Storage

This document clarifies the difference between session management and OAuth token storage in our NextAuth setup.

## Current Configuration: Hybrid Approach

We're using a **hybrid approach**:

1. **JWT Sessions** - For session management (who is logged in)
2. **Database Storage** - For OAuth tokens (Google API credentials)

## Two Different Things

### 1. Session Management (JWT Strategy)

**What**: The session token that identifies who is logged in

**Storage**: JWT token stored in a cookie (NOT in database)

**Configuration**:
```typescript
session: {
  strategy: "jwt",  // ← Using JWT, not database sessions
}
```

**What's in the JWT**:
- User ID
- Last token refresh timestamp
- Encrypted and signed by NextAuth

**Where**: Browser cookie (e.g., `next-auth.session-token`)

**Note**: The `sessions` table in the database exists but is **NOT being used** because we're using JWT strategy.

### 2. OAuth Token Storage (Database)

**What**: Google OAuth access tokens and refresh tokens

**Storage**: Database (`accounts` table)

**Configuration**:
```typescript
adapter: PrismaAdapter(prisma),  // ← Stores OAuth tokens in DB
```

**What's in the database** (`accounts` table):
- `access_token` - Google API access token
- `refresh_token` - Google API refresh token  
- `expires_at` - Token expiration timestamp
- `provider` - "google"
- `userId` - Links to user

**Where**: PostgreSQL database (`accounts` table)

## Why This Hybrid Approach?

### JWT Sessions (Why Not Database Sessions?)

✅ **Pros**:
- Edge runtime compatible (works on Vercel Edge)
- No database query needed on every request
- Faster (no DB lookup)
- Stateless

❌ **Cons**:
- Can't revoke sessions from server-side easily  
  _Note: With database-stored OAuth tokens (as implemented), you can partially mitigate this by deleting the user's account or token records from the database, which prevents further token refresh and effectively revokes access._
- Session data limited by cookie size

### Database OAuth Tokens (Why Not JWT?)

✅ **Pros**:
- Tokens are large (would bloat cookies)
- Need to refresh tokens (requires DB updates)
- Secure server-side storage
- Can query tokens for API calls

❌ **Cons**:
- Requires database query to get tokens

## Visual Diagram

```
┌─────────────────────────────────────────────────┐
│           User Signs In with Google             │
└─────────────────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  NextAuth Processes   │
        │   OAuth Flow          │
        └───────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌───────────────┐      ┌──────────────────┐
│  JWT Session  │      │  OAuth Tokens    │
│  (Cookie)     │      │  (Database)       │
├───────────────┤      ├──────────────────┤
│ • user.id     │      │ • access_token   │
│ • timestamp   │      │ • refresh_token  │
│               │      │ • expires_at     │
└───────────────┘      └──────────────────┘
        │                       │
        │                       │
        ▼                       ▼
┌───────────────┐      ┌──────────────────┐
│ Browser Cookie│      │ accounts table    │
│ (Encrypted)   │      │ in PostgreSQL    │
└───────────────┘      └──────────────────┘
```

## What Gets Stored Where?

### In Browser Cookie (JWT):
- ✅ User ID
- ✅ Last refresh check timestamp
- ❌ NOT OAuth tokens (too large, security risk)

### In Database (`accounts` table):
- ✅ Google access_token
- ✅ Google refresh_token
- ✅ Token expiration time
- ✅ OAuth scopes
- ❌ NOT session data (using JWT instead)

### In Database (`sessions` table):
- ❌ **NOT USED** (empty table)
- Table exists but NextAuth doesn't write to it with JWT strategy

## How It Works Together

1. **User signs in** → NextAuth creates:
   - JWT session token (cookie)
   - OAuth tokens stored in database

2. **User makes request** → NextAuth:
   - Validates JWT from cookie (no DB query)
   - If needed, queries DB for OAuth tokens

3. **Token refresh** → System:
   - Checks JWT for last refresh time
   - Queries DB for refresh_token
   - Calls Google API to refresh
   - Updates DB with new tokens

## Could We Use Database Sessions Instead?

Yes! But we'd need to change:

```typescript
// Current (JWT)
session: {
  strategy: "jwt",
}

// Alternative (Database)
session: {
  strategy: "database",  // Would use sessions table
}
```

**Trade-offs**:
- ✅ Can revoke sessions server-side
- ✅ More session data storage
- ❌ Requires DB query on every request
- ❌ Not Edge runtime compatible

## Summary

| Aspect | Session Management | OAuth Token Storage |
|--------|-------------------|---------------------|
| **Storage** | JWT (Cookie) | Database (`accounts`) |
| **Purpose** | Identify logged-in user | Call Google APIs |
| **Strategy** | `jwt` | `database` (via adapter) |
| **Table Used** | None (JWT) | `accounts` |
| **Table Unused** | `sessions` | N/A |

**Key Point**: We're using **JWT for sessions** and **database for OAuth tokens**. These serve different purposes and can coexist!

