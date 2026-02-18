# Plan: Centralized Environment Variable Management

## Goal
Create typed `environment.ts` files that are the **sole** point of `process.env` access. They validate required vars at import time and export a strongly-typed object. No other file in the codebase should use `process.env`.

## Design Decisions

### Two environment files (not shared)
- **`apps/web/src/lib/environment.ts`** — for the Next.js app
- **`packages/core/src/environment.ts`** — for CLI tools / the core package

Shared packages (`@my-ai/sync`, `@my-ai/ui`) should NOT reference env vars. They receive configuration as function parameters.

### Special handling: `NODE_ENV` and `VERCEL_ENV`
These are runtime/platform metadata, not app configuration. They'll be included in the typed object but are **optional** (never throw on missing). `NODE_ENV` is used by Prisma client singletons and NextAuth debug mode. `VERCEL_ENV` is used for environment detection.

### Special handling: Edge middleware (`auth-middleware.ts`)
The Edge middleware runs in a restricted runtime and must remain lightweight. It already uses dummy fallbacks for build-time. It will import from `environment.ts` but use the **optional** accessors (no throw) since env vars may not be available during the Edge build step.

### Cookie `secure` flag
`auth.ts` currently reads `process.env.NEXTAUTH_URL?.startsWith("https://")` inline in cookie config. This will be replaced with a derived `isSecure` boolean computed in `environment.ts`.

---

## Files to Create

### 1. `apps/web/src/lib/environment.ts`

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
  // Required — throws at import time if missing
  GOOGLE_CLIENT_ID: required("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: required("GOOGLE_CLIENT_SECRET"),
  NEXTAUTH_SECRET: required("NEXTAUTH_SECRET"),
  NEXTAUTH_URL: required("NEXTAUTH_URL"),
  // Note: DATABASE_URL and DIRECT_URL are read by Prisma directly from env,
  // not by our application code — no need to validate here

  // Optional — platform/runtime metadata
  NODE_ENV: optional("NODE_ENV") ?? "development",
  VERCEL_ENV: optional("VERCEL_ENV"),

  // Derived
  get isDevelopment() {
    return this.VERCEL_ENV === undefined && this.NODE_ENV === "development";
  },
  get isProduction() {
    return this.VERCEL_ENV === "production" || (!this.VERCEL_ENV && this.NODE_ENV === "production");
  },
  get isPreview() {
    return this.VERCEL_ENV === "preview";
  },
  get isSecure() {
    return this.NEXTAUTH_URL.startsWith("https://") || this.isProduction;
  },
} as const;
```

### 2. `packages/core/src/environment.ts`

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
  NODE_ENV: optional("NODE_ENV") ?? "development",
} as const;
```

---

## Files to Modify

### 3. `apps/web/src/lib/auth.ts`
- Add `import { env } from "./environment";`
- Remove `import { isDevelopment, isProduction } from "./env";`
- Replace all `process.env.GOOGLE_CLIENT_ID` → `env.GOOGLE_CLIENT_ID`
- Replace all `process.env.GOOGLE_CLIENT_SECRET` → `env.GOOGLE_CLIENT_SECRET`
- Replace all `process.env.NEXTAUTH_SECRET` → `env.NEXTAUTH_SECRET`
- Replace `process.env.NEXTAUTH_URL?.startsWith("https://") ?? isProduction()` → `env.isSecure`
- Replace session token name expression similarly
- Replace `process.env.NODE_ENV === "development"` → `env.isDevelopment`
- Replace `isDevelopment()` → `env.isDevelopment`

### 4. `apps/web/src/lib/auth-middleware.ts`
- Import `env` from `./environment` using a **lazy** pattern since this runs in Edge:
  ```ts
  // Edge-safe: read env vars at call time, not import time
  function getEnv() { ... }
  ```
  Actually, better approach: since the middleware needs dummy fallbacks for build time, we keep a small inline helper here that reads `process.env` with fallbacks. **OR** we add an `optional()` variant to `environment.ts` and use that. Since the middleware is a special edge case, the cleanest approach is to have `environment.ts` export an `edgeEnv` object with fallback values, or simply accept that this one file is the exception.

  **Decision:** We'll add a separate `environmentEdge.ts` file or a section in `environment.ts` that exports edge-safe vars with fallbacks. The simplest approach: `auth-middleware.ts` imports from `environment.ts` but uses a dedicated `edgeEnv` export that doesn't throw.

  Updated plan: `environment.ts` will export both:
  - `env` — throws on missing required vars (for server-side code)
  - `edgeEnv` — returns fallback values for edge/build-time (for middleware)

### 5. `apps/web/src/lib/token-refresh.ts`
- Add `import { env } from "./environment";`
- Replace `process.env.GOOGLE_CLIENT_ID!` → `env.GOOGLE_CLIENT_ID`
- Replace `process.env.GOOGLE_CLIENT_SECRET!` → `env.GOOGLE_CLIENT_SECRET`

### 6. `apps/web/src/lib/env.ts`
- Delete this file (its functionality is subsumed by `environment.ts` derived properties)

### 7. `apps/web/src/lib/env-validation.ts`
- Delete this file (validation now happens at import time in `environment.ts`)

### 8. `apps/web/src/lib/prisma.ts`
- Add `import { env } from "./environment";`
- Replace `process.env.NODE_ENV === "development"` → `env.isDevelopment`
- Replace `process.env.NODE_ENV !== "production"` → `!env.isProduction`

### 9. `apps/web/src/lib/error-logger.ts` (if it uses `env.ts`)
- Update imports from `./env` to `./environment`
- Replace function calls like `isDevelopment()` → `env.isDevelopment`

### 10. `packages/core/src/auth/google.ts`
- Add `import { env } from "../environment";`
- Replace `process.env.GOOGLE_CLIENT_ID` → `env.GOOGLE_CLIENT_ID`
- Replace `process.env.GOOGLE_CLIENT_SECRET` → `env.GOOGLE_CLIENT_SECRET`
- Remove the manual `if (!clientId || !clientSecret)` check (now handled by `environment.ts`)

### 11. `packages/core/src/db/client.ts`
- Add `import { env } from "../environment";`
- Replace `process.env.NODE_ENV === "development"` → `env.NODE_ENV === "development"`
- Replace `process.env.NODE_ENV !== "production"` → `env.NODE_ENV !== "production"`

### 12. Update any remaining imports of `env.ts` or `env-validation.ts`
- Search for `from "./env"` or `from "../env"` across the web app and update to `from "./environment"` or equivalent.

---

## Files NOT Modified
- `.env.example` files — documentation, no code changes needed
- `docs/` — documentation only
- `.github/actions/` — GitHub Actions env vars are set by CI, not app code
- `turbo.json` — no env var handling currently
- `prisma/schema.prisma` — Prisma reads `DATABASE_URL` and `DIRECT_URL` directly via its own `env()` function in the schema; this is Prisma's mechanism and not something we control

---

## Order of Operations
1. Create `packages/core/src/environment.ts`
2. Update `packages/core/src/auth/google.ts` and `packages/core/src/db/client.ts`
3. Create `apps/web/src/lib/environment.ts` (with both `env` and `edgeEnv`)
4. Update `apps/web/src/lib/auth.ts`
5. Update `apps/web/src/lib/auth-middleware.ts`
6. Update `apps/web/src/lib/token-refresh.ts`
7. Update `apps/web/src/lib/prisma.ts`
8. Update `apps/web/src/lib/error-logger.ts` and any other files importing from `./env`
9. Delete `apps/web/src/lib/env.ts` and `apps/web/src/lib/env-validation.ts`
10. Grep for any remaining `process.env` in `apps/` and `packages/` (excluding `node_modules`) to ensure none remain
11. Build to verify everything compiles
