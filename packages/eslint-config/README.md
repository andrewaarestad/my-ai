# @my-ai/eslint-config

Shared ESLint configuration for My AI monorepo.

## Configs

- `base.js` - Base configuration with TypeScript support
- `nextjs.js` - Next.js-specific configuration
- `react-library.js` - React component library configuration
- `node.js` - Node.js service configuration

## Usage

In your package's `.eslintrc.js`:

```javascript
module.exports = {
  root: true,
  extends: ['@my-ai/eslint-config/nextjs']
}
```

## Available Configs

### Next.js Apps
```javascript
module.exports = {
  root: true,
  extends: ['@my-ai/eslint-config/nextjs']
}
```

### React Libraries
```javascript
module.exports = {
  root: true,
  extends: ['@my-ai/eslint-config/react-library']
}
```

### Node.js Services
```javascript
module.exports = {
  root: true,
  extends: ['@my-ai/eslint-config/node']
}
```

## Linting

Run lint:
```bash
pnpm lint
```

Auto-fix issues:
```bash
pnpm lint:fix
```
