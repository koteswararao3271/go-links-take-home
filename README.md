# go links

A small internal URL shortcut service: create `go/<slug>` shortcuts, browse
them, and visiting `go/<slug>` redirects to the destination URL.

Built for a take-home exercise with a ~60 minute time box. TypeScript,
Next.js App Router (API routes + UI in one app), no database.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:3000. Visiting `http://localhost:3000/<slug>`
(e.g. `/oncall`) performs the redirect. In a real deployment this would sit
behind an internal DNS entry so it resolves as `go/oncall`; locally it's
just the app's own root path.

```bash
npm test         # vitest — validation + store unit tests
npm run lint      # eslint
npm run build     # production build + typecheck
```

Three shortcuts (`design-system`, `oncall`, `payroll` — matching the
examples in the prompt) are seeded on boot.

## What's implemented

- **Create / list / visit** shortcuts, plus **delete** (not required by the
  prompt, but a team maintaining these links needs a way to remove stale
  ones, and it was cheap to add).
- **Validation** (Zod): slugs are constrained to lowercase
  `letters-numbers-hyphens` (no leading/trailing/double hyphens, so
  `on-call` and `-on-call-` can't both exist), URLs must be absolute
  `http(s)`, a reserved-word list stops a shortcut from shadowing `/api`
  or Next's own routes.
- **Error handling**: 400 on validation failure (field-level messages),
  409 on duplicate slug, 404 for both the JSON API and the redirect route
  (with a small HTML page pointing back to "create it"), structured
  `{ error: { code, message, details? } }` bodies throughout.
- **Observability**: every request gets an `x-request-id` (generated in
  `src/proxy.ts` if the caller didn't send one, or reused if it did) that's
  echoed back in a response header and threaded through structured JSON
  log lines (`link_created`, `link_visited`, `link_visit_not_found`, etc.)
  — enough to trace one request through logs without a real APM stack.
- **Basic usage analytics**: each link tracks `visitCount` /
  `lastVisitedAt`, shown in the table — a natural first step toward "which
  go links are actually used."
- **Accessibility**: labelled form fields with `aria-describedby` error
  text, an `aria-live` status region announcing create success/failure,
  a real `<table>` with scoped headers, focus moved to the first invalid
  field on a rejected submit.
- **"Did you mean" 404 suggestions** (`src/lib/fuzzy.ts`): visiting an
  unknown slug (e.g. `/oncal`) runs a Levenshtein distance against
  existing slugs and offers close matches instead of a dead end — a typo
  is the most likely reason a go-link 404s, and just saying "create it"
  ignores that.
- **On-demand link health checks** (`src/lib/health.ts`,
  `POST /api/links/[slug]/check`): probes a shortcut's destination
  (HEAD, falling back to GET for servers that reject HEAD) and records
  `healthy` / `broken` with the status code or error, surfaced as a badge
  in the table with a "Check" / "Check all" action. Building this
  surfaced a real false-positive: Figma's CDN 403s a User-Agent-less
  request outright, which would otherwise misreport a live link as
  broken — fixed by sending a descriptive UA (`src/lib/health.ts`).
- **Tests**: unit tests for the validation schema (slug/url edge cases),
  the store (create, duplicate, delete, visit tracking, search), and the
  fuzzy-match suggestion logic.

## Assumptions

- Single user, no auth/multi-tenancy — anyone who can reach the app can
  create or delete shortcuts. The prompt explicitly says not to add auth
  for this exercise; a real internal tool would gate creation behind SSO
  and probably restrict deletion to the shortcut's owner or an admin.
- Slugs are case-sensitive-by-convention (lowercase enforced at creation),
  not case-insensitively normalized — simplest rule that avoids surprises.
- "View existing shortcuts" is satisfied by a single searchable list; no
  pagination, since the prompt doesn't imply a large corpus for a first
  iteration.

## Tradeoffs I made on purpose

- **In-memory store, not a database.** A `Map` keyed by slug
  (`src/lib/store.ts`), seeded on boot, reset on restart. This was the
  single biggest time-saver — no schema, migration, or connection setup —
  and the store is already isolated behind a small function API
  (`listLinks`, `createLink`, `deleteLink`, `recordVisit`), so swapping in
  Postgres/Prisma later touches one file, not the routes or UI.
- **No optimistic concurrency / locking.** Fine for a single Node process;
  would need real transactions once this is backed by a shared database
  with concurrent writers.
- **Delete has no confirmation beyond a native `window.confirm`.** Good
  enough to prevent a stray click; a real tool would want an undo window
  instead of a blocking dialog.
- **No rate limiting or abuse protection** on shortcut creation — out of
  scope for an internal tool exercise, but would matter before this is
  reachable outside a trusted network.
- **No pagination/virtualization** on the list — fine at seed-data scale,
  would matter once teams have hundreds of shortcuts.
- **Health checks are on-demand, not scheduled.** Clicking "Check" / "Check
  all" runs the probe inline rather than on a background schedule — no
  cron/queue infra needed for a first iteration, at the cost of stale
  health status between clicks. A production version would run this on a
  schedule and probably as a queued job so N links don't mean N
  simultaneous outbound requests from a single API call.
- **Health checks are a best-effort signal, not ground truth.** A 403/429
  can mean "actually down" or "this CDN doesn't like automated requests"
  — the UA fix narrows that gap but doesn't close it. Worth surfacing the
  status code/error in the badge tooltip rather than a bare pass/fail, so
  a human can judge.

## If I had another day

- Move health checks to a scheduled background job instead of on-demand,
  and store a short history instead of only the latest result (so a
  flaky link is visibly flaky, not just "broken since 2pm").
- Swap the in-memory `Map` for Postgres (the store module is already the
  seam for this) and add an integration test against a real database.
- Slug **edit** (currently create + delete only; no update-in-place, so
  fixing a typo means delete-and-recreate and loses visit history).
- Surface "most visited" / "recently created" sorting instead of just
  alphabetical, and expose visit counts as a real metric (Prometheus/
  Micrometer-style counter) rather than only a UI column.
- Bulk import (CSV/JSON) for teams migrating an existing spreadsheet of
  links.
- Optimistic UI updates (currently the create/delete buttons wait on the
  round trip before updating state).
- A `robots.txt`/no-index posture and a real internal auth check before
  this goes anywhere near production.

## Notable implementation detail

This project scaffolded on Next.js 16, where `middleware.ts` was renamed
to `proxy.ts` (same behavior, new file/export name) — the request-ID
stamping lives in `src/proxy.ts` for that reason.
