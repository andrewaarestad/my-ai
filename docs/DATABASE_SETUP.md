# Database Setup Guide

This guide will help you get your PostgreSQL database up and running for the My AI platform.

## Current Status

✅ **Prisma Schema**: Fully defined with all required tables:
- `users` - User accounts
- `accounts` - OAuth provider accounts (stores Google tokens)
- `sessions` - User sessions
- `verification_tokens` - Email verification tokens
- `connected_accounts` - Multi-account OAuth linking

❌ **Database**: Not yet connected
❌ **Migrations**: Not yet run
❌ **Prisma Client**: Not yet generated

## Prerequisites

1. **PostgreSQL Database Provider** - Choose one:
   - [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) (Recommended)
   - [Supabase](https://supabase.com/)
   - [Neon](https://neon.tech/)
   - Local PostgreSQL instance

2. **Environment Variables** - You'll need:
   - `DATABASE_URL` - Pooled connection string
   - `DIRECT_URL` - Direct connection string (for migrations)

## Step-by-Step Setup

### Step 1: Install Dependencies

```bash
# Make sure you're in the project root
cd /Users/andrew/Software/personal/my-ai

# Install all dependencies (includes Prisma CLI)
pnpm install
```

### Step 2: Set Up Your Database

#### Option A: Vercel Postgres (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Create or select your project
3. Navigate to **Storage** tab
4. Click **Create Database** → **Postgres**
5. Copy the connection strings:
   - `POSTGRES_URL` → Use as `DATABASE_URL`
   - `POSTGRES_URL_NON_POOLING` → Use as `DIRECT_URL`

#### Option B: Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project
3. Go to **Project Settings** → **Database**
4. Copy the connection string (URI format)
5. Use the same string for both `DATABASE_URL` and `DIRECT_URL`

#### Option C: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database:
   ```bash
   createdb my_ai
   ```
3. Use connection string:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/my_ai"
   DIRECT_URL="postgresql://username:password@localhost:5432/my_ai"
   ```

### Step 3: Configure Environment Variables

#### Root `.env` file

Create or update `.env` in the project root:

```env
# Database Connection
DATABASE_URL="your-pooled-connection-string"
DIRECT_URL="your-direct-connection-string"
```

#### `apps/web/.env` file

Make sure `apps/web/.env` includes:

```env
# Database Connection (required for Prisma)
DATABASE_URL="your-pooled-connection-string"
DIRECT_URL="your-direct-connection-string"

# NextAuth (already configured if Google login is working)
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (already configured)
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

**Important**: Both files need `DATABASE_URL` and `DIRECT_URL` because:
- Root `.env` is used by Prisma CLI for migrations
- `apps/web/.env` is used by the Next.js app at runtime

### Step 4: Generate Prisma Client

```bash
# Generate Prisma client based on schema
pnpm db:generate
```

This creates the TypeScript types and Prisma Client you'll use in your code.

### Step 5: Push Schema to Database

You have two options:

#### Option A: `db:push` (Quick - Development)

```bash
# Push schema directly to database (no migration files)
pnpm db:push
```

**Use this for**: Quick development, prototyping, or when you don't need migration history.

#### Option B: `db:migrate` (Recommended - Production)

```bash
# Create and apply migration
pnpm db:migrate
# When prompted, enter a migration name like: "init"
```

**Use this for**: Production deployments, when you need migration history, or team collaboration.

### Step 6: Verify Database Setup

#### Check Tables Created

```bash
# Open Prisma Studio (database GUI)
pnpm db:studio
```

This opens a web interface at `http://localhost:5555` where you can:
- View all tables
- Browse data
- Verify schema matches

#### Test Connection

```bash
# Try generating Prisma client again (should work)
pnpm db:generate

# Check if you can connect
pnpm db:studio
```

### Step 7: Verify Environment Variables

Make sure your environment variables are loaded:

```bash
# Check if DATABASE_URL is set (in root directory)
cd /Users/andrew/Software/personal/my-ai
echo $DATABASE_URL

# If empty, make sure .env file exists and has DATABASE_URL
```

## Troubleshooting

### Issue: "prisma: command not found"

**Solution**: Run `pnpm install` to install dependencies.

### Issue: "Environment variable not found: DATABASE_URL"

**Solution**: 
1. Create `.env` file in project root
2. Add `DATABASE_URL` and `DIRECT_URL`
3. Make sure `.env` is not in `.gitignore` (it should be ignored, but the file should exist locally)

### Issue: "Can't reach database server"

**Solution**:
1. Verify connection strings are correct
2. Check if database is accessible from your network
3. For Vercel Postgres, ensure you're using the correct URLs (pooled vs non-pooling)
4. Check firewall settings

### Issue: "Migration failed" or "Schema push failed"

**Solution**:
1. Check database connection: `pnpm db:studio`
2. Verify schema syntax: Check `prisma/schema.prisma` for errors
3. Try `pnpm db:push --skip-generate` to skip client generation
4. Check database permissions

### Issue: "Table already exists"

**Solution**: 
- If tables exist from a previous setup, you can:
  - Drop and recreate: `pnpm db:push --force-reset` (⚠️ **WARNING**: Deletes all data)
  - Or use migrations: `pnpm db:migrate` (safer, preserves data)

## Next Steps

Once your database is set up:

1. ✅ **Database tables created** - You should see 5 tables in Prisma Studio
2. ✅ **Prisma Client generated** - TypeScript types are available
3. ⏭️ **Next**: Configure Prisma adapter in NextAuth (see `DATABASE_ADAPTER_SETUP.md`)

## Database Schema Overview

Your database will have these tables:

- **users** - User accounts (id, email, name, image, etc.)
- **accounts** - OAuth provider accounts (stores Google tokens, refresh tokens)
- **sessions** - User sessions (if using database sessions)
- **verification_tokens** - Email verification tokens
- **connected_accounts** - Multi-account OAuth linking (custom table)

## Useful Commands

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database (development)
pnpm db:push

# Create migration (production)
pnpm db:migrate

# Open database GUI
pnpm db:studio

# Reset database (⚠️ deletes all data)
pnpm db:push --force-reset
```

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)
- [Supabase Docs](https://supabase.com/docs)
- [NextAuth Prisma Adapter](https://authjs.dev/getting-started/adapters/prisma)

