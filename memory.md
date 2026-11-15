# Memory — Feature 11 Filter + Sort + Pagination (JobPilot / job-rider)

Last updated: 2026-11-15

## What was built

- **Feature 11, built and checked headlessly. It is not committed.** Feature 10 is committed (`2d237e1`), so the working tree holds only feature 11.
- **New:** `lib/jobsQuery.ts` — `parseJobsQuery()`, `buildJobsHref()`, `buildTextSearchFilter()`, `hasActiveFilters()`, plus the `MATCH_FILTERS`, `JOB_SORTS` and `DEFAULT_JOBS_QUERY` constants.
- **Changed:**
  - `lib/insforge/jobs.ts`: `listJobs(insforge, userId, query)` now filters, sorts and pages in the database, and returns `{ jobs, total, page }`.
  - `lib/pagination.ts`: `buildPageItems(totalPages, currentPage)`.
  - `lib/routes.ts`: added `FIND_JOBS_PAGE_PATH`.
  - `types/index.ts`: added `MatchFilter`, `JobSort`, `JobsQuery`, and `page` on `JobListPage`.
  - `app/(app)/find-jobs/page.tsx`: takes the `searchParams` promise and awaits it inside the `<Suspense>` content component.
  - `components/find-jobs/JobFilters.tsx`: now a client component.
  - `FilterSelect.tsx`: now controlled.
  - `JobsPagination.tsx`: now `next/link` links.
  - `JobsTable.tsx`: new `filtered` prop, with a "No jobs match your filters" state and a Clear filters link.
- **Docs updated:** `progress-tracker.md` (11 ticked, Next = 12, long note), `ui-registry.md`, `architecture.md`, `library-docs.md` (PostgREST rules).

## Decisions made

- **Filter, sort and page live in the URL** (`?q=&match=&sort=&page=`), not client state. The URL is treated as untrusted: unknown values fall back to defaults.
- **Default sort is Match Score** (it was newest-first in feature 10), because that is the design's default.
- **High means `match_score >= MATCH_THRESHOLD` (70), Low means `< 70`.** Text matches company or title, case-insensitive. Any filter or sort change resets to page 1.
- **`JobFilters`:** the text box waits 300ms after the last keystroke. The selects apply at once, using `useOptimistic`.
- **Pagination uses real `<Link>`s** with `prefetch={false}`.
- **Rows are still not links** (job details is feature 12). A new Find Jobs search refreshes under whatever filters are already in the URL, so a non-matching new job stays hidden until the filters are cleared.

## Problems solved

- **A page past the last row is a 416 error (`PGRST103`), not an empty list.** `listJobs` catches it and returns the real last page.
- **A second `.or()` on one query fails to parse (400).** So Low Match is a plain `.lt()`, which skips null scores. None can exist, because the agent only inserts scored jobs. If that ever changes, Low needs a different query. The builder has no `.and()`.
- **The InsForge `database.from()` is `@supabase/postgrest-js`,** so `.or()` and `.range()` work even though the InsForge docs list only the simple filters. User text inside `.or()` must be LIKE-escaped, then double-quoted.
- **Probing the live API without a user session:** the anon key is limited by RLS to zero rows, so it still shows parse errors (400) and range errors (416). The SDK's CJS entry won't load in Node here; import `node_modules/@insforge/sdk/dist/index.mjs` directly. Load `.env.local` with `set -a; . ./.env.local; set +a`. The sandbox blocks network, so live calls need `dangerouslyDisableSandbox`.
- **Running TypeScript helpers without a bundler:** `node --experimental-strip-types --import <register.mjs>`, where the register file adds a small resolve hook mapping `@/x` to `<repo>/x.ts`. The scratch scripts are in the session scratchpad and are gone after cleanup.
- **DB checks without a transaction:** `run-raw-sql` blocks `begin`/`rollback`. Use a `DO $$ ... RAISE EXCEPTION 'ROLLBACK_OK%', result $$;` block, which rolls back and reports in the error message.
- **`next build` while the dev server runs:** build in a scratch copy (rsync without `.next`, `node_modules` and `.git`, then copy `node_modules`), because the dev server owns `.next`.
- **Adzuna DNS on this Mac:** Node and curl fail to resolve `api.adzuna.com` (`getaddrinfo` fails; `nslookup` works). OpenAI resolves fine. If the dev server shows "Job search is temporarily unavailable", check the server log for `ENOTFOUND` or `ETIMEDOUT` before blaming the key. Try another network or DNS server.

## Current state

- **Verified:** tsc, lint and `next build` pass, and `/find-jobs` is still a partial prerender. Scripted tests pass for URL parsing, hrefs, the text-filter escaping, and page-button windows (every total from 1 to 30). The same filters, sort and page boundaries were checked as SQL in a rolled-back block. Signed out, `/find-jobs` with junk query params redirects to `/login`.
- **Not verified (needs a real signed-in browser):** the filter, sort and paging clicks against real rows. The `jobs` table was empty and there was no user session, so the PostgREST query was checked for parse errors and the SQL for meaning, but never run end to end as a user. Also untested: the typing pause, back/forward, a stale `?page=` past the end, and not overwriting text while typing.
- **Still owed from earlier:** the signed-in browser pass for features 06 to 10. That means a real profile save, PDF upload and replace, the View, Extract and Generate clicks, sign-out, OAuth landing on `/profile`, the Find Jobs click, the 400, 422 and 429 paths, a repeat search inserting nothing, the two PostHog events arriving, and cross-user RLS.
- **Feature 06 review issues (b), (d), (e) are still unchecked.**

## Next session starts with

1. Ask whether to **commit** feature 11 (nothing is committed).
2. Do the **one real signed-in browser pass** (covers 06 to 11). Check first that the dev server can reach Adzuna. Run a search so there are rows, then try the text filter, High/Low, all three sorts, paging with more than 20 jobs, back/forward, and a `?page=` past the end.
3. Start **12 Job Details Page — Full UI.** Read `context/build-plan.md` first. Job data from the DB is already available, so wire real data for the job info and match sections. Company research shows the empty state only. The Apply Now and View Job Post links use `source_url`. Make table rows link to `/find-jobs/[id]`.

## Open questions

- Which of the 06 review issues (b), (d), (e) are still real?
- Should the Dashboard link be hidden or disabled until feature 14 (it goes to the 404 page)?
- Why does PostHog `identify` never fire on the client? Still unresolved.
- A complete-profile design for `CompletionIndicator` is missing (the banner is just hidden).
- Access-token lifetime, and the success path of the proxy refresh on `/api` routes, were never tested with a real expired session. A long agent run that outlives the token mid-request is not covered.
- The in-memory rate limiter needs a DB-backed version before real deployment (it is per instance and resets on restart).
- An iCloud-synced Desktop corrupted `node_modules` once (during the 08 install). Consider moving the project out of a synced folder.
- Repeat jobs are skipped, not re-scored, so old match scores go stale if the profile changes. Decide whether that needs a re-score option.
