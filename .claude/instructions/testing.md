# Testing My AI Monorepo

## Test Framework

The monorepo uses **Vitest** as the test runner for all packages.

## Running Tests

### Test entire monorepo

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

### Test specific package

```bash
# Run tests for a specific package
pnpm --filter @my-ai/ui test

# Watch mode for specific package
pnpm --filter @my-ai/ui test:watch
```

### Examples

```bash
# Test the UI library
pnpm --filter @my-ai/ui test

# Test the web app (when tests are added)
pnpm --filter @my-ai/web test

# Run all tests
pnpm test
```

## Test Structure

### Test File Naming

Tests should be colocated with the code they test:

```
src/
  ├── button.tsx
  └── button.test.tsx
```

**Naming convention**: `*.test.{ts,tsx}`

### Test Organization

```typescript
import { describe, it, expect } from 'vitest'

describe('ComponentName', () => {
  it('does something specific', () => {
    // Arrange
    // Act
    // Assert
  })
})
```

## Writing Tests

### Unit Tests

Test individual functions and components in isolation:

```typescript
import { describe, it, expect } from 'vitest'
import { myFunction } from './my-function'

describe('myFunction', () => {
  it('returns expected result', () => {
    const result = myFunction('input')
    expect(result).toBe('expected')
  })
})
```

### Component Tests

Test React components using React Testing Library:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MyComponent } from './my-component'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

## Test Configuration

Tests are configured with:

- **Environment**: jsdom (browser-like environment)
- **Globals**: enabled (no need to import describe, it, expect)
- **Setup files**: `src/test-setup.ts`
- **Coverage**: v8 provider

## Coverage

### Generate coverage report

```bash
# Run tests with coverage
pnpm --filter @my-ai/ui test --coverage

# View coverage report
open packages/ui/coverage/index.html
```

## Continuous Integration

GitHub Actions runs `pnpm turbo run test` on every PR.

Tests must pass for PR approval.

## Testing Best Practices

1. **Write tests for new features** - Test before or alongside implementation
2. **Test edge cases** - Don't just test the happy path
3. **Keep tests simple** - One assertion per test when possible
4. **Use descriptive test names** - Explain what is being tested
5. **Mock external dependencies** - Keep tests isolated
6. **Maintain test coverage** - Aim for high coverage on critical code

## Common Testing Patterns

### Testing async code

```typescript
it('fetches data correctly', async () => {
  const data = await fetchData()
  expect(data).toEqual({ id: 1 })
})
```

### Testing user interactions

```typescript
import { render, screen, fireEvent } from '@testing-library/react'

it('handles click events', () => {
  const handleClick = vi.fn()
  render(<Button onClick={handleClick}>Click</Button>)

  fireEvent.click(screen.getByText('Click'))
  expect(handleClick).toHaveBeenCalled()
})
```

### Testing with props

```typescript
it('accepts and uses props', () => {
  render(<MyComponent title="Test Title" />)
  expect(screen.getByText('Test Title')).toBeInTheDocument()
})
```

## Troubleshooting Test Issues

### Issue: "Tests fail locally but pass in CI"

**Solution:**
- Ensure you're using Node 22.x
- Clear cache: `rm -rf node_modules && pnpm install`
- Check for local environment variables

### Issue: "Import errors in tests"

**Solution:**
- Verify test setup file is configured
- Check vitest.config.ts for correct settings
- Ensure dependencies are installed

### Issue: "Timeout errors"

**Solution:**
```typescript
// Increase timeout for specific test
it('slow operation', async () => {
  // test code
}, { timeout: 10000 }) // 10 seconds
```

## Future Testing Additions

As the monorepo grows, consider adding:

- **E2E tests**: Playwright for end-to-end testing
- **Visual regression tests**: For UI components
- **Integration tests**: Testing multiple packages together
- **Performance tests**: For critical paths
