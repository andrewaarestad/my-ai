# Contributing to My AI

Thank you for contributing to My AI! This guide will help you get started with development.

## Development Workflow

### 1. Set Up Your Environment

```bash
# Clone the repository
git clone <repository-url>
cd my-ai

# Install dependencies
pnpm install

# Verify setup by running dev servers
pnpm dev
```

### 2. Create a Feature Branch

```bash
# Ensure you're on latest main
git checkout main
git pull origin main

# Create a feature branch
git checkout -b feature/your-feature-name
```

**Branch naming conventions:**

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates
- `chore/` - Maintenance tasks

### 3. Make Your Changes

```bash
# Run development server
pnpm dev

# Make changes to code

# Auto-fix lint issues frequently
pnpm lint:fix

# Run tests
pnpm test
```

### 4. Before Committing

**IMPORTANT**: Always run these commands before committing:

```bash
# 1. Auto-fix lint issues
pnpm lint:fix

# 2. Verify no lint errors remain
pnpm lint

# 3. Type check
pnpm type-check

# 4. Run tests
pnpm test

# 5. Verify build works
pnpm build
```

Or use the combined command:

```bash
# Run all checks at once
pnpm pr-check
```

### 5. Commit Your Changes

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
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Testing changes
- `chore`: Maintenance

**Examples:**

```bash
git commit -m "feat(web): add agent management page"
git commit -m "fix(ui): resolve button hover state"
git commit -m "docs: update contributing guide"
git commit -m "test(ui): add button tests"
```

### 6. Push and Create PR

```bash
# Push to your branch
git push -u origin feature/your-feature-name
```

Then open a pull request on GitHub.

## Code Style Guidelines

### TypeScript

- **Use strict mode**: All TypeScript is in strict mode
- **Avoid `any`**: Use proper types (any triggers a warning)
- **Use type imports**: `import type { Type } from 'module'`
- **No unused variables**: Remove or prefix with `_`

### React

- **Use functional components**: Prefer function components over class components
- **Use hooks**: Leverage React hooks for state and effects
- **Props validation**: Use TypeScript interfaces, not PropTypes
- **Component naming**: Use PascalCase

### File Naming

- **Components**: `PascalCase.tsx` (e.g., `Button.tsx`)
- **Utilities**: `camelCase.ts` (e.g., `formatDate.ts`)
- **Tests**: `*.test.tsx` or `*.test.ts`
- **Types**: `types.ts` or inline in component files

### Code Organization

```typescript
// 1. Imports (grouped: external, internal, types)
import { useState } from 'react'
import { Button } from '@my-ai/ui'
import type { ButtonProps } from '@my-ai/ui'

// 2. Types/Interfaces
interface MyComponentProps {
  title: string
}

// 3. Component
export function MyComponent({ title }: MyComponentProps) {
  // State and hooks
  const [count, setCount] = useState(0)

  // Event handlers
  const handleClick = () => setCount(count + 1)

  // Render
  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={handleClick}>Count: {count}</Button>
    </div>
  )
}
```

## Testing Guidelines

### Writing Tests

- **Test files**: Colocate with source files (`button.tsx` → `button.test.tsx`)
- **Test naming**: Descriptive test names explaining what is tested
- **Coverage**: Aim for high coverage on critical code
- **Isolation**: Tests should be independent

### Test Structure

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MyComponent } from './my-component'

describe('MyComponent', () => {
  it('renders with correct title', () => {
    render(<MyComponent title="Test" />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('handles user interaction', () => {
    // Test implementation
  })
})
```

### Running Tests

```bash
# Run tests once
pnpm test

# Watch mode
pnpm test:watch

# Specific package
pnpm --filter @my-ai/ui test

# With coverage
pnpm --filter @my-ai/ui test --coverage
```

## Linting & Formatting

### Auto-fixing Issues

**ALWAYS use auto-fix for lint issues instead of regenerating files:**

```bash
# Auto-fix all packages
pnpm lint:fix

# Auto-fix specific package
pnpm --filter @my-ai/web lint:fix
```

### What Gets Auto-fixed

- ✅ Spacing and indentation
- ✅ Quote style
- ✅ Semicolons
- ✅ Unused imports
- ✅ Import ordering
- ✅ Trailing commas
- ✅ Type import conversions

### Manual Fixes Required

- ❌ Type errors
- ❌ Logic errors
- ❌ Complex refactoring

## Adding Dependencies

### To a Specific Package

```bash
# Production dependency
pnpm --filter @my-ai/web add <package-name>

# Dev dependency
pnpm --filter @my-ai/web add -D <package-name>
```

### To Root (Workspace-wide)

```bash
# Only for tools used by all packages
pnpm add -D -w <package-name>
```

### Internal Dependencies

Use workspace protocol:

```json
{
  "dependencies": {
    "@my-ai/ui": "workspace:*"
  }
}
```

## Creating New Packages

### 1. Choose Location

- **Apps**: `apps/` (user-facing applications)
- **Packages**: `packages/` (shared libraries)
- **Services**: `services/` (backend services)

### 2. Create Package Structure

```bash
mkdir -p packages/my-package/src
cd packages/my-package
```

### 3. Create package.json

```json
{
  "name": "@my-ai/my-package",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src --max-warnings 0",
    "lint:fix": "eslint src --fix",
    "type-check": "tsc --noEmit"
  }
}
```

### 4. Add Configuration Files

- `tsconfig.json` - Extend from `@my-ai/typescript-config`
- `.eslintrc.js` - Extend from `@my-ai/eslint-config`
- `vitest.config.ts` - If package has tests

### 5. Update Workspace

The package is automatically included via `pnpm-workspace.yaml`.

## PR Review Process

### Before Submitting PR

1. Run `pnpm pr-check` locally
2. Ensure all checks pass
3. Write descriptive PR description
4. Link related issues

### PR Checklist

- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated (if needed)
- [ ] `pnpm pr-check` passes
- [ ] No merge conflicts
- [ ] Descriptive commit messages

### After PR Submission

1. CI checks will run automatically
2. Address any failures
3. Respond to review comments
4. Make requested changes
5. Push updates (CI re-runs automatically)

## Troubleshooting

### Common Issues

#### "Module not found" errors

```bash
pnpm install
pnpm build
```

#### Lint errors in CI but not locally

```bash
rm -rf .turbo node_modules
pnpm install
pnpm lint:fix
```

#### Build cache issues

```bash
rm -rf .turbo
pnpm build
```

#### Type errors

```bash
pnpm type-check
# Fix errors manually
```

## Getting Help

- **Documentation**: Check `.claude/instructions/` directory
- **Issues**: Search existing GitHub issues
- **Questions**: Open a discussion on GitHub

## Best Practices

1. ✅ **Run `pnpm pr-check` before every PR**
2. ✅ **Use `lint:fix` for formatting issues**
3. ✅ **Write tests for new features**
4. ✅ **Keep PRs focused and small**
5. ✅ **Update documentation when needed**
6. ✅ **Use conventional commit messages**
7. ✅ **Test locally before pushing**

## Questions?

If you have questions or need help, please:

1. Check this guide
2. Review agent instructions in `.claude/instructions/`
3. Search existing issues
4. Open a new issue or discussion

Happy coding! 🚀
