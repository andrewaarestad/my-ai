# PR Workflow for My AI Monorepo

## 🚨 CRITICAL: Always Run Full PR Checks Before Pushing 🚨

**FOR AGENTS/AUTOMATED WORKFLOWS:**

Before **EVERY** `git push`, you **MUST** run the complete PR check suite:

```bash
pnpm pr-check
```

**NO EXCEPTIONS.** This is non-negotiable.

### Why This Is Critical

- Individual checks (lint, type-check, test) may pass, but the build can still fail
- Build failures often reveal missing dependencies or import errors
- Each failed push wastes CI time and creates noise in the PR
- Running individual checks != running the full suite
- The CI environment may have different conditions than local

### The Correct Workflow for Agents

```bash
# 1. Make your changes
# ... edit files ...

# 2. Run individual checks to iterate quickly (OPTIONAL)
pnpm lint        # Quick check for lint errors
pnpm type-check  # Quick check for type errors

# 3. Fix issues found
# ... fix errors ...

# 4. ALWAYS run the FULL pr-check suite before committing
pnpm pr-check

# 5. Only if ALL checks pass, commit and push
git add -A
git commit -m "your message"
git push
```

### What `pnpm pr-check` Does

This command runs **the exact same checks** that GitHub Actions CI runs:

1. ✅ **Lint** all packages (`turbo run lint`)
2. ✅ **Type check** all packages (`turbo run type-check`)
3. ✅ **Test** all packages (`turbo run test`)
4. ✅ **Build** all packages (`turbo run build`)

If ANY of these fail, **DO NOT PUSH**.

### Failed PR Check? Debug Systematically

If `pnpm pr-check` fails, run checks individually to identify the issue:

```bash
# Find which check is failing
pnpm lint        # Check for lint errors
pnpm type-check  # Check for type errors
pnpm test        # Check for test failures
pnpm build       # Check for build errors

# Fix the errors, then run the FULL suite again
pnpm pr-check
```

**Never push until `pnpm pr-check` completes successfully with exit code 0.**

## Pre-PR Checklist

Before opening a pull request, ensure all checks pass locally.

## Running the Full PR Check Suite Locally

### ⚡ Quick Command

```bash
pnpm pr-check
```

This single command runs all checks that CI will run:
1. ✅ Lint all packages
2. ✅ Type check all packages
3. ✅ Test all packages
4. ✅ Build all packages

### Individual Check Commands

If you prefer to run checks separately:

```bash
# 1. Lint and auto-fix issues
pnpm lint:fix

# 2. Type check
pnpm type-check

# 3. Run tests
pnpm test

# 4. Build all packages
pnpm build
```

## Recommended Workflow

### 1. Before Starting Work

```bash
# Ensure you're on latest main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name
```

### 2. During Development

```bash
# Run development server
pnpm dev

# Auto-fix lint issues frequently
pnpm lint:fix

# Run tests in watch mode
pnpm test:watch
```

### 3. Before Committing

```bash
# Auto-fix all lint issues
pnpm lint:fix

# Verify no errors
pnpm lint

# Type check
pnpm type-check

# Run tests
pnpm test
```

### 4. Before Committing & Pushing (CRITICAL)

```bash
# MANDATORY: Run full PR check suite
pnpm pr-check
```

**STOP!** Check the output:
- ✅ If exit code is 0 and all checks pass → Proceed to commit and push
- ❌ If ANY check fails → DO NOT commit or push, fix the errors first

```bash
# Only if pnpm pr-check passed with exit code 0:
git add -A
git commit -m "your commit message"
git push -u origin feature/your-feature-name
```

**For Agents:** You must verify that `pnpm pr-check` completed successfully before executing `git push`. Check for:
1. Exit code 0
2. All tasks showing as successful in Turborepo output
3. No error messages in the output

**Never push without running the full pr-check suite first!**

## Common PR Failures and Fixes

### ❌ Lint Failures

**Error**: ESLint errors in CI

**Fix**:
```bash
# Auto-fix lint issues (ALWAYS TRY THIS FIRST!)
pnpm lint:fix

# Verify
pnpm lint
```

**DO NOT** regenerate files for formatting issues. Use `lint:fix` instead!

### ❌ Type Check Failures

**Error**: TypeScript compilation errors

**Fix**:
```bash
# Check which packages have type errors
pnpm type-check

# Fix the type errors manually
# Then verify
pnpm type-check
```

### ❌ Test Failures

**Error**: Unit tests failing

**Fix**:
```bash
# Run tests to see failures
pnpm test

# Fix the failing tests
# Then verify
pnpm test
```

### ❌ Build Failures

**Error**: Build process fails

**Fix**:
```bash
# Clear cache
rm -rf .turbo

# Try clean build
pnpm build

# If still failing, check error logs
```

## GitHub Actions CI/CD

### What CI Runs

On every PR, GitHub Actions runs:

1. **Setup**: Install Node.js 22 and pnpm 10
2. **Dependencies**: Install with cache
3. **Lint**: `pnpm turbo run lint`
4. **Type Check**: `pnpm turbo run type-check`
5. **Test**: `pnpm turbo run test`
6. **Build**: `pnpm turbo run build`

### Viewing CI Results

1. Go to your PR on GitHub
2. Scroll to "Checks" section
3. Click "Details" to see logs
4. Fix any failures and push again

### CI Optimization

CI uses caching for:
- **pnpm store**: Faster dependency installation
- **Turborepo cache**: Faster builds

This makes subsequent runs much faster!

## Best Practices

### ✅ DO

1. **🚨 ALWAYS run `pnpm pr-check` before EVERY push** (most important!)
2. **Verify exit code is 0 before pushing**
3. **Run individual checks to iterate quickly during development**
4. **Run the full suite before committing**
5. **Use `lint:fix` to auto-fix issues**
6. **Keep PRs focused and small**
7. **Write descriptive commit messages**
8. **Add tests for new features**
9. **Update documentation if needed**

### ❌ DON'T

1. **🚨 DON'T push without running `pnpm pr-check` first** (most important!)
2. **DON'T assume individual checks passing = full suite passing**
3. **DON'T skip the build step - it catches missing dependencies**
4. **DON'T regenerate files for lint issues** - Use `lint:fix` instead!
5. **DON'T commit without running checks**
6. **DON'T push directly to main**
7. **DON'T mix unrelated changes in one PR**
8. **DON'T ignore build warnings - they may become errors in CI**

### 🤖 Special Instructions for AI Agents

When working on this codebase, you **MUST**:

1. Run `pnpm pr-check` before **EVERY** `git push`
2. Check the exit code - only push if it's 0
3. If any check fails, debug it systematically:
   - Run individual checks to identify the failure
   - Fix the issue
   - Run `pnpm pr-check` again
   - Repeat until all checks pass
4. Never assume "lint passed = everything is fine"
5. The **build** step is critical - it catches import errors, missing deps, etc.
6. Read error messages carefully - they usually tell you exactly what's wrong

**Remember:** Each failed push creates work for others and wastes CI resources. Getting it right the first time is worth the extra minute to run `pnpm pr-check`.

## Commit Message Guidelines

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(web): add agent management dashboard

fix(ui): resolve button hover state issue

docs: update PR workflow instructions

test(ui): add button component tests
```

## Troubleshooting CI

### Issue: CI passes locally but fails on GitHub

**Common causes:**

1. **Different Node version**
   - CI uses Node 22.x
   - Check your version: `node -v`

2. **Uncommitted changes**
   - Ensure all changes are committed
   - Run `git status`

3. **Lock file out of sync**
   - Commit `pnpm-lock.yaml`
   - Run `pnpm install` to update

### Issue: CI is slow

**Solutions:**

1. **Cache issues**: Wait for cache to warm up (first run is slower)
2. **Dependency changes**: New deps take longer to install
3. **Large changes**: More files = longer builds

## Getting Help

If PR checks are failing and you're stuck:

1. Read the error messages carefully
2. Check this documentation
3. Search for similar issues in the repo
4. Ask for help in PR comments

## Summary

**The golden rule**: Always run `pnpm pr-check` before **EVERY** `git push`!

### Why This Matters

Running the full suite (`pnpm pr-check`) ensures:
- ✅ Code is properly linted and formatted
- ✅ No type errors across all packages
- ✅ All tests pass
- ✅ Everything builds successfully (catches missing deps, import errors)
- ✅ You match exactly what CI will run
- ✅ No wasted CI time from preventable failures

### The Complete Pre-Push Checklist

```bash
# 1. Make your changes
# ... edit files ...

# 2. (Optional) Quick iteration with individual checks
pnpm lint        # Fast feedback on lint errors
pnpm type-check  # Fast feedback on type errors

# 3. MANDATORY: Run the full suite
pnpm pr-check

# 4. Verify success (exit code 0, all tasks successful)

# 5. ONLY THEN commit and push
git add -A
git commit -m "feat: your commit message"
git push
```

**For AI Agents:** This is not optional. Every push must be preceded by a successful `pnpm pr-check` run. No exceptions.

Happy coding! 🚀
