# Google OAuth Setup Guide

This guide will walk you through setting up Google OAuth for the My AI platform.

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click "New Project"
4. Enter a project name (e.g., "My AI Platform")
5. Click "Create"

## Step 2: Enable Required APIs

1. In the Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for and enable the following APIs (only if you need these features):
   - **Google Calendar API** (for calendar data access)
   - **Gmail API** (for email data access)
   - **Google Drive API** (for drive data access)

   > **Note:** For user profile information, you do not need to enable any specific API. The OAuth scopes (`openid`, `userinfo.email`, `userinfo.profile`) are sufficient.
## Step 3: Configure OAuth Consent Screen

1. Navigate to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type (unless you have a Google Workspace account)
3. Click "Create"
4. Fill in the required information:
   - **App name**: My AI Platform
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
5. Click "Save and Continue"
6. **Scopes**: Click "Add or Remove Scopes" and add the following:
   - `openid`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/calendar.readonly` (optional, for calendar access)
   - `https://www.googleapis.com/auth/gmail.readonly` (optional, for Gmail access)
   - `https://www.googleapis.com/auth/drive.readonly` (optional, for Drive access)
7. Click "Save and Continue"
8. **Test users**: Add your email address as a test user (required for testing)
9. Click "Save and Continue"
10. Review and click "Back to Dashboard"

## Step 4: Create OAuth 2.0 Credentials

1. Navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Enter a name (e.g., "My AI Web Client")
5. **Authorized JavaScript origins**: Add the following:
   - `http://localhost:3000` (for local development)
   - Your production domain (e.g., `https://my-ai.vercel.app`)
6. **Authorized redirect URIs**: Add the following:
   - `http://localhost:3000/api/auth/callback/google` (for local development)
   - `https://your-domain.com/api/auth/callback/google` (for production)
7. Click "Create"
8. **Important**: Copy the Client ID and Client Secret

## Step 5: Configure Environment Variables

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp apps/web/.env.example apps/web/.env
   ```

2. Update the `.env` file with your Google OAuth credentials:
   ```env
   # Google OAuth
   GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-client-secret"

   # NextAuth
   NEXTAUTH_SECRET="generate-a-random-secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. Generate a random secret for `NEXTAUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

## Step 6: Set Up Database

You need to set up a PostgreSQL database before you can use authentication. You have two recommended options:

### Option A: Vercel Postgres (Recommended)

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to the "Storage" tab
4. Click "Create Database" > "Postgres"
5. Copy the connection strings and add them to your `.env`:
   ```env
   DATABASE_URL="your-vercel-postgres-url"
   DIRECT_URL="your-vercel-postgres-direct-url"
   ```

### Option B: Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project
3. Go to "Project Settings" > "Database"
4. Copy the connection string and add it to your `.env`:
   ```env
   DATABASE_URL="your-supabase-connection-string"
   DIRECT_URL="your-supabase-connection-string"
   ```

## Step 7: Run Database Migrations

1. Generate the Prisma client:
   ```bash
   pnpm prisma generate
   ```

2. Push the database schema:
   ```bash
   pnpm prisma db push
   ```

   Or create a migration:
   ```bash
   pnpm prisma migrate dev --name init
   ```

## Step 8: Test the Integration

1. Start the development server:
   ```bash
   pnpm dev
   ```

2. Open your browser and navigate to `http://localhost:3000`
3. Click "Sign In"
4. You should be redirected to Google's OAuth consent screen
5. Select your Google account and grant permissions
6. You should be redirected back to your application and signed in

## Troubleshooting

### Error: "redirect_uri_mismatch"

This error means the redirect URI in your Google Cloud Console doesn't match the one being used by your app.

**Solution**: Make sure the redirect URI in Google Cloud Console exactly matches:
- `http://localhost:3000/api/auth/callback/google` for local development
- `https://your-domain.com/api/auth/callback/google` for production

### Error: "Access blocked: This app's request is invalid"

This usually happens when the OAuth consent screen is not fully configured.

**Solution**:
1. Go back to the OAuth consent screen settings
2. Make sure all required fields are filled in
3. Add your email as a test user
4. Publish the app (or keep it in testing mode and add test users)

### Error: "This app is blocked"

This happens when your app requests sensitive or restricted scopes but hasn't been verified by Google.

**Solution**:
1. For development/testing, keep the app in "Testing" mode in the OAuth consent screen
2. Add test users who need access
3. For production, you may need to go through Google's verification process

### Database Connection Errors

**Solution**:
1. Make sure your database is running and accessible
2. Check that the `DATABASE_URL` and `DIRECT_URL` are correct
3. Make sure you've run `pnpm prisma generate` and `pnpm prisma db push`

## Security Best Practices

1. **Never commit `.env` files**: Make sure `.env` is in your `.gitignore`
2. **Rotate secrets regularly**: Change your `NEXTAUTH_SECRET` periodically
3. **Use environment variables in production**: Set all environment variables in your hosting platform (Vercel, etc.)
4. **Limit scopes**: Only request the Google API scopes you actually need
5. **Review permissions**: Regularly audit which apps have access to your Google account

## Next Steps

- Set up additional OAuth providers (GitHub, Microsoft, etc.)
- Implement multi-account linking for accessing multiple Google accounts
- Add token refresh logic for long-lived access
- Implement data access features (Calendar, Gmail, Drive integration)

## Additional Resources

- [NextAuth.js Documentation](https://authjs.dev/)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Google Cloud Console](https://console.cloud.google.com/)
