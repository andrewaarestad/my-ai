# Plan: Multi-Account Linking Flow

## Problem

When a user tries to connect a second Google account (different email), NextAuth creates a **new User** instead of linking the account to the existing user. The old `ConnectedAccount` model was scaffolded for this but never wired up and was dropped.

## Approach

Use NextAuth's built-in `signIn` callback to detect "link mode" (user already authenticated + a cookie/param signals linking intent). In link mode, we intercept the OAuth callback to attach the new Account to the current user instead of creating a new one.

---

## Steps

### 1. API route: `POST /api/auth/link/google`

**File:** `apps/web/src/app/api/auth/link/google/route.ts`

- Requires authenticated session (return 401 otherwise)
- Sets a short-lived httpOnly cookie `authjs.link-mode` = `{ userId }` (encrypted or signed with `NEXTAUTH_SECRET`)
- Redirects the user to `signIn("google", { callbackUrl: "/dashboard/accounts" })` — or constructs the Google OAuth URL directly via NextAuth's `signIn()` server action
- This cookie is the signal that the incoming OAuth callback should link, not create

### 2. Modify `signIn` callback in `auth.ts`

**File:** `apps/web/src/lib/auth.ts`

Add a `signIn` callback that:

- Reads the `authjs.link-mode` cookie from the request
- If present and valid:
  - Checks if an Account row already exists for this `provider + providerAccountId` → if yes, return error "account already linked"
  - Creates an `Account` row with `userId` from the cookie (the current user), using the OAuth tokens from the `account` param
  - Clears the cookie
  - Returns `false` with a redirect to `/dashboard/accounts?linked=true` (or uses a custom redirect)
- If not present: normal sign-in flow (return `true`)

**Key detail:** The `signIn` callback receives `{ user, account, profile }`. In link mode we need to:

- **Prevent** NextAuth from creating a new User (it would because different email)
- **Manually** insert the Account row via Prisma
- **Redirect** back without completing the normal sign-in (don't change the user's session)

### 3. Handle edge cases in the callback

- **Same account already linked to this user:** No-op, redirect with `?already_linked=true`
- **Account linked to a different user:** Show error — "This Google account is already linked to another user"
- **Cookie expired or invalid:** Fall through to normal sign-in

### 4. Update token refresh to handle multiple accounts

**File:** `apps/web/src/lib/token-refresh.ts`

Currently `refreshUserTokens` uses `findFirst` which only gets one account. Change to:

- Accept an optional `providerAccountId` param for targeting a specific account
- When refreshing in the JWT callback, refresh **all** Google accounts for the user (or keep the current behavior of refreshing just the primary one — depends on use case)

### 5. Add "Connect Account" button to accounts page

**File:** `apps/web/src/app/dashboard/accounts/page.tsx`

- Add a "Connect Another Google Account" button at the bottom of the accounts list
- The button posts to `/api/auth/link/google` (or links to it)
- Show success/error banners based on query params (`?linked=true`, `?error=already_linked`, etc.)

### 6. Add disconnect capability (optional, but natural pair)

**File:** `apps/web/src/app/api/auth/unlink/route.ts`

- `DELETE /api/auth/unlink` with body `{ provider, providerAccountId }`
- Requires auth, validates the account belongs to the current user
- Prevents unlinking the **last** account (user must keep at least one to sign in)
- Deletes the Account row
- Add "Disconnect" button to each account card on the accounts page

---

## Files to create/modify

| File                                             | Action                                                    |
| ------------------------------------------------ | --------------------------------------------------------- |
| `apps/web/src/app/api/auth/link/google/route.ts` | **Create** — link-mode initiation endpoint                |
| `apps/web/src/lib/auth.ts`                       | **Modify** — add `signIn` callback for link-mode handling |
| `apps/web/src/app/dashboard/accounts/page.tsx`   | **Modify** — add Connect button + status messages         |
| `apps/web/src/lib/token-refresh.ts`              | **Modify** — handle multiple accounts per user            |
| `apps/web/src/app/api/auth/unlink/route.ts`      | **Create** — disconnect endpoint (optional)               |

## What we do NOT need

- No schema changes — the existing `Account` model already supports multiple accounts per user via its `@@id([provider, providerAccountId])` composite key
- No new Prisma migration
- No changes to middleware
