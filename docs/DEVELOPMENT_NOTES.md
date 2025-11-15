# Development Notes

## Database Setup with Drizzle ORM

This project uses Drizzle ORM for database management. Unlike Prisma, Drizzle doesn't require a client generation step, making CI/CD setup simpler.

### Why This is Better Than Prisma

1. **No client generation required**: Drizzle works directly with your schema files
2. **Faster build times**: No code generation step needed
3. **Better Edge runtime support**: Works seamlessly with Next.js Edge functions
4. **Smaller bundle size**: More tree-shakeable than Prisma
5. **Type-safe queries**: Full TypeScript inference without codegen

### Local Development Setup

Before running the application locally, you need to:

1. **Set up your database** (see [docs/SETUP_CHECKLIST.md](./docs/SETUP_CHECKLIST.md))
2. **Configure environment variables**:
   ```bash
   cp apps/web/.env.example apps/web/.env
   # Edit apps/web/.env with your DATABASE_URL
   ```
3. **Push schema to database**:
   ```bash
   pnpm db:push
   ```
4. **Run the application**:
   ```bash
   pnpm dev
   ```

### Database Commands

```bash
# Push schema changes to database (development)
pnpm db:push

# Generate migration files (production)
pnpm db:generate

# Run migrations (production)
pnpm db:migrate

# Open Drizzle Studio (database GUI)
pnpm db:studio
```

### CI/CD Setup

The CI/CD pipeline no longer needs to generate a database client. PR checks will pass as long as:

- ✅ **Linting**: Code follows ESLint rules
- ✅ **Type Checking**: TypeScript types are valid
- ✅ **Testing**: All tests pass
- ✅ **Building**: Application builds successfully

The workflow automatically sets a mock `DATABASE_URL` for builds, but doesn't actually need to connect to a database.

### Current Status

- ✅ **Linting**: Passing
- ✅ **Type Checking**: Passing
- ✅ **Testing**: Passing (all packages)
- ✅ **Building**: Passing

All checks pass without any additional setup steps.

### Making Schema Changes

When you modify the database schema:

1. Edit `db/schema.ts`
2. Push changes to your development database: `pnpm db:push`
3. For production, generate migrations: `pnpm db:generate`
4. Commit both the schema changes and migration files

### Advantages Over Prisma

| Feature | Drizzle | Prisma |
|---------|---------|--------|
| Client Generation | Not required | Required (`prisma generate`) |
| CI/CD Setup | Simple | Needs generation step |
| Bundle Size | ~30KB | ~200KB+ |
| Query Performance | ~30% faster | Baseline |
| Edge Runtime | Full support | Limited support |
| TypeScript Inference | Excellent | Good |
| SQL-like Syntax | Yes | No (custom DSL) |

### Troubleshooting

**Database connection errors:**
- Verify `DATABASE_URL` in your `.env` file
- Check that your database is accessible
- Ensure the connection string format is correct

**Schema changes not reflected:**
- Run `pnpm db:push` to sync schema with database
- Check the Drizzle Studio to verify changes

**Type errors:**
- Restart your TypeScript server in your IDE
- Check that your schema file has no syntax errors
