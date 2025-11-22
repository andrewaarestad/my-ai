# Gmail Integration API

This API enables fetching, storing, and syncing Gmail messages to PostgreSQL.

## Features

- Fetch Gmail messages using OAuth tokens
- Store messages, threads, and attachments in PostgreSQL
- Automatic token refresh
- Incremental sync using Gmail History API
- Background sync via cron jobs

## API Endpoints

### 1. Trigger Sync

**POST `/api/gmail/sync`**

Manually trigger a Gmail sync for the authenticated user.

**Request Body:**
```json
{
  "maxMessages": 100,           // Optional: max messages to sync (default: 100)
  "query": "newer_than:7d",     // Optional: Gmail search query
  "isInitialSync": false,       // Optional: whether this is initial sync (default: false)
  "useIncremental": false       // Optional: use incremental sync via History API
}
```

**Response:**
```json
{
  "success": true,
  "synced": 45,
  "errors": 0
}
```

### 2. Get Sync Status

**GET `/api/gmail/sync`**

Get the current sync state for the authenticated user.

**Response:**
```json
{
  "syncState": {
    "id": "...",
    "userId": "...",
    "accountEmail": "user@gmail.com",
    "lastSyncedAt": "2025-01-15T10:30:00Z",
    "historyId": "12345",
    "isSyncing": false,
    "lastError": null
  }
}
```

### 3. List Messages

**GET `/api/gmail/messages`**

Fetch stored Gmail messages from the database.

**Query Parameters:**
- `accountEmail` - Email account to filter by (optional, defaults to user's email)
- `limit` - Number of messages to return (default: 50)
- `offset` - Pagination offset (default: 0)
- `isRead` - Filter by read status (true/false)
- `isStarred` - Filter by starred status (true/false)
- `threadId` - Filter by thread ID

**Response:**
```json
{
  "messages": [...],
  "total": 250,
  "limit": 50,
  "offset": 0,
  "hasMore": true
}
```

### 4. List Threads

**GET `/api/gmail/threads`**

Fetch stored Gmail threads from the database.

**Query Parameters:**
- `accountEmail` - Email account to filter by
- `limit` - Number of threads to return (default: 50)
- `offset` - Pagination offset (default: 0)
- `hasUnread` - Filter by unread status (true/false)

**Response:**
```json
{
  "threads": [...],
  "total": 120,
  "limit": 50,
  "offset": 0,
  "hasMore": true
}
```

### 5. Cron Job (Background Sync)

**GET `/api/gmail/cron`**

Syncs emails for all users with connected Gmail accounts. Should be called by a cron scheduler.

**Headers:**
```
Authorization: Bearer YOUR_CRON_SECRET
```

**Response:**
```json
{
  "success": true,
  "processed": 5,
  "results": [
    {
      "userId": "...",
      "accountEmail": "user@gmail.com",
      "synced": 10,
      "errors": 0
    }
  ]
}
```

## Environment Variables

Add to your `.env` file:

```bash
# Required for cron job authentication
CRON_SECRET=your-random-secret-string
```

## Database Schema

### GmailMessage
Stores individual email messages with full content, metadata, and flags.

### GmailThread
Groups related messages together, tracking conversation threads.

### GmailAttachment
Stores metadata about email attachments (files not downloaded by default).

### GmailSyncState
Tracks sync status per user/account for incremental syncing.

## Usage Example

### Initial Sync (First Time)

```typescript
const response = await fetch('/api/gmail/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    maxMessages: 500,
    isInitialSync: true,
    query: 'newer_than:30d' // Last 30 days
  })
});

const result = await response.json();
console.log(`Synced ${result.synced} messages`);
```

### Incremental Sync (Ongoing)

```typescript
const response = await fetch('/api/gmail/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    useIncremental: true
  })
});
```

### Fetch Unread Messages

```typescript
const response = await fetch('/api/gmail/messages?isRead=false&limit=20');
const { messages } = await response.json();
```

## Cron Setup (Vercel)

The `vercel.json` file is configured to run sync every 15 minutes:

```json
{
  "crons": [
    {
      "path": "/api/gmail/cron",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

## Gmail API Scopes Required

Ensure your Google OAuth app has these scopes:
- `https://www.googleapis.com/auth/gmail.readonly`

## Rate Limits

Gmail API has the following quotas:
- 1 billion quota units per day
- List messages: 5 units per request
- Get message: 5 units per request

The sync service includes delays between batch requests to avoid hitting rate limits.

## Future Enhancements

- Download and store attachments
- Full-text search on message content
- Label management
- Send email functionality
- Webhook support for real-time updates
