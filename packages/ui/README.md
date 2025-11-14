# @my-ai/ui

Shared UI component library for My AI monorepo.

## Components

- `Button` - A versatile button component with multiple variants and sizes

## Usage

```tsx
import { Button } from '@my-ai/ui'

export function MyComponent() {
  return (
    <Button variant="primary" size="md">
      Click me
    </Button>
  )
}
```

## Development

```bash
# Build the library
pnpm build

# Watch mode for development
pnpm dev

# Lint
pnpm lint

# Auto-fix lint issues
pnpm lint:fix

# Type check
pnpm type-check
```
