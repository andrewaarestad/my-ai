# Implementation Plan

## Overview

Strip out SaaS complexity, build a CLI-first personal data system.

**End state:** Robust CLI tools for syncing and searching personal data. An agent (or human) can invoke these tools, but the tools themselves are deterministic scripts with no LLM dependencies.

---

## Philosophy

**Tools vs. Agents:**
- **Tools** = Deterministic scripts that do one job well (sync, search, export)
- **Agents** = LLM-powered workflows that decide which tools to use and interpret results

Phase 1 builds **tools only**. Agentic workflows come later and simply invoke these tools.

A tool doesn't know or care if it was run by:
- A human typing `npm run sync:gmail`
- Claude Code running the same command
- A cron job

---

## Phase 1: Foundation (Tools Only)

**Goal:** New package structure, auth working, Gmail syncing, basic search. All deterministic CLI commands.

### 1.1 Restructure codebase
- [ ] Create `packages/core/` - shared utilities, db client, types
- [ ] Create `packages/sync/` - data sync engines
- [ ] Create `scripts/` - CLI entry points (not "skills" yet)
- [ ] Update `package.json` / pnpm workspace config
- [ ] Add npm scripts for common commands

### 1.2 Auth CLI
- [ ] Create `packages/core/auth/google.ts` - localhost OAuth flow
- [ ] Create `packages/core/auth/storage.ts` - token persistence (file or db)
- [ ] Create `scripts/auth-google.ts` - CLI to run OAuth flow
- [ ] Add: `npm run auth:google` → runs OAuth, saves refresh token
- [ ] Test: run auth, verify tokens saved, can refresh

### 1.3 Gmail sync CLI
- [ ] Extract gmail-client.ts → `packages/sync/gmail/client.ts`
- [ ] Extract gmail-sync.ts → `packages/sync/gmail/sync.ts`
- [ ] Refactor to use new auth module (remove NextAuth deps)
- [ ] Create `scripts/sync-gmail.ts` - CLI entry point
- [ ] Add: `npm run sync:gmail` → syncs emails to Postgres
- [ ] Add: `npm run sync:gmail -- --full` → full re-sync
- [ ] Add: `npm run sync:gmail -- --limit=100` → sync last N
- [ ] Test: sync emails, verify in database

### 1.4 Search CLI
- [ ] Add tsvector column + index to GmailMessage
- [ ] Create migration for full-text search setup
- [ ] Create `packages/search/index.ts` - query builder
- [ ] Create `scripts/search.ts` - CLI entry point
- [ ] Add: `npm run search "keyword"` → returns matching emails
- [ ] Add: `npm run search "keyword" -- --limit=20 --format=json`
- [ ] Test: search emails, verify results

### 1.5 CLI output standards
- [ ] Define output formats: human-readable (default), JSON (--format=json)
- [ ] Define exit codes: 0=success, 1=error, 2=no results
- [ ] Add --quiet flag for scripting
- [ ] Add --verbose flag for debugging

**Deliverable:** Four working CLI commands:
```bash
npm run auth:google          # One-time OAuth setup
npm run sync:gmail           # Sync emails to database
npm run sync:gmail -- --full # Full re-sync
npm run search "query"       # Search emails
```

---

## Phase 2: Calendar + Monarch

**Goal:** Add two more data sources with same CLI pattern.

### 2.1 Google Calendar sync
- [ ] Create `packages/sync/calendar/client.ts`
- [ ] Create `packages/sync/calendar/sync.ts`
- [ ] Add CalendarEvent model to Prisma schema
- [ ] Create `scripts/sync-calendar.ts`
- [ ] Add: `npm run sync:calendar`
- [ ] Add: `npm run sync:calendar -- --days=30` (sync window)
- [ ] Add calendar events to search index

### 2.2 Monarch integration
- [ ] Research Monarch API (endpoints, auth, rate limits)
- [ ] Create `packages/core/auth/apikeys.ts` - API key storage
- [ ] Create `packages/sync/monarch/client.ts`
- [ ] Create `packages/sync/monarch/sync.ts`
- [ ] Add Transaction model to Prisma schema
- [ ] Create `scripts/sync-monarch.ts`
- [ ] Add: `npm run auth:monarch` - store API key
- [ ] Add: `npm run sync:monarch`
- [ ] Add: `npm run sync:monarch -- --months=3`
- [ ] Add transactions to search index

**Deliverable:**
```bash
npm run sync:calendar        # Sync calendar events
npm run sync:monarch         # Sync financial transactions
npm run search "query"       # Now searches emails + calendar + transactions
```

---

## Phase 3: Obsidian Integration

**Goal:** CLI tools to read/write notes and tasks from Obsidian vault.

### 3.1 Setup Obsidian vault
- [ ] Create vault directory (or use existing)
- [ ] Configure sync (iCloud/Obsidian Sync)
- [ ] Install Tasks plugin
- [ ] Define folder structure (e.g., `notes/`, `tasks/`, `daily/`)

### 3.2 Obsidian CLI tools
- [ ] Create `packages/obsidian/reader.ts` - parse markdown + frontmatter
- [ ] Create `packages/obsidian/writer.ts` - create/update notes
- [ ] Create `packages/obsidian/tasks.ts` - parse/write task format
- [ ] Create `scripts/notes-list.ts`
- [ ] Create `scripts/notes-read.ts`
- [ ] Create `scripts/notes-create.ts`
- [ ] Create `scripts/tasks-list.ts`
- [ ] Create `scripts/tasks-add.ts`
- [ ] Create `scripts/tasks-complete.ts`

### 3.3 Index notes in Postgres
- [ ] Add Note model to schema
- [ ] Create `scripts/sync-notes.ts` - index note content to Postgres
- [ ] Add: `npm run sync:notes`
- [ ] Add notes to unified search

**Deliverable:**
```bash
npm run notes:list                    # List all notes
npm run notes:read "path/to/note"     # Read a note
npm run notes:create "title"          # Create a note (reads content from stdin)
npm run tasks:list                    # List all tasks
npm run tasks:add "task description"  # Add a task
npm run tasks:complete "task-id"      # Mark task done
npm run sync:notes                    # Index notes to Postgres for search
```

---

## Phase 4: Unified Search

**Goal:** Search across all data sources with one command.

### 4.1 Unified search index
- [ ] Create SearchableContent table (or use materialized view)
- [ ] Add tsvector indexes to all content tables
- [ ] Create `packages/search/unified.ts`
- [ ] Update `scripts/search.ts` to query all sources

### 4.2 Search CLI options
- [ ] Add `--source=gmail,calendar,transactions,notes` filter
- [ ] Add `--after=2024-01-01` and `--before=` date filters
- [ ] Add `--limit=N` result limit
- [ ] Add `--format=json` for structured output
- [ ] Add result ranking/scoring by relevance

**Deliverable:**
```bash
npm run search "budget"                           # Search everything
npm run search "meeting" -- --source=calendar     # Search only calendar
npm run search "amazon" -- --source=transactions --after=2024-01-01
npm run search "project" -- --format=json         # JSON output for scripting
```

---

## Phase 5: Cleanup + Documentation

**Goal:** Remove old SaaS code, document the CLI tools.

### 5.1 Delete unused code
- [ ] Remove `apps/web/` (Next.js app)
- [ ] Remove `packages/ui/` (React components)
- [ ] Remove Vercel config
- [ ] Remove NextAuth dependencies
- [ ] Clean up unused Prisma models (Session, etc.)

### 5.2 Documentation
- [ ] Update README with new architecture
- [ ] Document each CLI command (usage, args, output, exit codes)
- [ ] Add setup instructions (env vars, database, OAuth setup)
- [ ] Add examples of common workflows

**Deliverable:** Clean codebase, fully documented CLI.

---

## Future: Agentic Layer (Not in Scope)

Once the CLI tools are solid, a future phase could add:
- Agent workflows that orchestrate multiple CLI tools
- Natural language interface to the tools
- Automated insights/summaries

But the tools themselves remain deterministic. The agent just decides which tools to call and interprets results.

---

## File Structure (End State)

```
my-ai/
├── packages/
│   ├── core/                    # Shared infrastructure
│   │   ├── auth/
│   │   │   ├── google.ts        # OAuth localhost flow
│   │   │   ├── apikeys.ts       # API key management (Monarch, etc.)
│   │   │   └── storage.ts       # Token/key persistence
│   │   ├── db/
│   │   │   └── client.ts        # Prisma client export
│   │   └── index.ts             # Package entry point
│   │
│   ├── sync/                    # Data sync engines
│   │   ├── gmail/
│   │   │   ├── client.ts        # Gmail API wrapper
│   │   │   └── sync.ts          # Sync logic
│   │   ├── calendar/
│   │   │   ├── client.ts
│   │   │   └── sync.ts
│   │   ├── monarch/
│   │   │   ├── client.ts
│   │   │   └── sync.ts
│   │   └── index.ts             # Package entry point
│   │
│   ├── obsidian/                # Obsidian vault operations
│   │   ├── reader.ts            # Parse markdown + frontmatter
│   │   ├── writer.ts            # Write markdown files
│   │   ├── tasks.ts             # Task format handling
│   │   └── index.ts
│   │
│   └── search/                  # Search across all data
│       ├── index.ts             # Search entry point
│       └── unified.ts           # Cross-source query builder
│
├── scripts/                     # CLI entry points (deterministic tools)
│   ├── auth-google.ts           # npm run auth:google
│   ├── auth-monarch.ts          # npm run auth:monarch
│   ├── sync-gmail.ts            # npm run sync:gmail
│   ├── sync-calendar.ts         # npm run sync:calendar
│   ├── sync-monarch.ts          # npm run sync:monarch
│   ├── sync-notes.ts            # npm run sync:notes
│   ├── sync-all.ts              # npm run sync:all
│   ├── search.ts                # npm run search
│   ├── notes-list.ts            # npm run notes:list
│   ├── notes-read.ts            # npm run notes:read
│   ├── notes-create.ts          # npm run notes:create
│   ├── tasks-list.ts            # npm run tasks:list
│   ├── tasks-add.ts             # npm run tasks:add
│   └── tasks-complete.ts        # npm run tasks:complete
│
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── migrations/              # Migration history
│
├── package.json                 # npm scripts defined here
├── .env                         # Credentials (gitignored)
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

## CLI Conventions

All scripts follow these conventions:

**Output:**
- Default: Human-readable text
- `--format=json`: Structured JSON for scripting/piping
- `--quiet`: Suppress non-essential output
- `--verbose`: Debug output

**Exit codes:**
- `0`: Success
- `1`: Error (with message to stderr)
- `2`: No results found (for search)

**Arguments:**
- Use `--` to separate npm script args: `npm run search "query" -- --limit=10`
- Flags use GNU-style: `--flag=value` or `--flag value`

---

## Open Questions

1. **Obsidian vault location** - Where should it live? (`~/Documents/notes/`?)
2. **Monarch API** - Need to verify endpoints and auth method
3. **Task format** - Use Obsidian Tasks plugin syntax, or custom?
4. **Sync frequency** - Manual-only for now, cron can be added later

---

## Next Steps

1. Confirm this plan looks right
2. Start Phase 1.1: restructure codebase into packages/
3. Build and test each CLI tool incrementally
4. Each tool should work standalone before moving to next
