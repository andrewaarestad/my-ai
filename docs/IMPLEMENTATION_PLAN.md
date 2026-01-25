# Implementation Plan

## Overview

Strip out SaaS complexity, build a CLI-first personal data system.

**End state:** Claude Code can sync my data, search across it, and help manage tasks - all via simple scripts.

---

## Phase 1: Foundation

**Goal:** New package structure, auth working, one data source syncing.

### 1.1 Restructure codebase
- [ ] Create `packages/core/` with shared utilities
- [ ] Create `packages/sync/` directory structure
- [ ] Create `skills/` directory
- [ ] Update `package.json` / workspace config
- [ ] Move Prisma to `packages/core/db/`

### 1.2 Auth system
- [ ] Create `packages/core/auth/google.ts` - localhost OAuth flow
- [ ] Create `packages/core/auth/storage.ts` - token persistence
- [ ] Create `skills/auth-google.ts` - interactive auth script
- [ ] Test: run auth, verify tokens saved

### 1.3 Extract Gmail sync
- [ ] Copy gmail-client.ts → `packages/sync/gmail/client.ts`
- [ ] Copy gmail-sync.ts → `packages/sync/gmail/sync.ts`
- [ ] Refactor to use new auth module (remove NextAuth deps)
- [ ] Create `skills/sync-gmail.ts`
- [ ] Test: sync emails, verify in database

### 1.4 Basic search
- [ ] Add tsvector columns to GmailMessage
- [ ] Create `packages/search/index.ts` - simple keyword search
- [ ] Create `skills/search.ts` - search CLI
- [ ] Test: search emails by keyword

**Deliverable:** Can auth with Google, sync Gmail, search emails via CLI.

---

## Phase 2: Calendar + Monarch

**Goal:** Add two more data sources.

### 2.1 Google Calendar sync
- [ ] Create `packages/sync/calendar/client.ts`
- [ ] Create `packages/sync/calendar/sync.ts`
- [ ] Add CalendarEvent model to Prisma schema
- [ ] Create `skills/sync-calendar.ts`
- [ ] Add calendar to search

### 2.2 Monarch integration
- [ ] Research Monarch API (endpoints, auth, rate limits)
- [ ] Create `packages/core/auth/monarch.ts` - API key storage
- [ ] Create `packages/sync/monarch/client.ts`
- [ ] Create `packages/sync/monarch/sync.ts`
- [ ] Add Transaction model to Prisma schema
- [ ] Create `skills/sync-monarch.ts`
- [ ] Create `skills/auth-monarch.ts`
- [ ] Add transactions to search

**Deliverable:** Sync emails, calendar, and financial data.

---

## Phase 3: Obsidian Integration

**Goal:** Read/write notes and tasks from Obsidian vault.

### 3.1 Setup Obsidian vault
- [ ] Create vault directory (or use existing)
- [ ] Configure sync (iCloud/Obsidian Sync)
- [ ] Install Tasks plugin
- [ ] Define folder structure (e.g., `notes/`, `tasks/`, `daily/`)

### 3.2 Obsidian read/write
- [ ] Create `packages/sync/obsidian/reader.ts` - parse markdown + frontmatter
- [ ] Create `packages/sync/obsidian/writer.ts` - create/update notes
- [ ] Create `packages/sync/obsidian/tasks.ts` - parse/write task format
- [ ] Create `skills/notes-search.ts`
- [ ] Create `skills/notes-create.ts`
- [ ] Create `skills/tasks-list.ts`
- [ ] Create `skills/tasks-add.ts`
- [ ] Create `skills/tasks-complete.ts`

### 3.3 Index notes in Postgres (optional)
- [ ] Add Note model to schema
- [ ] Sync note metadata + content to Postgres for unified search
- [ ] Add notes to search skill

**Deliverable:** Claude can read/write notes, manage tasks via Obsidian.

---

## Phase 4: Unified Search

**Goal:** Search across all data sources with one command.

### 4.1 Unified search index
- [ ] Create SearchableContent table (or use materialized view)
- [ ] Add tsvector indexes to all content tables
- [ ] Create `packages/search/unified.ts`
- [ ] Update `skills/search.ts` to search all sources

### 4.2 Search improvements
- [ ] Add date filters
- [ ] Add source type filters
- [ ] Add result ranking/scoring
- [ ] Format results nicely for Claude

**Deliverable:** `skills/search.ts "budget" --sources=gmail,transactions --after=2024-01-01`

---

## Phase 5: Cleanup

**Goal:** Remove old SaaS code, finalize structure.

### 5.1 Delete unused code
- [ ] Remove `apps/web/` (Next.js app)
- [ ] Remove `packages/ui/` (React components)
- [ ] Remove Vercel config
- [ ] Remove NextAuth dependencies
- [ ] Clean up unused Prisma models

### 5.2 Documentation
- [ ] Update README with new architecture
- [ ] Document each skill (usage, args, output)
- [ ] Add setup instructions

**Deliverable:** Clean codebase, documented skills.

---

## File Structure (End State)

```
my-ai/
├── packages/
│   ├── core/
│   │   ├── auth/
│   │   │   ├── google.ts        # OAuth localhost flow
│   │   │   ├── monarch.ts       # API key management
│   │   │   └── storage.ts       # Token/key persistence
│   │   ├── db/
│   │   │   ├── prisma/          # Schema + migrations
│   │   │   └── client.ts        # Prisma client export
│   │   └── utils/
│   │       └── index.ts         # Shared helpers
│   │
│   ├── sync/
│   │   ├── gmail/
│   │   │   ├── client.ts        # Gmail API wrapper
│   │   │   └── sync.ts          # Sync logic
│   │   ├── calendar/
│   │   │   ├── client.ts
│   │   │   └── sync.ts
│   │   ├── monarch/
│   │   │   ├── client.ts
│   │   │   └── sync.ts
│   │   └── obsidian/
│   │       ├── reader.ts        # Parse markdown
│   │       ├── writer.ts        # Write markdown
│   │       └── tasks.ts         # Task format handling
│   │
│   └── search/
│       ├── index.ts             # Search entry point
│       └── unified.ts           # Cross-source search
│
├── skills/
│   ├── auth-google.ts           # Interactive Google OAuth
│   ├── auth-monarch.ts          # Set Monarch API key
│   ├── sync-gmail.ts            # Sync Gmail
│   ├── sync-calendar.ts         # Sync Calendar
│   ├── sync-monarch.ts          # Sync transactions
│   ├── sync-all.ts              # Sync everything
│   ├── search.ts                # Search all data
│   ├── notes-search.ts          # Search Obsidian notes
│   ├── notes-create.ts          # Create a note
│   ├── tasks-list.ts            # List tasks
│   ├── tasks-add.ts             # Add a task
│   └── tasks-complete.ts        # Complete a task
│
├── .env                         # Credentials
└── README.md
```

---

## Schema Changes

```prisma
// New models to add

model CalendarEvent {
  id           String   @id
  userId       String
  summary      String?
  description  String?
  location     String?
  startTime    DateTime
  endTime      DateTime
  attendees    Json?

  searchVector Unsupported("tsvector")?

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Transaction {
  id          String   @id
  userId      String
  date        DateTime
  amount      Decimal
  merchant    String?
  category    String?
  account     String?
  notes       String?

  searchVector Unsupported("tsvector")?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Note {
  id          String   @id @default(cuid())
  userId      String
  path        String      // Obsidian file path
  title       String
  content     String
  tags        String[]
  frontmatter Json?

  searchVector Unsupported("tsvector")?

  syncedAt    DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## Estimated Effort

| Phase | Scope | Estimate |
|-------|-------|----------|
| Phase 1 | Foundation + Gmail | 4-6 hours |
| Phase 2 | Calendar + Monarch | 4-6 hours |
| Phase 3 | Obsidian | 3-4 hours |
| Phase 4 | Unified search | 2-3 hours |
| Phase 5 | Cleanup | 1-2 hours |

**Total:** ~15-20 hours of implementation

---

## Open Questions

1. **Obsidian vault location** - Where should it live? (`~/Documents/notes/`?)
2. **Monarch API** - Need to verify endpoints and auth method
3. **Task format** - Use Obsidian Tasks plugin syntax, or custom?
4. **Sync frequency** - Manual only, or add a cron/daemon option?

---

## Next Steps

1. Confirm this plan looks right
2. Start Phase 1.1: restructure codebase
3. Build incrementally, test each piece
