# Services

This directory will contain backend services for the My AI platform.

## Future Services

Services will be added here as the platform grows. Potential services include:

- **API Gateway**: Central API for frontend communication
- **Agent Runtime**: Service for executing AI agent tasks
- **MCP Proxy**: Model Context Protocol integration service
- **Auth Service**: Authentication and authorization service
- **Database Service**: Data persistence layer

## Service Structure

Each service should follow this structure:

```
services/
└── my-service/
    ├── src/
    │   ├── index.ts
    │   └── ...
    ├── tests/
    ├── package.json
    ├── tsconfig.json
    ├── .eslintrc.js
    └── README.md
```

## Configuration

Services should:

- Extend from `@my-ai/typescript-config/node.json`
- Extend from `@my-ai/eslint-config/node`
- Include test setup with Vitest
- Follow monorepo patterns

## Adding a New Service

1. Create service directory: `mkdir services/my-service`
2. Create `package.json` with `@my-ai/my-service` name
3. Add TypeScript and ESLint configs
4. Add to workspace (automatically included)
5. Implement service logic
6. Add tests
7. Update this README

## Deployment

Services can be deployed to:

- **Google Cloud Run**: Containerized services
- **AWS Lambda**: Serverless functions
- **Vercel Functions**: API routes
- **Docker**: Self-hosted containers

Deployment configuration will be added per service.
