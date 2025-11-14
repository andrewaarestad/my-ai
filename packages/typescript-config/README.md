# @my-ai/typescript-config

Shared TypeScript configuration for My AI monorepo.

## Configs

- `base.json` - Base configuration with strict type checking
- `nextjs.json` - Next.js-specific configuration
- `react-library.json` - React component library configuration
- `node.json` - Node.js service configuration

## Usage

In your package's `tsconfig.json`:

```json
{
  "extends": "@my-ai/typescript-config/nextjs.json"
}
```

## Available Configs

### Next.js Apps
```json
{
  "extends": "@my-ai/typescript-config/nextjs.json"
}
```

### React Libraries
```json
{
  "extends": "@my-ai/typescript-config/react-library.json"
}
```

### Node.js Services
```json
{
  "extends": "@my-ai/typescript-config/node.json"
}
```
