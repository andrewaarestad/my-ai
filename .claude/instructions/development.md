# Development Guide for My AI Monorepo

## Overview

This is a **pnpm + Turborepo** monorepo for the My AI platform. The repository is structured to support multiple applications and shared packages.

## Repository Structure

```
my-ai/
├── apps/
│   └── web/              # Next.js frontend application
├── packages/
│   ├── eslint-config/    # Shared ESLint configuration
│   ├── typescript-config/# Shared TypeScript configuration
│   └── ui/               # Shared React component library
├── services/             # Backend services (future)
├── .claude/
│   ├── commands/         # Custom slash commands
│   └── instructions/     # Agent instructions
├── .github/
│   └── workflows/        # CI/CD workflows
├── turbo.json            # Turborepo configuration
└── pnpm-workspace.yaml   # pnpm workspace configuration
```

## Package Naming

All internal packages use the `@my-ai/*` scope:

- `@my-ai/web` - Next.js application
- `@my-ai/ui` - Shared UI components
- `@my-ai/typescript-config` - TypeScript configs
- `@my-ai/eslint-config` - ESLint configs

## Dependency Graph

The dependency graph flows as follows:

```
apps/web
  ├── depends on → @my-ai/ui
  ├── depends on → @my-ai/typescript-config
  └── depends on → @my-ai/eslint-config

packages/ui
  ├── depends on → @my-ai/typescript-config
  └── depends on → @my-ai/eslint-config
```

## Navigation Tips

### Finding Code

Use these patterns to locate files:

- App pages: `apps/web/src/app/**/*.tsx`
- Components: `apps/web/src/components/**/*.tsx` or `packages/ui/src/**/*.tsx`
- Configs: `packages/{typescript,eslint}-config/**/*.json`
- Tests: `**/*.test.{ts,tsx}`

### Understanding the Build Process

1. **Turborepo** orchestrates builds across packages
2. Packages are built in dependency order
3. Builds are cached for performance
4. The cache is stored in `.turbo/` directory

## Working with the Monorepo

### Installing Dependencies

```bash
# Install all dependencies (from root)
pnpm install

# Add dependency to specific package
pnpm --filter @my-ai/web add <package-name>

# Add dev dependency
pnpm --filter @my-ai/web add -D <package-name>
```

### Running Commands

```bash
# Run command in specific package
pnpm --filter @my-ai/web dev

# Run command across all packages
pnpm -r <command>
```

## Common Tasks

- See `building.md` for build instructions
- See `testing.md` for testing instructions
- See `linting.md` for linting instructions
- See `pr-workflow.md` for PR preparation
