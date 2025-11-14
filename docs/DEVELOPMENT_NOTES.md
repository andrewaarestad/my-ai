# Development Notes

## Important: Prisma Client Generation

The PR checks will fail for type-checking and building until you generate the Prisma client. This is expected behavior and is **not a bug**.

### Why Type Checks Fail in CI

The type check errors you see are:
```
src/lib/auth.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'PrismaClient'.
```

This happens because:
1. Prisma client is generated based on your `prisma/schema.prisma`
2. The client is generated **after** you connect to a database
3. The generated client is not committed to git (it's in `.gitignore`)

### How to Fix This Locally

Before running tests or type checks, you need to:

1. **Set up your database** (see [docs/SETUP_CHECKLIST.md](./docs/SETUP_CHECKLIST.md))
2. **Generate the Prisma client**:
   ```bash
   pnpm prisma generate
   ```
3. **Then run your checks**:
   ```bash
   pnpm pr-check
   ```

### CI/CD Setup

For CI/CD to pass, you'll need to either:

**Option A: Mock Database (Quick Fix)**
- Add a `postinstall` script to generate Prisma client
- Use a mock/test database URL in CI

**Option B: Real Database (Production Approach)**
- Set up a test database (e.g., Vercel Postgres preview database)
- Add `DATABASE_URL` to your CI environment variables
- Run `pnpm prisma generate` in your CI pipeline before tests

### Recommended CI Configuration

Add this to your GitHub Actions workflow (`.github/workflows/pr-checks.yml`):

```yaml
- name: Generate Prisma Client
  run: |
    # Use a mock database URL for type checking
    export DATABASE_URL="postgresql://user:password@localhost:5432/test"
    pnpm prisma generate

- name: Run PR Checks
  run: pnpm pr-check
```

### Current Status

- ✅ **Linting**: Passing
- ✅ **Testing**: Passing (for @my-ai/ui package)
- ❌ **Type Checking**: Will pass after `pnpm prisma generate`
- ❌ **Building**: Will pass after `pnpm prisma generate`

Once you set up your database and generate the Prisma client locally, all checks will pass.
