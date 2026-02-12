# PR Readiness Check (prc) - Verify Branch is Ready for PR

This command runs all CI/CD checks locally and iteratively fixes any issues until the branch is ready for PR.

User-provided additional info: <user_data> $ARGUMENTS </user_data>

## Overview

Run the same checks that CI/CD runs on pull requests:
1. **lint** - ESLint/linting checks
2. **format:check** - Prettier/formatting checks
3. **typecheck** - TypeScript type checking
4. **test** - Unit tests with coverage
5. **build** - Production build

When issues are found, attempt to fix them automatically and re-run until all pass.

---

## Phase 1: Pre-format and Run PR Readiness Check

First, run the formatter to auto-fix any formatting issues upfront (this prevents re-runs due to format failures):

```bash
npm run format
```

Then run the full check:

```bash
npm run check:pr:readiness
```

This executes all checks via Turborepo. If all pass, report success and exit.

If any checks fail, proceed to Phase 2.

---

## Phase 2: Fix Failures

Handle failures in this order (earlier fixes often resolve later issues):

### 2.1 Lint Errors

1. **First, try auto-fix:**
   ```bash
   npm run lint:fix
   ```

2. **Re-run lint to see remaining issues:**
   ```bash
   npm run lint
   ```

3. **If issues remain**, read the error output and make manual edits:
   - Unused variables/imports → remove them
   - Missing imports → add them
   - Code style issues → fix per linter suggestions
   - Complexity issues → refactor the code

### 2.2 Format Errors

1. **Run the formatter to auto-fix:**
   ```bash
   npm run format
   ```

2. **Re-run format check to verify:**
   ```bash
   npm run format:check
   ```

Format errors should always be fixable with `npm run format`.

### 2.3 Typecheck Errors

TypeScript errors require manual fixes. Common issues:

- **Missing types** → Add type annotations or install @types packages
- **Type mismatches** → Fix the code to match expected types
- **Missing properties** → Add required properties to objects
- **Null/undefined issues** → Add proper null checks

Read error messages carefully and edit the relevant files.

### 2.4 Test Failures

1. **Read the test output** to understand what failed
2. **Determine if it's a code bug or test bug:**
   - If the code is wrong → fix the code
   - If the test is wrong/outdated → fix the test
3. **Re-run tests:**
   ```bash
   npm run test
   ```

### 2.5 Build Errors

Build errors are usually caused by:
- TypeScript errors (fix those first)
- Missing dependencies
- Import/export issues
- Environment configuration

Read the build output and fix the underlying issues.

---

## Phase 3: Iterate Until All Pass

After fixing issues, run the full check again:

```bash
npm run check:pr:readiness
```

If failures remain, return to Phase 2 and fix them.

Repeat until all checks pass.

---

## Phase 4: Report Success

When all checks pass, report to the user:

```
All PR readiness checks passed:
✓ Lint
✓ Format
✓ Typecheck
✓ Test
✓ Build

The branch is ready for PR.
```

---

## Running Checks on Specific Apps

To run checks on a specific app only:

```bash
# Lint only frontend
npx turbo run lint --filter=desty-frontend

# Test only vue-frontend
npx turbo run test --filter=godesty-web

# Build only api
npx turbo run build --filter=desty-api
```

---

## Task Reference

| Task | Command | Auto-fixable |
|------|---------|--------------|
| lint | `npm run lint` | Partially (`npm run lint:fix`) |
| format:check | `npm run format:check` | Yes (`npm run format`) |
| typecheck | `npm run typecheck` | No - manual fixes required |
| test | `npm run test` | No - manual fixes required |
| build | `npm run build` | No - fix underlying issues |

---

## Important Notes

1. **Always run the full check** (`npm run check:pr:readiness`) at the end to verify everything passes together.

2. **Fix issues in order**: lint/format first, then typecheck, then tests, then build.

3. **Don't skip checks**: All checks must pass for CI/CD to succeed.

4. **Read error messages carefully**: The output tells you exactly what's wrong and often suggests fixes.

---

## Success Criteria

The PR Readiness Check is complete when:

- [ ] `npm run check:pr:readiness` passes with no errors
- [ ] All lint errors resolved
- [ ] All format errors resolved
- [ ] All typecheck errors resolved
- [ ] All tests passing
- [ ] Build succeeds
