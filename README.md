# My AI

A platform for building and managing AI agents to tackle personal tasks.

## Overview

My AI is a monorepo-based platform that provides a web interface for managing AI agents, Model Context Protocol (MCP) integrations, and authorization configurations.

## Tech Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Frontend**: Next.js 16 with App Router, React 19, Tailwind CSS
- **Language**: TypeScript (strict mode)
- **Authentication**: NextAuth.js v5 (Auth.js) with Google OAuth
- **Database**: Prisma ORM with PostgreSQL (Vercel Postgres/Supabase)
- **Testing**: Vitest + React Testing Library
- **Build Tools**: Turbopack (Next.js), tsup (libraries)
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel (web app)

## Repository Structure

```
my-ai/
├── apps/
│   └── web/              # Next.js frontend application
├── packages/
│   ├── eslint-config/    # Shared ESLint configuration
│   ├── typescript-config/# Shared TypeScript configuration
│   └── ui/               # Shared React component library
├── services/             # Backend services (coming soon)
├── prisma/               # Database schema and migrations
├── docs/                 # Documentation
├── .claude/
│   ├── commands/         # Custom Claude Code commands
│   └── instructions/     # Agent development guides
└── .github/
    └── workflows/        # CI/CD workflows
```

## Getting Started

### Prerequisites

- **Node.js**: 22.x or higher
- **pnpm**: 10.x or higher

### Installation

```bash
# Install pnpm (if not already installed)
npm install -g pnpm@10

# Install dependencies
pnpm install
```

### Development

```bash
# Run all apps in development mode
pnpm dev

# Run specific app
pnpm --filter @my-ai/web dev
```

The web app will be available at [http://localhost:3000](http://localhost:3000).

### Authentication Setup

The platform uses Google OAuth for authentication. To set it up:

1. **Set up a PostgreSQL database**:
   - Option A: [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) (recommended)
   - Option B: [Supabase](https://supabase.com/)

2. **Configure Google OAuth**:
   - Follow the [Google OAuth Setup Guide](./docs/GOOGLE_OAUTH_SETUP.md)
   - Get your credentials from [Google Cloud Console](https://console.cloud.google.com/)

3. **Set up environment variables**:
   ```bash
   # Copy the example file
   cp apps/web/.env.example apps/web/.env

   # Edit apps/web/.env with your credentials
   ```

4. **Run database migrations**:
   ```bash
   # Generate Prisma client
   pnpm prisma generate

   # Push schema to database
   pnpm prisma db push
   ```

5. **Start the development server**:
   ```bash
   pnpm dev
   ```

For detailed instructions, see [docs/GOOGLE_OAUTH_SETUP.md](./docs/GOOGLE_OAUTH_SETUP.md).

### Database Management

```bash
# Generate Prisma client (required after schema changes)
pnpm db:generate

# Push schema changes to database (development)
pnpm db:push

# Create and run migrations (production)
pnpm db:migrate

# Open Prisma Studio (database GUI)
pnpm db:studio
```

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @my-ai/web build
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests for specific package
pnpm --filter @my-ai/ui test
```

### Linting & Type Checking

```bash
# Auto-fix lint issues (recommended!)
pnpm lint:fix

# Check for lint issues
pnpm lint

# Type check all packages
pnpm type-check
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development servers |
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm lint` | Check for lint issues |
| `pnpm lint:fix` | Auto-fix lint issues |
| `pnpm type-check` | Run TypeScript type checking |
| `pnpm format` | Format code with Prettier |
| `pnpm clean` | Clean all build artifacts |
| `pnpm pr-check` | Run all PR checks locally |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:push` | Push schema to database (dev) |
| `pnpm db:migrate` | Create and run migrations |
| `pnpm db:studio` | Open Prisma Studio GUI |

## Packages

### Apps

- **[@my-ai/web](./apps/web)**: Next.js frontend for managing AI agents

### Shared Packages

- **[@my-ai/ui](./packages/ui)**: Shared React component library
- **[@my-ai/typescript-config](./packages/typescript-config)**: Shared TypeScript configurations
- **[@my-ai/eslint-config](./packages/eslint-config)**: Shared ESLint configurations

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines and workflow.

## Agent Instructions

Agent-agnostic development instructions are available in [`.claude/instructions/`](./.claude/instructions/):

- **[spec-alignment.md](./.claude/instructions/spec-alignment.md)**: Project specification alignment and compliance
- **[development.md](./.claude/instructions/development.md)**: Understanding the monorepo structure
- **[building.md](./.claude/instructions/building.md)**: Building packages
- **[testing.md](./.claude/instructions/testing.md)**: Running tests
- **[linting.md](./.claude/instructions/linting.md)**: Linting and auto-fixing code
- **[pr-workflow.md](./.claude/instructions/pr-workflow.md)**: PR preparation workflow

## CI/CD

This repository uses GitHub Actions for continuous integration:

- **PR Checks**: Runs on every pull request
  - Linting
  - Type checking
  - Testing
  - Building

All checks must pass before merging.

## Deployment

### Web App (Vercel)

The Next.js app is deployed to Vercel automatically on push to `main`.

Configuration: `vercel.json`

### Environment Variables

See `.env.example` files in individual apps for required environment variables.

## Performance

- **Turborepo caching**: Speeds up builds by caching outputs
- **pnpm workspaces**: Efficient dependency management
- **Turbopack**: Fast Next.js bundling in development
- **Parallel execution**: Turborepo runs tasks in parallel where possible

## License

Private - All Rights Reserved

## Support

For issues or questions:
- Check the [agent instructions](./.claude/instructions/)
- Review [CONTRIBUTING.md](./CONTRIBUTING.md)
- Open an issue on GitHub
