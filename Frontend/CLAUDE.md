# Frontend — CLAUDE.md

This file covers the React app. Shared commands, environment and the API contract are in `../.claude/CLAUDE.md`.

## Stack

React 19, TypeScript (strict, `noUncheckedIndexedAccess`), Vite 7, Tailwind CSS 4 (via `@tailwindcss/vite`, configured in `src/index.css`, no config file), React Router 7 (imported from `react-router`), Axios, Lucide icons. Tests use Vitest with jsdom and Testing Library.

## Commands (from this folder, or with `-w Frontend` from the root)

```bash
npm run dev                                      # Vite on :5173, proxies /api to the backend
npm run build                                    # tsc -b && vite build
npm test                                         # vitest run
npx vitest run src/pages/pages.test.tsx          # single file
npx vitest run -t "asks for confirmation"        # single test by name
npm run lint
```

## Architecture

- `src/App.tsx` defines the routes but no router. `main.tsx` wraps it in `BrowserRouter`, and tests wrap it in `MemoryRouter` via `renderApp()` in `src/test/utils.tsx`. Routes: `/`, `/tasks`, `/tasks/new`, `/tasks/:id`, `/tasks/:id/edit`, `*`.
- **Data flow:** pages → `src/services/taskService.ts` → the Axios instance in `src/services/api.ts`. Never call Axios directly from components. The response interceptor turns every failure into an `ApiError` (`status`, `code`, `fieldErrors`). Pages check `error.status === 404` to show `TaskNotFound`.
- **Loading data:** `useApi(fetcher)` in `src/hooks/useApi.ts`. The fetcher must be stable (wrap it in `useCallback`). The hook keeps the previous data while a reload runs, ignores stale responses, and exposes `reload` and `setData` for in-place updates after mutations.
- **All Tasks page:** filters, sort and page live in the URL search params (`readFilters` in `TasksPage.tsx`), so dashboard links like `/tasks?status=PENDING` work. The search box keeps local state and is debounced into the URL with a timer, not an effect. Any filter change resets to page 1.
- **Forms:** `TaskForm` is shared by the create and edit pages. Validation and conversion helpers are in `src/utils/taskForm.ts`. Their limits must match `Backend/src/validators/task.validators.ts`. The form blocks duplicate submits with a ref, maps server `fieldErrors` onto fields, and stays disabled after success because the parent navigates away.
- **Due dates:** handle them as `YYYY-MM-DD` strings (`src/utils/date.ts`), and format them with `timeZone: 'UTC'`, so the user's timezone never shifts the day. "Today" and "overdue" use the user's local date. The dashboard sends that date to the API as `today`.
- **Toasts:** use the `useToast()` hook (`src/hooks/useToast.ts`). The context is in `components/ui/toastContext.ts`, and the provider is in `ToastProvider.tsx`.
- `react-refresh/only-export-components` is enforced, so component files export only components. Put shared constants and helpers in `src/utils/`.
- React 19: `ref` is a regular prop, so UI primitives take `ComponentProps<'input'>` etc., or declare `ref` explicitly, as `Button` does.

## UI rules

- Light theme, slate neutrals, indigo accent. Status badges: pending gray, in progress blue, completed green. Priority badges: low gray, medium amber, high red. Reuse `components/ui/*` (Button/ButtonLink, Field + Input/Textarea/Select, Card, Badge, Spinner/LoadingState, EmptyState/ErrorState, ConfirmDialog) instead of new one-off styles.
- Every data view handles loading, empty (distinguish "no tasks" from "no matches"), error with retry, and success.
- Destructive actions go through `ConfirmDialog`, which focuses Cancel, traps Tab, and closes on Escape.
- Layout: a fixed sidebar at `lg` and above, and a top bar with a drawer below that. Check new screens at phone width.
- Tests mock `services/taskService` with `vi.mock` and query by role or label, not by class names.
