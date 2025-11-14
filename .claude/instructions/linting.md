# Linting My AI Monorepo

## ⚡ Quick Reference

**IMPORTANT FOR AGENTS**: Always use `lint:fix` to automatically fix linting issues instead of regenerating files!

```bash
# ✅ PREFERRED: Auto-fix all lint issues across the entire monorepo
pnpm lint:fix

# ✅ PREFERRED: Auto-fix lint issues in a specific package
pnpm --filter <package-name> lint:fix

# Check for lint issues (no auto-fix)
pnpm lint
```

## When to Use lint:fix

### ✅ DO use lint:fix when:

1. **After writing new code** - Auto-fix formatting and simple issues
2. **Before committing** - Ensure code meets style guidelines
3. **When CI fails due to lint errors** - Fix issues quickly
4. **After code generation** - Clean up generated code
5. **When you see common lint errors** like:
   - Missing semicolons or quotes
   - Inconsistent spacing
   - Unused imports
   - Import ordering issues
   - Trailing commas

### ❌ DO NOT regenerate files for:

- Formatting issues (spacing, quotes, semicolons)
- Import ordering
- Unused imports
- Simple style violations

**These can ALL be fixed automatically with `pnpm lint:fix`!**

## Linting Commands

### Lint entire monorepo

```bash
# Check for issues
pnpm lint

# Auto-fix issues (PREFERRED)
pnpm lint:fix
```

### Lint specific package

```bash
# Check for issues
pnpm --filter @my-ai/web lint

# Auto-fix issues (PREFERRED)
pnpm --filter @my-ai/web lint:fix
```

### Examples

```bash
# Lint and fix the web app
pnpm --filter @my-ai/web lint:fix

# Lint and fix the UI library
pnpm --filter @my-ai/ui lint:fix

# Lint and fix everything
pnpm lint:fix
```

## What lint:fix Does

The auto-fix command can automatically resolve:

- ✅ **Formatting issues**: spacing, indentation, line breaks
- ✅ **Quote style**: single vs double quotes
- ✅ **Semicolons**: adding or removing as per config
- ✅ **Unused imports**: removing unused imports
- ✅ **Import ordering**: sorting imports correctly
- ✅ **Trailing commas**: adding where configured
- ✅ **Type imports**: converting to `import type` where possible
- ✅ **React hooks**: some dependency array issues

## What lint:fix Cannot Do

Some issues require manual intervention:

- ❌ **Logic errors**: incorrect code logic
- ❌ **Type errors**: TypeScript type mismatches (use type-check)
- ❌ **Missing dependencies**: incomplete dependency arrays
- ❌ **Security issues**: potential vulnerabilities
- ❌ **Complex refactoring**: architectural changes

For these, you'll need to edit the code manually.

## ESLint Configuration

The monorepo uses shared ESLint configs:

- **@my-ai/eslint-config/nextjs** - For Next.js apps
- **@my-ai/eslint-config/react-library** - For React libraries
- **@my-ai/eslint-config/node** - For Node.js services
- **@my-ai/eslint-config/base** - Base TypeScript config

## Lint Rules Enforced

### TypeScript
- Strict type checking
- No unused variables (except prefixed with `_`)
- No explicit `any` (warning)
- Consistent type imports
- No floating promises
- No misused promises

### React
- No prop-types (using TypeScript)
- Exhaustive deps for hooks
- React 19 JSX runtime

### Code Quality
- No console.log (except console.warn/error)
- Proper case sensitivity in filenames
- ES2022+ features

## Troubleshooting Lint Issues

### Issue: "Lint errors on CI but not locally"

**Solution:**
```bash
# Ensure you're using the same Node version
node -v  # Should be 22.x

# Clear cache and re-lint
rm -rf .turbo node_modules
pnpm install
pnpm lint:fix
```

### Issue: "Too many lint errors"

**Solution:**
```bash
# Auto-fix everything you can
pnpm lint:fix

# Check what's left
pnpm lint

# Fix remaining issues manually
```

### Issue: "ESLint config not found"

**Solution:**
```bash
# Install dependencies
pnpm install

# Verify config packages are installed
ls -la node_modules/@my-ai/eslint-config
```

## Best Practices for Agents

1. **Always run `lint:fix` after generating code**
2. **Never regenerate entire files just for formatting issues**
3. **Check lint status before creating PRs**
4. **Fix lint issues incrementally, not in bulk**
5. **Use specific package filters when working on one package**

## Integration with CI/CD

GitHub Actions runs `pnpm turbo run lint` on every PR.

**Before pushing:**
```bash
# Auto-fix all issues
pnpm lint:fix

# Verify no errors remain
pnpm lint
```

## Editor Integration

For the best experience, configure your editor to:

1. **Auto-fix on save**: Enable ESLint auto-fix
2. **Show lint errors inline**: Use ESLint extension
3. **Use project ESLint config**: Point to workspace root

This helps catch issues early during development.
