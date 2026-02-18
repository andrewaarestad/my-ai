# Testing the Gmail Sync CLI

This guide walks through testing the Phase 1 CLI tools for Gmail sync and search.

## Prerequisites

### 1. Google Cloud Project Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the Gmail API:
   - APIs & Services → Library → Search "Gmail API" → Enable
4. Create OAuth credentials:
   - APIs & Services → Credentials → Create Credentials → OAuth client ID
   - Application type: **Desktop app**
   - Download the JSON or copy Client ID and Secret

### 2. Environment Variables

Create a `.env` file in the project root:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Database (Postgres)
DATABASE_URL=postgresql://user:password@localhost:5432/my_ai
DIRECT_URL=postgresql://user:password@localhost:5432/my_ai
```

### 3. Database Setup

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database (or run migrations)
pnpm db:push
```

## Testing Steps

### Step 1: Authenticate with Google

```bash
pnpm auth:google
```

**Expected behavior:**

1. Browser opens to Google sign-in
2. You grant Gmail read access
3. Terminal shows: "✓ Authentication successful!"
4. Tokens saved to `~/.my-ai/tokens.json`

**Verify:**

```bash
pnpm auth:google -- --check
```

Should show: "✓ Authenticated as your@email.com"

### Step 2: Initial Gmail Sync

```bash
# Sync with verbose output to see progress
pnpm sync:gmail -- --verbose
```

**Expected behavior:**

1. First run detects no historyId → performs initial sync
2. Fetches last 30 days of emails
3. Shows progress: "Synced 10 messages...", "Synced 20 messages..."
4. Completes with summary: `{ synced: N, errors: 0 }`
5. Saves historyId for future incremental syncs

**Verify data in database:**

```bash
pnpm db:studio
```

Check `GmailMessage`, `GmailThread`, and `GmailSyncState` tables.

### Step 3: Incremental Sync

Wait for a new email to arrive, or send yourself a test email, then:

```bash
pnpm sync:gmail -- --verbose
```

**Expected behavior:**

1. Detects existing historyId → uses History API
2. Only fetches new/changed messages since last sync
3. Much faster than initial sync
4. Updates historyId

### Step 4: Search

```bash
# Basic search
pnpm data:search "meeting"

# Search with options
pnpm data:search "important" -- --limit=10
pnpm data:search "from:someone@example.com" -- --format=json
```

**Expected behavior:**

- Returns matching emails with subject, from, date, snippet
- JSON format outputs structured data
- Exit code 2 if no results found

## Testing the Bug Fixes

### Fix 1: historyId Saved After Initial Sync

**Before fix:** Every sync was a full sync because historyId was never saved.

**Test:**

```bash
# Run initial sync
pnpm sync:gmail -- --verbose

# Check sync state in database
pnpm db:studio
# → GmailSyncState should have a historyId value

# Run again - should use incremental sync
pnpm sync:gmail -- --verbose
# → Should say "No new messages" or only sync recent changes
```

### Fix 2: All Label Changes Processed

**Before fix:** Only first message with label changes was updated.

**Test:**

1. In Gmail web, select multiple emails and mark them all as starred
2. Run sync:
   ```bash
   pnpm sync:gmail -- --verbose
   ```
3. Check database - all selected messages should have `isStarred: true`

## CLI Reference

```bash
# Authentication
pnpm auth:google              # Run OAuth flow
pnpm auth:google -- --check   # Check auth status
pnpm auth:google -- --help    # Show help

# Sync
pnpm sync:gmail               # Incremental sync (or initial if first run)
pnpm sync:gmail -- --full     # Force full sync
pnpm sync:gmail -- --limit=N  # Limit messages to sync
pnpm sync:gmail -- --verbose  # Show progress
pnpm sync:gmail -- --help     # Show help

# Search
pnpm data:search "query"                    # Search all data
pnpm data:search "query" -- --source=gmail  # Filter by source
pnpm data:search "query" -- --limit=20      # Limit results
pnpm data:search "query" -- --format=json   # JSON output
pnpm data:search -- --help                  # Show help
```

## Troubleshooting

### "Not authenticated with Google"

Run `pnpm auth:google` to authenticate.

### "GOOGLE_CLIENT_ID must be set"

Check your `.env` file has the correct environment variables.

### "Cannot find module '@my-ai/core/db'"

Run `pnpm install` to ensure packages are linked.

### Database connection errors

- Verify `DATABASE_URL` is correct
- Ensure Postgres is running
- Run `pnpm db:push` to create tables

### OAuth redirect fails

- Ensure port 3456 is available
- Check that redirect URI in Google Cloud Console matches `http://localhost:3456/callback`
