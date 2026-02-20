# Setup Checklist for My AI Platform

Follow this checklist to get your My AI platform up and running with Google OAuth authentication.

## ✅ Prerequisites Checklist

- [ ] Node.js 22.x or higher installed
- [ ] pnpm 10.x or higher installed
- [ ] Google account for OAuth setup
- [ ] Access to Google Cloud Console
- [ ] PostgreSQL database provider account (Vercel or Supabase)

## ✅ Installation Steps

### 1. Clone and Install Dependencies

```bash
# Clone the repository (if not already done)
git clone <your-repo-url>
cd my-ai

# Install dependencies
pnpm install
```

### 2. Set Up Database

Choose one of the following options:

#### Option A: Vercel Postgres (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Create or select your project
3. Navigate to "Storage" tab
4. Click "Create Database" → "Postgres"
5. Copy the connection strings (you'll need `POSTGRES_URL` and `POSTGRES_URL_NON_POOLING`)

#### Option B: Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project
3. Go to "Project Settings" → "Database"
4. Copy the connection string (URI format)

### 3. Configure Google OAuth

Follow the detailed guide: [Google OAuth Setup Guide](./GOOGLE_OAUTH_SETUP.md)

**Quick summary:**

1. Create a Google Cloud project
2. Enable required APIs (Google+, Calendar, Gmail, Drive)
3. Configure OAuth consent screen
4. Create OAuth 2.0 credentials
5. Add redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-domain.com/api/auth/callback/google`
6. Copy Client ID and Client Secret

### 4. Set Up Environment Variables

```bash
# Copy the root .env.example
cp .env.example .env

# Copy the web app .env.example
cp apps/web/.env.example apps/web/.env
```

Edit `apps/web/.env` with your credentials:

```env
# Database
DATABASE_URL="your-database-url"
DIRECT_URL="your-direct-database-url"  # For Vercel Postgres

# NextAuth
NEXTAUTH_SECRET="your-generated-secret"  # Generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

Also edit the root `.env`:

```env
DATABASE_URL="your-database-url"
DIRECT_URL="your-direct-database-url"
```

### 5. Generate NextAuth Secret

```bash
# Generate a random secret
openssl rand -base64 32

# Copy the output and paste it as NEXTAUTH_SECRET in apps/web/.env
```

### 6. Set Up Database Schema

```bash
# Generate Prisma client
pnpm prisma generate

# Push the schema to your database
pnpm prisma db push

# Or create a migration (recommended for production)
pnpm prisma migrate dev --name init
```

### 7. Verify Setup

```bash
# Type check (should pass after Prisma client is generated)
pnpm type-check

# Lint
pnpm lint

# Run tests
pnpm test
```

### 8. Start Development Server

```bash
# Start the dev server
pnpm dev

# Open http://localhost:3000 in your browser
```

## ✅ Testing Authentication

1. Open `http://localhost:3000` in your browser
2. Click "Sign In" button
3. You should be redirected to Google OAuth consent screen
4. Sign in with your Google account
5. Grant the requested permissions
6. You should be redirected back to the dashboard

## ✅ Common Issues & Solutions

### Issue: "Module '@prisma/client' has no exported member 'PrismaClient'"

**Solution:** Run `pnpm prisma generate` to generate the Prisma client.

### Issue: "redirect_uri_mismatch"

**Solution:** Make sure the redirect URI in Google Cloud Console matches exactly:

- `http://localhost:3000/api/auth/callback/google`

### Issue: Database connection errors

**Solution:**

1. Verify `DATABASE_URL` is correct
2. Check that your database is running and accessible
3. For Vercel Postgres, make sure you're using both `DATABASE_URL` and `DIRECT_URL`

### Issue: "NEXTAUTH_SECRET is not defined"

**Solution:**

1. Generate a secret: `openssl rand -base64 32`
2. Add it to `apps/web/.env` as `NEXTAUTH_SECRET=your-generated-secret`

## ✅ Next Steps

Once authentication is working:

- [ ] Explore the dashboard at `/dashboard`
- [ ] Check out the user profile information
- [ ] Review the connected accounts section (coming soon)
- [ ] Start building AI agents (coming soon)
- [ ] Integrate with Google APIs for data access (coming soon)

## ✅ Production Deployment

When deploying to production:

1. **Set environment variables** in your hosting platform (Vercel, etc.)
2. **Update Google OAuth redirect URIs** to include your production domain
3. **Run database migrations** before deploying new code
4. **Set `NEXTAUTH_URL`** to your production URL
5. **Keep `NEXTAUTH_SECRET`** secure and never commit it

## 📚 Additional Resources

- [Google OAuth Setup Guide](./GOOGLE_OAUTH_SETUP.md) - Detailed OAuth configuration
- [NextAuth.js Documentation](https://authjs.dev/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Main README](../README.md) - Project overview and commands

## 🆘 Need Help?

If you encounter issues not covered here:

1. Check the detailed [Google OAuth Setup Guide](./GOOGLE_OAUTH_SETUP.md)
2. Review the [NextAuth.js documentation](https://authjs.dev/)
3. Check Prisma logs: `pnpm prisma studio`
4. Open an issue on GitHub
