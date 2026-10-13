# Backend — CLAUDE.md

This file covers the Express API. Shared commands, environment and the API contract are in `../.claude/CLAUDE.md`.

## Stack

Node.js, Express 5, TypeScript (ESM, `NodeNext`), Zod 3, Prisma 6 with PostgreSQL. Tests use Vitest and Supertest against a real database.

## Commands (from this folder, or with `-w Backend` from the root)

```bash
npm run dev                                   # tsx watch src/server.ts
npm run build                                 # prisma generate && tsc -p tsconfig.build.json → dist/
npm start                                     # node dist/server.js
npm test                                      # vitest run (needs TEST_DATABASE_URL)
npx vitest run tests/tasks.test.ts            # single file
npx vitest run -t "sorts by due date"         # single test by name
npm run db:migrate -- --name <change>         # new migration after editing prisma/schema.prisma
npm run prisma -- <any prisma command>        # Prisma CLI with the root .env loaded
```

## Architecture

- **ESM:** relative imports must end in `.js` (e.g. `'../config/prisma.js'`), even though the source files are `.ts`.
- `src/app.ts` builds the Express app without listening, which is what tests import. `src/server.ts` connects Prisma, listens, and shuts down cleanly.
- **Request path:** `routes/index.ts` → `controllers/` → `services/` → Prisma.
  - Controllers parse input by calling the Zod schemas in `validators/` directly (`schema.parse(req.query | req.params | req.body)`). Express 5 makes `req.query` read-only, so use the parsed value rather than writing it back.
  - Controllers do HTTP only. All Prisma access lives in services.
- **Errors:** Express 5 forwards async errors on its own, so there's no try/catch in controllers. `middleware/errorHandler.ts` maps them:
  - `ZodError` → 400 `VALIDATION_ERROR`, with `details: [{ field, message }]`
  - malformed JSON → 400 `INVALID_JSON`
  - `AppError` → its own status
  - Prisma `P2025` (record not found on update or delete) → 404
  - an unreachable database → 503
  - anything else → logged, then 500 with a generic message
- Use `sendSuccess` and `sendError` from `utils/response.ts` for every response. Delete returns 204 with no body.
- **Validators:** schemas are `.strict()`, so unknown fields are rejected. Empty descriptions become `null`. `dueDate` must be a real calendar date in `YYYY-MM-DD` form, or `null`. PUT accepts any non-empty subset of the fields.
- **Listing:** search is a case-insensitive `contains` on the title. Sorting by `dueDate` puts nulls last, and every sort adds `createdAt desc, id asc` as tie-breakers so pagination stays stable. `limit` is capped at 100.
- **Dashboard stats** come from `groupBy` and `count` queries in a single transaction, never from hard-coded values. A task is overdue when `dueDate < today` and it isn't completed.
- The Prisma client logs only warnings, because the error handler already logs unexpected errors. Expected 404s should not produce log noise.

## Tests

- `vitest.config.ts` loads the root `.env` and sets `DATABASE_URL` to `TEST_DATABASE_URL`.
- `tests/globalSetup.ts` runs `prisma migrate deploy` once against that database.
- `useCleanDatabase()` in `tests/helpers.ts` deletes every task before each test. Test files run one at a time (`fileParallelism: false`) because they share the one database.
- Never point `TEST_DATABASE_URL` at real data.
