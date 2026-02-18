# Simplified Architecture Plan

## Goal

A local-first CLI/script-based system where Claude Code can:

1. Sync personal data from various sources
2. Search over indexed data
3. Collaborate on task execution

No web UI. No SaaS complexity. Just scripts and a database.

---

## Core Architecture

```
my-ai/
├── packages/
│   ├── core/                 # Shared utilities, types, database client
│   ├── sync/                 # Data sync engines per source
│   │   ├── gmail/
│   │   ├── calendar/
│   │   ├── monarch/
│   │   └── obsidian/
│   ├── search/               # Indexing and search over synced data
│   └── tasks/                # Task management for Claude collaboration
│
├── skills/                   # Claude-invokable scripts
│   ├── sync-gmail.ts         # "Sync my latest emails"
│   ├── sync-calendar.ts      # "Sync my calendar"
│   ├── sync-monarch.ts       # "Sync my financial data"
│   ├── search-data.ts        # "Search for X in my data"
│   ├── tasks-list.ts         # "Show my tasks"
│   ├── tasks-add.ts          # "Add a task"
│   └── tasks-complete.ts     # "Mark task X done"
│
├── prisma/                   # Database schema (keep existing)
├── .env                      # Credentials and config
└── README.md
```

---

## Data Sources

### 1. Gmail (exists - extract from web app)

- Full message sync with incremental updates
- Already have: gmail-client.ts, gmail-sync.ts
- Extract and simplify token management

### 2. Google Calendar (new)

- Sync events within a date range
- Store: title, time, location, attendees, description
- Use same OAuth flow as Gmail

### 3. Monarch (new)

- Financial transactions export
- Options:
  - A) Monarch API if available
  - B) CSV export → import script
  - C) Plaid integration (more complex)
- Store: date, amount, merchant, category, account

### 4. Obsidian (new)

- Local markdown files
- Simple: glob for .md files, parse frontmatter + content
- Store: title, path, tags, content, links
- Watch for changes or manual sync

### 5. Tasks (exists - extract from web app)

- Simple task list with status
- Already have: task-service.ts
- Add: due dates, priorities, notes, subtasks

---

## Search & Indexing

Two approaches (start simple, upgrade if needed):

### Option A: SQLite Full-Text Search (Simple)

- Use Prisma with SQLite instead of Postgres
- Add FTS5 virtual tables for searchable content
- Good enough for personal data volume

### Option B: Keep Postgres + pg_trgm

- Already have Postgres setup
- Add trigram indexes for fuzzy search
- More powerful but heavier

### Option C: Embedded Vector Search (Future)

- Add embeddings for semantic search
- sqlite-vss or similar
- Only if keyword search isn't enough

**Recommendation**: Start with Postgres (already set up) + simple ILIKE queries. Add indexes later if slow.

---

## Skills Design

Each skill is a standalone script that:

1. Takes arguments from CLI
2. Does one thing well
3. Returns structured output (JSON or formatted text)
4. Can be run directly or called by Claude

### Example: `skills/sync-gmail.ts`

```typescript
#!/usr/bin/env npx tsx

import { syncGmail } from '../packages/sync/gmail'
import { getAuthToken } from '../packages/core/auth'

async function main() {
  const token = await getAuthToken('google')
  const result = await syncGmail(token, {
    maxMessages: 100,
    incremental: true,
  })

  console.log(
    JSON.stringify({
      synced: result.newMessages,
      updated: result.updatedMessages,
      total: result.totalStored,
    })
  )
}

main().catch(console.error)
```

### Example: `skills/search-data.ts`

```typescript
#!/usr/bin/env npx tsx

import { search } from '../packages/search'

const query = process.argv[2]
const sources = process.argv[3]?.split(',') || ['all']

async function main() {
  const results = await search(query, { sources })

  for (const r of results) {
    console.log(`[${r.source}] ${r.title}`)
    console.log(`  ${r.snippet}`)
    console.log(`  ${r.date}`)
    console.log()
  }
}

main().catch(console.error)
```

---

## Authentication Strategy

### For Google (Gmail, Calendar)

- One-time OAuth flow via browser
- Store refresh token in database or encrypted file
- Auto-refresh access tokens when needed

### For Monarch

- TBD based on their API
- Likely: API key or session token

### For Obsidian

- No auth needed - local files

**Implementation**: Simple `packages/core/auth.ts` that:

- Stores tokens per service
- Handles refresh
- Provides `getAuthToken(service)` function

---

## Database

Keep Prisma + Postgres (already working):

- `User` → probably not needed, single user
- `GmailMessage`, `GmailThread` → keep
- `CalendarEvent` → new
- `Transaction` → new (Monarch)
- `Note` → new (Obsidian)
- `Task` → keep, enhance

Could simplify to SQLite for true local-first, but Postgres works fine for now.

---

## Migration Path

### Phase 1: Extract Core (Day 1)

1. Create new `packages/` structure
2. Copy gmail-client.ts, gmail-sync.ts → packages/sync/gmail/
3. Copy task-service.ts → packages/tasks/
4. Simplify auth (remove NextAuth, use direct OAuth)
5. Create first skill: `skills/sync-gmail.ts`
6. Test: run skill, verify data in database

### Phase 2: Add Calendar (Day 2)

1. Create packages/sync/calendar/
2. Use same Google OAuth token
3. Create `skills/sync-calendar.ts`

### Phase 3: Add Search (Day 2-3)

1. Create packages/search/
2. Simple ILIKE search across tables
3. Create `skills/search-data.ts`

### Phase 4: Add Obsidian (Day 3)

1. Create packages/sync/obsidian/
2. Glob for .md files, parse content
3. Create `skills/sync-obsidian.ts`

### Phase 5: Add Monarch (Day 4+)

1. Research Monarch API or export format
2. Create packages/sync/monarch/
3. Create `skills/sync-monarch.ts`

### Phase 6: Enhanced Tasks (Ongoing)

1. Add due dates, priorities
2. Create task workflow skills
3. Integrate with other data (e.g., tasks from emails)

---

## What to Delete

After migration, remove:

- `apps/web/` (entire Next.js app)
- `packages/ui/` (React components)
- Vercel config
- NextAuth config

Keep:

- `prisma/` (schema and migrations)
- Core lib files (extracted to packages)

---

## Claude Workflow

With this setup, a Claude Code session looks like:

```
User: Sync my latest emails and tell me what's urgent

Claude: [runs: npx tsx skills/sync-gmail.ts]
        [runs: npx tsx skills/search-data.ts "urgent OR asap OR deadline" gmail]

        Found 3 urgent emails:
        1. "Contract deadline Friday" from legal@company.com
        2. "URGENT: Server down" from ops@company.com
        3. "Need response ASAP" from boss@company.com

        Want me to create tasks for these?

User: Yes, create tasks for 1 and 3

Claude: [runs: npx tsx skills/tasks-add.ts "Review contract - deadline Friday"]
        [runs: npx tsx skills/tasks-add.ts "Respond to boss email"]

        Created 2 tasks. Anything else?
```

---

## Questions to Resolve

1. **Monarch**: Do they have an API, or is it CSV export only?
2. **Obsidian vault location**: Where are your notes stored?
3. **Postgres vs SQLite**: Keep Postgres or go fully local?
4. **Task structure**: What fields do you need beyond title/status?
5. **Search granularity**: Full-text on everything, or specific fields?

---

## Next Steps

1. Confirm this direction makes sense
2. Start Phase 1: extract core packages
3. Build and test first skill
4. Iterate from there
