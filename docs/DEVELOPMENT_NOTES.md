# Development Notes

## Database + Auth overview

- The project now uses **Drizzle ORM** with the schema defined in `apps/web/src/db/schema.ts`.
- Database access happens through a shared singleton in `apps/web/src/lib/db.ts`. This file throws early if `DATABASE_URL` is missing, so make sure it is set before running any commands that touch the API routes or NextAuth.
- SQL migrations live in the `drizzle/` directory. `drizzle/meta/_journal.json` keeps track of which migrations have been applied.

## Workflow summary

1. **Modify the schema** inside `apps/web/src/db/schema.ts`.
2. **Generate SQL** via `pnpm db:generate`. This snapshots the current schema into `drizzle/NNNN_name.sql`.
3. **Apply schema to dev DB** with `pnpm db:push` (safe for disposable preview databases).
4. **Apply migrations in CI/production** with `pnpm db:migrate`.

All commands read configuration from `drizzle.config.ts`, so you do not need to pass additional flags.

## CI/CD expectations

- The GitHub workflow exports a `DATABASE_URL` before running `pnpm pr-check`. Use any disposable Postgres URL when running locally if you just need types to compile.
- `pnpm db:generate` is deterministic; the CI job will fail if the generated SQL differs from what is committed.
- Because we use the Drizzle adapter for NextAuth, the API route must run with the Node.js runtime (see `apps/web/src/app/api/auth/[...nextauth]/route.ts`).

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `DATABASE_URL is not defined` error on boot | Provide the env var in both root `.env` and `apps/web/.env`, or export it inline when running commands. |
| Drift between schema and migrations | Run `pnpm db:generate` again after your schema edits and commit the resulting `drizzle/` files. |
| Need a quick view of records | Run `pnpm db:studio` to open Drizzle Studio locally (requires `DATABASE_URL`). |
| OAuth sign-in fails after schema change | Make sure you applied the migration to the target database (`pnpm db:push` for dev or `pnpm db:migrate` elsewhere). |

If you ever need to reset everything locally:

```bash
rm -rf drizzle
pnpm db:generate
pnpm db:push
```

This will regenerate a clean migration history that matches the current schema.
