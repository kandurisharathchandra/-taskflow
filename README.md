# TaskFlow

A full-stack task manager: a React + TypeScript + Tailwind frontend (`Frontend/`), an Express + TypeScript REST API (`Backend/`), and PostgreSQL through Prisma.

The original project specification is in [`readme`](./readme).

## Requirements

- Node.js 20.11 or newer (developed on Node 24)
- npm 10 or newer
- PostgreSQL 14 or newer

## 1. Install PostgreSQL

**macOS (Homebrew)**

```bash
brew install postgresql@16
brew services start postgresql@16
# Put psql/createdb on your PATH (add this line to ~/.zshrc to keep it):
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
```

**Ubuntu / Debian**

```bash
sudo apt install postgresql
sudo systemctl start postgresql
```

**Windows:** use the installer from <https://www.postgresql.org/download/windows/>.

## 2. Create the database user and databases

```bash
psql -d postgres -c "CREATE ROLE taskflow LOGIN PASSWORD 'taskflow' CREATEDB;"
createdb -O taskflow taskflow        # app database
createdb -O taskflow taskflow_test   # used by the backend tests (wiped on every run)
```

On Linux, run these as the `postgres` user (e.g. `sudo -u postgres psql ...`). Choose your own password for anything other than local development. `CREATEDB` is needed because `prisma migrate dev` creates a temporary "shadow" database.

## 3. Configure the environment

```bash
cp .env.example .env
```

Then edit `.env`:

| Variable | Purpose |
| --- | --- |
| `PORT` | API port. **On macOS use `5001`**, since AirPlay Receiver occupies 5000 (see Troubleshooting). |
| `NODE_ENV` | `development`, `test` or `production` |
| `FRONTEND_URL` | Origin allowed by the API's CORS policy |
| `DATABASE_URL` | e.g. `postgresql://taskflow:taskflow@localhost:5432/taskflow` |
| `TEST_DATABASE_URL` | e.g. `postgresql://taskflow:taskflow@localhost:5432/taskflow_test` |
| `VITE_API_URL` | Optional. Only needed when the built frontend calls an API on another origin. |

`.env` is git-ignored. Never commit it.

## 4. Install, migrate, seed

```bash
npm install          # installs both apps (npm workspaces) and generates the Prisma client
npm run db:migrate   # applies migrations to DATABASE_URL
npm run db:seed      # optional: adds six sample tasks (skipped if tasks already exist)
```

## 5. Run in development

```bash
npm run dev
```

- Frontend: <http://localhost:5173>
- API: `http://localhost:$PORT/api` (e.g. <http://localhost:5001/api/health>)

In development the frontend calls `/api` on its own origin, and Vite proxies those requests to the API on `PORT`.

## Scripts (run from the repository root)

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the API (tsx watch) and the frontend (Vite) together |
| `npm run build` | Compile the API to `Backend/dist` and build the frontend to `Frontend/dist` |
| `npm start` | Run the compiled API |
| `npm test` | Backend API tests (Vitest + Supertest, real test database), then frontend tests (Vitest + Testing Library) |
| `npm run lint` | ESLint for both apps |
| `npm run typecheck` | TypeScript checks for both apps |
| `npm run db:migrate` | Create/apply migrations in development (`prisma migrate dev`) |
| `npm run db:deploy` | Apply existing migrations without prompting (production/CI) |
| `npm run db:seed` | Insert sample tasks |
| `npm run db:studio` | Open Prisma Studio |

Run a single test file:

```bash
npm test -w Backend -- tests/tasks.test.ts
npm test -w Frontend -- src/components/tasks/TaskForm.test.tsx
```

## Production build

```bash
npm ci
npm run build
NODE_ENV=production npm run db:deploy
NODE_ENV=production npm start          # serves the API on $PORT
```

`Frontend/dist` is a static site, so you can serve it from any static host. Then either:

- serve it from the same origin as the API, with `/api` routed to the Express server (no extra config), or
- build it with `VITE_API_URL=https://your-api.example.com/api npm run build`, and set `FRONTEND_URL` on the API to the site's origin for CORS.

Configure the static host to fall back to `index.html` for unknown paths, so that client-side routes like `/tasks/123` load correctly.

## API

All responses are JSON: `{ "success": true, "data": ..., "meta"? }` or `{ "success": false, "error": { "code", "message", "details"? } }`.

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `/api/health` | Server status |
| GET | `/api/tasks` | Query: `search`, `status`, `priority`, `sortBy` (`createdAt`, `updatedAt`, `dueDate`, `title`, `priority`), `order` (`asc`/`desc`), `page`, `limit` (max 100). Pagination is in `meta.pagination`. |
| GET | `/api/tasks/:id` | 404 if missing, 400 if the id isn't a UUID |
| POST | `/api/tasks` | Body: `title` (required, ≤200 chars), `description`, `status`, `priority`, `dueDate` (`YYYY-MM-DD` or `null`) |
| PUT | `/api/tasks/:id` | Any subset of the POST fields. `null` or `""` clears optional fields. |
| PATCH | `/api/tasks/:id/status` | Body: `{ "status": "PENDING" \| "IN_PROGRESS" \| "COMPLETED" }` |
| DELETE | `/api/tasks/:id` | 204 on success |
| GET | `/api/dashboard/stats` | Counts, completion rate, overdue count, open tasks by priority, five most recently updated tasks. Optional `today=YYYY-MM-DD` uses the client's date for "overdue". |

## Troubleshooting

**Every API request returns 403 / empty responses on macOS.** macOS's AirPlay Receiver listens on port 5000 and answers with `403 Forbidden` (`Server: AirTunes`). Node can still bind to the port, so there's no error. Set `PORT=5001` in `.env` (Vite picks it up automatically), or turn off AirPlay Receiver in System Settings → General → AirDrop & Handoff. Check what's listening with `lsof -nP -iTCP:5000 -sTCP:LISTEN`.

**`Could not connect to the database` on startup.** PostgreSQL isn't running or `DATABASE_URL` is wrong. Check with `pg_isready` and `psql "$DATABASE_URL" -c 'select 1'`.

**`prisma migrate dev` fails with "permission denied to create database".** The role needs `CREATEDB` for the shadow database: `ALTER ROLE taskflow CREATEDB;`.

**Backend tests fail with `TEST_DATABASE_URL must be set`.** Add it to `.env` and create the database (step 2). Tests delete all rows in that database, so never point it at real data.

**Frontend shows "Cannot reach the server".** The API isn't running, or `PORT` in `.env` doesn't match the port it's actually on. Restart `npm run dev` after changing `.env`.

**`@prisma/client did not initialize yet`.** Run `npm run prisma -w Backend -- generate`, or `npm install` again.
