# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

TaskFlow is a full-stack task management app: a React SPA in `Frontend/`, an Express REST API in `Backend/`, and PostgreSQL via Prisma. The original spec (features, design rules, definition of done) is in `readme` at the repo root. Setup, scripts, API reference and troubleshooting are in `README.md`.

Each app has its own `CLAUDE.md` with stack, structure and conventions: `Frontend/CLAUDE.md` and `Backend/CLAUDE.md`.

The repo is an npm workspace (`Backend`, `Frontend`). Install from the root, and run per-app scripts with `-w Backend` / `-w Frontend`.

## Commands (from the repo root)

```bash
npm install          # both apps; postinstall runs prisma generate
npm run dev          # API (tsx watch, $PORT) + frontend (Vite, :5173)
npm run build        # Backend/dist + Frontend/dist
npm test             # backend tests, then frontend tests
npm run lint
npm run typecheck
npm run db:migrate   # prisma migrate dev against DATABASE_URL
npm run db:seed      # six sample tasks (skipped if any exist)

npm test -w Backend -- tests/tasks.test.ts                     # single backend test file
npm test -w Frontend -- src/components/tasks/TaskForm.test.tsx # single frontend test file
```

Before calling work done, run `npm run lint`, `npm run typecheck`, `npm test` and `npm run build`.

## Environment

There's one `.env` at the repo root, shared by both apps (git-ignored; keep `.env.example` in sync with it):
- The backend loads it in `Backend/src/config/env.ts`, which validates it with Zod and exits on bad config.
- Prisma CLI scripts load it via `dotenv -e ../.env`.
- Vite loads it via `envDir: '..'`, and its dev proxy reads `PORT` from it.

**macOS gotcha:** AirPlay Receiver listens on port 5000 and answers `403 Forbidden` (`Server: AirTunes`). Node binds anyway, so nothing fails at startup. The local `.env` uses `PORT=5001`. The readme's spec value 5000 stays as the default in `.env.example`.

PostgreSQL 16 is installed via Homebrew (`brew services start postgresql@16`; binaries are in `/opt/homebrew/opt/postgresql@16/bin`, which isn't on PATH by default). The local role and password are `taskflow`/`taskflow`, with databases `taskflow` and `taskflow_test`.

## Shared contract

The frontend's `Frontend/src/types/task.ts` and the backend's `Backend/prisma/schema.prisma` and `Backend/src/validators/` must agree on these. If you change one side, change the other:
- **Task:** `id` (uuid), `title` (≤200), `description` (≤2000, nullable), `status` (`PENDING` | `IN_PROGRESS` | `COMPLETED`), `priority` (`LOW` | `MEDIUM` | `HIGH`), `dueDate` (Postgres `DATE`; sent as `YYYY-MM-DD`, returned as an ISO timestamp at UTC midnight), `createdAt`, `updatedAt`.
- **Responses:** `{ success: true, data, meta? }` or `{ success: false, error: { code, message, details?: [{ field, message }] } }`. List pagination is in `meta.pagination`.
- **Endpoints:** `/api/health`, `/api/tasks` (GET/POST), `/api/tasks/:id` (GET/PUT/DELETE), `/api/tasks/:id/status` (PATCH), `/api/dashboard/stats` (GET, optional `today=YYYY-MM-DD`).

## How to work in this repo

- Don't write placeholder implementations for features that are meant to work. Don't call a feature or test working until you've actually run it.
- Leave the readme's "Future Enhancements" (auth, dark mode, drag-and-drop, etc.) out unless the user asks for them.
- When commands or structure change, update the relevant `CLAUDE.md` and `README.md`.
