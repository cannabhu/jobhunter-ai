# Memory — Feature 17: Analytics Charts, PostHog Data (JobPilot / job-rider)

Last updated: 2026-11-16

## What was built

- **All 17 planned features are now built, but features 14, 15, 16 and 17 are NOT committed** (branch `development`; last commit is `0236448`). Commit them (one commit per feature is the suggestion; include `package.json` and the lock file for recharts, and `db/migrations/002_dashboard_stats.sql`).
- **Feature 17 (this session) — new files:**
  - `lib/posthog-query.ts` — `runHogQL(name, query, values)`: POSTs to `{POSTHOG_API_HOST}/api/projects/{POSTHOG_PROJECT_ID}/query/` with a Bearer personal API key and an 8s timeout; returns the rows or null on any failure (logs status and error code only; never the key or response body). Warns once if the key is not `phx_`, and adds a hint to 401/403 log lines.
  - `lib/posthog-dashboard.ts` — `getJobsByDay` (30 days of `job_found`), `getResearchByDay` (7 days of `company_researched`), `getScoreDistribution` (`job_found` scores, same 30 days). Each is a `'use cache'` function keyed by `userId`; the exported getters never reject. Queries filter `distinct_id = {user_id}` with the id bound through `values`, never in the SQL text.
  - `lib/dashboardCharts.ts` (pure: UTC day keys, zero-fill, strict row parsing, six score buckets, `chartYTicks`) and `lib/chartTicks.ts` (`niceTicks`).
  - `components/dashboard/`: `JobsOverTimeSection`, `ResearchActivitySection`, `MatchDistributionSection` (async Server Components that take a `data` promise), `ChartEmptyState`, `ChartErrorState`, `ChartSkeleton`.
- **Feature 17 — edited:** `app/(app)/dashboard/page.tsx` (starts the three chart fetches right after `getUser()`, before the DB queries, and wraps each section in its own `<Suspense>`), `components/dashboard/ChartCard.tsx` (optional `window` caption "Last 30 days" / "Last 7 days" at the right of the title), `JobsOverTimeChart.tsx` (X axis `interval="preserveStartEnd"`, `minTickGap={24}`), `context/code-standards.md` (three new env vars), `.env.example` (placeholders; note it is gitignored by `.env*`). **Deleted:** `app/(app)/dashboard/mockDashboard.ts`.
- **Docs updated:** `progress-tracker.md` (17 ticked, notes and review-fix notes), `architecture.md`, `ui-registry.md`, `library-docs.md` (PostHog read-side section).
- Features 14 (dashboard UI), 15 (real stats bar via the `dashboard_stats` DB function) and 16 (real recent activity) were built earlier and are described in `progress-tracker.md`.

## Decisions made

- **Chart source is PostHog**, as the build plan says (server-side HogQL through the REST query API). The alternative, reading the InsForge `jobs` table through a new `003` RPC, was reviewed and left unbuilt: it needs no key, includes pre-tracking jobs and would match the stat cards, but research would then count "last researched per day" (`researched_at` is overwritten on each run), and it contradicts the plan and `code-standards.md`. Revisit only if the PostHog route becomes a problem.
- **Jobs Found Over Time = 30 days by day** (build plan wins over the design's 7 weekday mock). **Company Research Activity = 7 days.** **Match Score Distribution** uses the same 30 days and has a sixth `<50%` bar (real scores go below 50) so the bars add up.
- **Day buckets are UTC**, which is also the PostHog project's timezone.
- **Empty state (query worked, zero events) and error state ("Couldn't load this chart") are different UI**, so an outage never looks like "no data yet". Failure handling is by null return, not an error boundary.
- **Caching:** an answer is reused for 60s (`{ stale: 30, revalidate: 60, expire: 300 }`); a failure calls `cacheLife("seconds")` so it is retried almost at once. A search just run can take up to a minute to show in the charts.
- **The charts and the stat cards can disagree** (charts count PostHog events since tracking began; stat cards count every job in the DB). The window caption explains it; it is not fully fixable without the DB source.
- Y-axis ticks are derived from the data. Chart colours are CSS variables, never hex.

## Problems solved

- **403 `authentication_failed` from PostHog:** the key must be a **personal API key (`phx_`) with the Query: Read scope** (PostHog > Account settings > Personal API keys). A project token (`phc_`) or a project secret key (`phs_`) both give 403. First attempt was a `phc_` token with an extra leading `p`, second was a `phs_` key. The dev server must be restarted after changing `.env.local`.
- **Query host:** the project is on the EU cloud; `POSTHOG_API_HOST` is `https://eu.posthog.com`, not the `eu.i.posthog.com` ingestion host. Project timezone is UTC. HogQL: `toDate()` takes one argument (convert with `toTimeZone` first).
- **`cacheLife` typing:** it accepts a profile name or an object, not a union; branch with `if` / `else`.
- **Scripted tests without a test framework:** Node 24 strips TypeScript types, but the `@/` aliases don't resolve; copy the files to the scratchpad, rewrite the aliases with `sed`, stub `next/cache`, and run with `node`. A local `http` server mocks the PostHog API. These tests are not in the repo.
- **`next build` in a scratch copy** (from earlier): `rsync` the project without `node_modules`, `.next`, `.git`, then `cp -Rc node_modules <copy>/node_modules`. `tsc` shows errors in `.next/types/* 2.ts` (stale iCloud duplicates); filter with `grep -v "^.next/"`.

## Current state

- **Works (confirmed by the developer):** `/dashboard` fetches live data from PostHog with a real `phx_` key. tsc, eslint and `next build` pass after the review fixes; mock-server tests pass.
- **Not verified:** the empty state for a brand-new account, the error state seen in a browser, the 1440px / 500px screenshot check against `context/designs/dashboard.png`, and the 60s cache in a real signed-in session. Also unverified from earlier features: the signed-in render of features 14 to 16, Refresh research, the 429 on a fourth research run in 10 minutes, another user's job id giving 404, how the dossier card looks.
- **Still open from the feature 17 review:** no route-level `error.tsx` (an unexpected throw in a chart would reach `global-error`); the helper tests are not kept in the repo (no test setup); `.env.example` is gitignored (the new variable names are documented only in `code-standards.md`).
- **Still owed from earlier:** feature 06 review issues (b), (d), (e). Not built: full job description fetch (Adzuna `about_role` is a 500-char preview).
- Env needed in `.env.local` for the charts: `POSTHOG_PERSONAL_API_KEY` (a secret, never `NEXT_PUBLIC_`), `POSTHOG_PROJECT_ID`, `POSTHOG_API_HOST`. Wi-Fi DNS here is 8.8.8.8 / 8.8.4.4 (1.1.1.1 times out). Dev server runs on port 3000.

## Next session starts with

1. Commit features 14 to 17 on `development` (suggested: one commit each; leave `.env.local` out, it is gitignored).
2. Open `/dashboard` signed in and check: all three charts with data, a new account's empty state, the error state with a wrong key, and the layout at 1440px and 500px against the design.
3. Decide whether to fix the open review items (`error.tsx` for the dashboard, keep the helper tests in the repo) and then run `/review` on the whole build before any demo or deploy.

## Open questions

- Should the charts move to the InsForge `jobs` table (a `003` migration with one or two RPCs) so they match the stat cards and include older jobs?
- Why does PostHog `identify` never fire on the client?
- Do the feature 06 review issues (b), (d), (e) still apply?
- Add a web-search step or a "company website" field for companies the model doesn't know?
- `CompletionIndicator` has no complete-profile design (the banner is just hidden).
- A research run (up to about 2 minutes) could outlive the access token mid-request; a 120s synchronous request may hit the host's time limit once deployed.
- The in-memory rate limiter and the in-memory chart cache both need a shared/DB-backed version for a serverless deployment.
- An iCloud-synced Desktop corrupts `node_modules` and `.next` at times; consider moving the project out of a synced folder.
- Repeat jobs are skipped, not re-scored, so old match scores go stale if the profile changes.
