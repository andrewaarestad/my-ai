# Plan: Hybrid CLI + Web App with Data Model Cleanup

## Context

The project currently has two parallel stacks that don't share code well:

- **CLI tools** (`scripts/` + `packages/core` + `packages/sync`): Google OAuth via file-based tokens (`~/.my-ai/tokens.json`), Gmail sync, search. All working.
- **Web app** (`apps/web/`): NextAuth Google OAuth, task CRUD with UI, Gmail sync/read API routes, error handling. All working but uses its own copies of gmail-client.ts, gmail-sync.ts, and prisma.ts.

The goal is a hybrid system where both the CLI and web app work, sharing a single implementation of core logic.

---

## Step 1: Clean up the data model

Remove unused models and simplify the schema.

**Drop `ConnectedAccount`:**
- Not referenced by any application code
- Duplicates `Account` fields
- `isPrimary` concept is captured implicitly by `User.email`

**Drop `VerificationToken`:**
- Only needed for email/magic-link auth, which this project doesn't use (Google OAuth only)

**Keep the rest as-is:**
- `User`, `Account`, `Session` — required by NextAuth
- `GmailMessage`, `GmailThread`, `GmailAttachment`, `GmailSyncState` — used by both CLI and web
- `TaskListItem` — used by web app, will be exposed to CLI later

**Changes to `prisma/schema.prisma`:**
1. Delete the `ConnectedAccount` model
2. Delete the `VerificationToken` model
3. Remove `connectedAccounts ConnectedAccount[]` from `User`
4. Create a migration

---

## Step 2: Consolidate shared code into packages

The web app has its own copies of code that also exists in `packages/`. Consolidate so both CLI and web use the same implementation.

**2a. Task service → `packages/core`**

Move `apps/web/src/lib/task-service.ts` to `packages/core/src/tasks/service.ts` and export it from `@my-ai/core/tasks`. The web app API routes will import from the package instead of the local copy.

**2b. Consolidate Prisma client**

`packages/core/src/db/client.ts` and `apps/web/src/lib/prisma.ts` are both singleton Prisma clients. Update the web app to import from `@my-ai/core/db` and delete `apps/web/src/lib/prisma.ts`.

**2c. Consolidate Gmail client + sync**

`packages/sync/src/gmail/` was extracted from `apps/web/src/lib/gmail-*.ts` but diverged (the packages version uses `@my-ai/core/auth`, the web version uses `token-refresh.ts`).

Approach:
- Make `packages/sync/src/gmail/client.ts` accept an auth token (or token-provider function) as a parameter rather than hardcoding a specific auth strategy. This lets both CLI and web callers provide tokens their own way.
- Update the CLI scripts to pass tokens from file-based auth.
- Update the web app API routes to pass tokens from NextAuth/database.
- Delete `apps/web/src/lib/gmail-client.ts` and `apps/web/src/lib/gmail-sync.ts`.

**2d. Keep web-specific code in the web app**

These stay in `apps/web/` since they're web-only concerns:
- `auth.ts` / `auth-middleware.ts` (NextAuth config)
- `token-refresh.ts` (NextAuth token refresh)
- `error-logger.ts`, `env.ts` (web environment utilities)
- `api/` directory (route handler, client, errors, DTOs)
- All React components

---

## Step 3: Wire up the web app to use shared packages

After consolidation:

- `apps/web/package.json` adds dependencies on `@my-ai/core` and `@my-ai/sync`
- API routes for tasks import `TaskListService` from `@my-ai/core/tasks`
- API routes for Gmail import from `@my-ai/sync/gmail`
- All Prisma access goes through `@my-ai/core/db`
- `next.config.ts` updated to transpile the new package imports

---

## Step 4: Verify everything works

- Web app: `pnpm dev` in apps/web, confirm Google login, task CRUD, and Gmail sync API all work
- CLI: `npm run auth:google`, `npm run sync:gmail`, `npm run data:search` all still work
- Types: `pnpm type-check` passes across the monorepo
- Lint: `pnpm lint` passes

---

## What's NOT in scope

- Adding new features (calendar sync, Obsidian, Monarch, etc.)
- Building Gmail UI in the web app (API routes exist but no UI yet)
- Adding CLI commands for tasks (can be a follow-up)
- Changing the auth strategy (NextAuth stays for web, file-based stays for CLI)
- Removing `packages/ui` (it's small and harmless)
