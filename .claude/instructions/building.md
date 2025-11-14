# Building My AI Monorepo

## Build Commands Overview

All build commands use Turborepo for orchestration and caching.

## Building Individual Packages

### Build a specific package

```bash
pnpm --filter <package-name> build
```

**Examples:**

```bash
# Build the web app
pnpm --filter @my-ai/web build

# Build the UI library
pnpm --filter @my-ai/ui build
```

### Development mode for a specific package

```bash
pnpm --filter <package-name> dev
```

**Examples:**

```bash
# Run web app in dev mode (with Turbopack)
pnpm --filter @my-ai/web dev

# Run UI library in watch mode
pnpm --filter @my-ai/ui dev
```

## Building All Packages

### Production build of all packages

```bash
pnpm build
```

This command:
- Builds all packages in dependency order
- Uses Turborepo caching
- Runs in parallel where possible

### Development mode for all packages

```bash
pnpm dev
```

## Understanding Build Outputs

### apps/web (Next.js)
- **Output**: `.next/` directory
- **Build tool**: Next.js with Turbopack
- **Notes**: Optimized for production deployment

### packages/ui
- **Output**: `dist/` directory
- **Build tool**: tsup
- **Formats**: CommonJS and ESM
- **Includes**: Type definitions (.d.ts files)

## Build Cache

Turborepo caches build outputs in `.turbo/` directory.

### Clearing the cache

```bash
# Clear Turborepo cache and rebuild
rm -rf .turbo
pnpm build
```

### Forcing a rebuild

```bash
# Bypass cache for a fresh build
pnpm turbo run build --force
```

## Troubleshooting Build Issues

### Issue: "Module not found" errors

**Solution:**
1. Ensure dependencies are installed: `pnpm install`
2. Check if the package is built: `pnpm --filter <package-name> build`
3. Clear cache and rebuild: `rm -rf .turbo && pnpm build`

### Issue: Type errors in builds

**Solution:**
1. Run type-check: `pnpm type-check`
2. Fix TypeScript errors
3. Rebuild: `pnpm build`

### Issue: Stale cache causing issues

**Solution:**
```bash
# Full clean and rebuild
pnpm clean
pnpm install
pnpm build
```

## Build Performance Tips

1. **Use Turborepo cache** - Don't bypass unless necessary
2. **Build only what you need** - Use `--filter` for specific packages
3. **Parallel builds** - Turborepo automatically parallelizes independent builds
4. **Incremental builds** - TypeScript and Next.js support incremental compilation

## Continuous Integration

GitHub Actions automatically runs builds on PRs. The workflow:
1. Installs dependencies
2. Restores Turborepo cache
3. Runs `pnpm turbo run build`
4. Saves cache for future runs

See `.github/workflows/pr-checks.yml` for details.
