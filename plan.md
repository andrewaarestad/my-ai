# Plan: Centralized Environment Variable Management

## Goal

Create typed `environment.ts` files that are the **sole** point of `process.env` access. They validate required vars at import time and export a strongly-typed object. No code outside of `environment.ts` files should use `process.env`.

## Core Pattern

- Each **app** in `apps/` gets an `environment.ts` — this is the only place `process.env` is read
- **Packages** (`packages/core`, `packages/sync`, etc.) never read `process.env` — they receive config as function/constructor parameters
- `scripts/` moves into `apps/cli/` as a proper workspace package with its own `environment.ts`

---

## Phase 1: Move `scripts/` → `apps/cli/`

### Create `apps/cli/`

New package structure:

```
apps/cli/
├── package.json          # name: "@my-ai/cli", depends on @my-ai/core, @my-ai/sync
├── tsconfig.json
├── src/
│   ├── environment.ts    # CLI env var access (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
│   ├── auth-google.ts    # moved from scripts/auth-google.ts
│   ├── sync-gmail.ts     # moved from scripts/sync-gmail.ts
│   └── search.ts         # moved from scripts/search.ts
```

### Move CLI scripts from root `package.json` into `apps/cli/package.json`

Remove these from root `package.json`:
```diff
- "auth:google": "tsx scripts/auth-google.ts",
- "sync:gmail": "tsx scripts/sync-gmail.ts",
- "data:search": "tsx scripts/search.ts"
```

Add them to `apps/cli/package.json`:
```json
{
  "name": "@my-ai/cli",
  "scripts": {
    "auth:google": "tsx src/auth-google.ts",
    "sync:gmail": "tsx src/sync-gmail.ts",
    "data:search": "tsx src/search.ts"
  }
}
```

These can then be run from the repo root via:
- `pnpm --filter @my-ai/cli auth:google`
- `pnpm --filter @my-ai/cli sync:gmail`
- `pnpm --filter @my-ai/cli data:search "query"`

Or with turbo if desired.

### Delete `scripts/` directory

---

## Phase 2: Make `@my-ai/core` env-free

### `packages/core/src/auth/google.ts`

Change `getOAuth2Client()` to accept config instead of reading `process.env`:

```ts
// Before
function getOAuth2Client(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw ...
  return new OAuth2Client({ clientId, clientSecret, redirectUri: REDIRECT_URI });
}

// After
export interface GoogleAuthConfig {
  clientId: string;
  clientSecret: string;
}

function getOAuth2Client(config: GoogleAuthConfig): OAuth2Client {
  return new OAuth2Client({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: REDIRECT_URI,
  });
}
```

Update all exported functions (`getGoogleAuthClient`, `runGoogleAuthFlow`) to accept `config: GoogleAuthConfig` and thread it through.

### `packages/core/src/db/client.ts`

The Prisma singleton reads `NODE_ENV` for log levels and the dev singleton pattern. Two options:

**Option A** — Accept a config parameter:
```ts
export function createPrismaClient(opts?: { verbose?: boolean }): PrismaClient { ... }
```

**Option B** — Leave `NODE_ENV` as-is. It's a Node.js runtime standard, not app config. Prisma itself reads `DATABASE_URL` from `process.env` internally, so the package already implicitly depends on env. `NODE_ENV` is in the same category.

**Recommendation: Option B.** `NODE_ENV` is a runtime convention, not app configuration. Treating it the same as `GOOGLE_CLIENT_ID` adds complexity for no real benefit. The rule becomes: **no app-specific env vars in packages; `NODE_ENV` is acceptable as a universal runtime convention.**

### Update `packages/core/src/auth/index.ts` exports

Re-export the `GoogleAuthConfig` type so consumers can import it.

---

## Phase 3: Create `apps/cli/src/environment.ts`

```ts
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  GOOGLE_CLIENT_ID: required("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: required("GOOGLE_CLIENT_SECRET"),
};
```

### Update CLI scripts to use it

Each script imports `env` and passes config to `@my-ai/core`:

```ts
// apps/cli/src/auth-google.ts
import { env } from "./environment";
import { runGoogleAuthFlow, getGoogleAuthClient } from "@my-ai/core/auth";

// Pass env to core functions
await runGoogleAuthFlow({ clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET });
```

Same pattern for `sync-gmail.ts` (passes config to `getGoogleAuthClient`) and `search.ts` (only uses `@my-ai/core/db` which doesn't need app config).

---

## Phase 4: Create `apps/web/src/lib/environment.ts`

```ts
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string): string | undefined {
  return process.env[name] || undefined;
}

export const env = {
  GOOGLE_CLIENT_ID: required("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: required("GOOGLE_CLIENT_SECRET"),
  NEXTAUTH_SECRET: required("NEXTAUTH_SECRET"),
  NEXTAUTH_URL: required("NEXTAUTH_URL"),

  NODE_ENV: optional("NODE_ENV") ?? "development",
  VERCEL_ENV: optional("VERCEL_ENV"),

  get isDevelopment(): boolean {
    return !this.VERCEL_ENV && this.NODE_ENV === "development";
  },
  get isProduction(): boolean {
    return this.VERCEL_ENV === "production" || (!this.VERCEL_ENV && this.NODE_ENV === "production");
  },
  get isPreview(): boolean {
    return this.VERCEL_ENV === "preview";
  },
  get isSecure(): boolean {
    return this.NEXTAUTH_URL.startsWith("https://") || this.isProduction;
  },
};

/**
 * Edge-safe env access — returns fallbacks instead of throwing.
 * Used by auth-middleware.ts which runs in Edge runtime where env
 * vars may not be available during the build step.
 */
export const edgeEnv = {
  GOOGLE_CLIENT_ID: optional("GOOGLE_CLIENT_ID") ?? "missing-client-id",
  GOOGLE_CLIENT_SECRET: optional("GOOGLE_CLIENT_SECRET") ?? "missing-client-secret",
  NEXTAUTH_SECRET: optional("NEXTAUTH_SECRET") ?? "missing-secret",
};
```

### Update web app files to use `env`

**`apps/web/src/lib/auth.ts`**
- Import `{ env }` from `"./environment"`
- Remove import of `isDevelopment, isProduction` from `"./env"`
- Replace all `process.env.GOOGLE_CLIENT_ID` → `env.GOOGLE_CLIENT_ID`
- Replace all `process.env.GOOGLE_CLIENT_SECRET` → `env.GOOGLE_CLIENT_SECRET`
- Replace `process.env.NEXTAUTH_SECRET` → `env.NEXTAUTH_SECRET`
- Replace `process.env.NEXTAUTH_URL?.startsWith("https://") ?? isProduction()` → `env.isSecure`
- Replace session token name prefix expression → use `env.isSecure`
- Replace `isDevelopment()` → `env.isDevelopment`
- Replace `process.env.NODE_ENV === "development"` → `env.isDevelopment`

**`apps/web/src/lib/auth-middleware.ts`**
- Import `{ edgeEnv }` from `"./environment"`
- Replace `process.env.GOOGLE_CLIENT_ID || "dummy-client-id"` → `edgeEnv.GOOGLE_CLIENT_ID`
- Replace `process.env.GOOGLE_CLIENT_SECRET || "dummy-client-secret"` → `edgeEnv.GOOGLE_CLIENT_SECRET`
- Replace `process.env.NEXTAUTH_SECRET || "dummy-secret-for-build"` → `edgeEnv.NEXTAUTH_SECRET`

**`apps/web/src/lib/token-refresh.ts`**
- Import `{ env }` from `"./environment"`
- Replace `process.env.GOOGLE_CLIENT_ID!` → `env.GOOGLE_CLIENT_ID`
- Replace `process.env.GOOGLE_CLIENT_SECRET!` → `env.GOOGLE_CLIENT_SECRET`

**`apps/web/src/lib/prisma.ts`**
- Import `{ env }` from `"./environment"`
- Replace `process.env.NODE_ENV === "development"` → `env.isDevelopment`
- Replace `process.env.NODE_ENV !== "production"` → `!env.isProduction`

**`apps/web/src/lib/error-logger.ts`**
- Import `{ env }` from `"./environment"`
- Remove import from `"./env"`
- Replace `getEnvironment()` → `env.VERCEL_ENV ?? env.NODE_ENV` (or add a `get environment()` getter to env)
- Replace `isDevelopment()` → `env.isDevelopment`
- Replace `isProduction()` → `env.isProduction`

### Delete obsolete files

- `apps/web/src/lib/env.ts` — replaced by `environment.ts` derived properties
- `apps/web/src/lib/env-validation.ts` — replaced by `environment.ts` import-time validation

---

## Phase 5: Verify

1. `grep -r "process\.env" apps/ packages/ --include="*.ts" --include="*.tsx"` — should only appear in:
   - `apps/web/src/lib/environment.ts`
   - `apps/cli/src/environment.ts`
   - `packages/core/src/db/client.ts` (`NODE_ENV` only — acceptable)
2. `pnpm build` — verify everything compiles
3. `pnpm lint` — verify no lint errors
4. `pnpm type-check` — verify types

---

## Summary of `process.env` access points (after)

| File | Env Vars | Justification |
|------|----------|---------------|
| `apps/web/src/lib/environment.ts` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NODE_ENV`, `VERCEL_ENV` | Web app entrypoint |
| `apps/cli/src/environment.ts` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | CLI app entrypoint |
| `packages/core/src/db/client.ts` | `NODE_ENV` | Runtime convention (same as Prisma's own `DATABASE_URL` read) |
