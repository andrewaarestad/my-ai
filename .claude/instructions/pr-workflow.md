# PR Workflow for My AI Monorepo

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

### 4. Before Opening PR

```bash
# Run full PR check suite
pnpm pr-check
```

**If all checks pass**, you're ready to push and open a PR!

```bash
# Push to your branch
git push -u origin feature/your-feature-name
```

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

1. **Run `pnpm pr-check` before opening PR**
2. **Use `lint:fix` to auto-fix issues**
3. **Keep PRs focused and small**
4. **Write descriptive commit messages**
5. **Add tests for new features**
6. **Update documentation if needed**

### ❌ DON'T

1. **Don't skip the pr-check command**
2. **Don't regenerate files for lint issues** - Use `lint:fix` instead!
3. **Don't commit without running checks**
4. **Don't push directly to main**
5. **Don't mix unrelated changes in one PR**

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

**The golden rule**: Always run `pnpm pr-check` before opening a PR!

This ensures:
- ✅ Code is properly linted and formatted
- ✅ No type errors
- ✅ All tests pass
- ✅ Everything builds successfully

Happy coding! 🚀
