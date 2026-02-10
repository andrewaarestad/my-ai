# Plan: Hybrid CLI + Web App with Data Model Cleanup

## Vision

- **Web app (Next.js):** Google account linking, data visualization
- **CLI tools:** Gmail sync, search, and other data operations
- Both share the same database and Prisma schema

---

## Completed

### Data model cleanup
- [x] Dropped `ConnectedAccount` model (unused, duplicated `Account`)
- [x] Dropped `VerificationToken` model (unused, no email/magic-link auth)
- [x] Removed `connectedAccounts` relation from `User`
- [x] Created migration

### Removed dead web Gmail code
- [x] Deleted `apps/web/src/app/api/gmail/` (sync, messages, threads, cron routes + README)
- [x] Deleted `apps/web/src/lib/gmail-client.ts`
- [x] Deleted `apps/web/src/lib/gmail-sync.ts`
- [x] Verified type-check and lint pass

---

## Remaining Work

### Consolidate shared code into packages

**Task service → `packages/core`**
- Move `apps/web/src/lib/task-service.ts` to `packages/core/src/tasks/service.ts`
- Export from `@my-ai/core/tasks`
- Update web app API routes to import from the package

**Consolidate Prisma client**
- `packages/core/src/db/client.ts` and `apps/web/src/lib/prisma.ts` are duplicates
- Update web app to import from `@my-ai/core/db`
- Delete `apps/web/src/lib/prisma.ts`

### Wire up web app to use shared packages

- `apps/web/package.json` adds dependencies on `@my-ai/core`
- Task API routes import `TaskListService` from `@my-ai/core/tasks`
- All Prisma access goes through `@my-ai/core/db`
- `next.config.ts` updated to transpile package imports

### Verify

- Web app: Google login, task CRUD work
- CLI: `npm run auth:google`, `npm run sync:gmail`, `npm run data:search` still work
- Types and lint pass

---

## What's NOT in scope

- Adding new features (calendar sync, Obsidian, Monarch, etc.)
- Building Gmail visualization UI in the web app (future work)
- Adding CLI commands for tasks (follow-up)
- Changing auth strategy (NextAuth for web, file-based for CLI)
