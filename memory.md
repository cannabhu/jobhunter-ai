# Memory — Feature 10 Adzuna Job Discovery (JobPilot / job-rider)

Last updated: 2026-11-15

## What was built

- **Feature 10, built and checked headlessly. Nothing from it is committed.** Feature 09 is committed (`6f12c7b`). The working tree has this feature's changes, and `mockJobs.ts` was removed with `git rm`, so that deletion is staged.
- **API:** `app/api/agent/find/route.ts` (`POST { jobTitle, location }`). Check order: session 401, zod body 400, rate limit 429 (5 per user per 10 min), saved profile has at least one skill or a current title else 422. It then inserts an `agent_runs` row, runs discovery, closes the run, fires PostHog events, and returns the banner text and counts.
- **Agent:** `agent/adzuna.ts` has `discoverJobs()`: search, dedupe, look up already-saved ids, score only the new jobs in parallel, then one bulk insert. `agent/matcher.ts` has `scoreJob()` (GPT-4o, one call per job, temp 0.3, max_tokens 300).
- **Libs:**
  - `lib/adzuna.ts` (`searchJobs`, `detectCountry`, `formatSalary`, `toJobType`)
  - `lib/jobScoring.ts` (`normalizeJobScore`)
  - `lib/findJobs.ts`, `lib/findJobsSchema.ts`, `lib/findJobsMessage.ts`
  - `lib/relativeTime.ts` (`formatFoundLabel`)
  - `lib/pagination.ts` (`buildPageItems`)
  - `lib/utils.ts` (`MATCH_THRESHOLD = 70`)
  - `lib/posthog-server.ts`
  - `lib/insforge/jobs.ts` (`getSavedJobScores`, `listJobs`)
  - `lib/insforge/agentLogs.ts` (`logAgent`)
- **UI:** `components/find-jobs/SearchControls.tsx` is now a client component: spinner, banner, error text with a "Go to your profile" link on 422, then `router.refresh()`. `app/(app)/find-jobs/page.tsx` lists the user's newest 20 saved jobs with a real total, and a "Jobs by Adzuna" line sits under the pagination bar. New types are in `types/index.ts` (`JobScore`, `FindJobsResult`, `FindJobsResponse`, `JobListPage`).
- **Dependency:** `posthog-node` installed.
- **Docs updated:** `progress-tracker.md` (10 ticked, Next = 11, long note), `ui-registry.md`, `architecture.md`, `code-standards.md` and `library-docs.md` (env var name, salary snippet, `external_apply_url`).

## Decisions made

- **Repeat jobs are skipped, not re-scored.** The SDK has no `upsert()`, so the agent looks up the user's existing `external_id`s first. Old scores can go stale if the profile changes. `found_at` and `company_research` are never touched. `job_found` fires only for newly saved jobs.
- **Banner text:** "Found 8 jobs (5 new) and saved 4 strong matches." The "(N new)" part only shows when some already existed. "Strong" means score at or above `MATCH_THRESHOLD`. `agent_runs.jobs_found` stores the banner's "Found N".
- **Empty profile gives a 422** (no skills and no current title) before any Adzuna or OpenAI call. A complete profile is not required.
- **Country is guessed by keyword** (`gb`, `ca`, `au` by country names and main cities; everything else is `us`). There is no country dropdown. An unlisted city falls back to `us` and will find nothing.
- **Env var is `ADZUNA_API_KEY`** (not `ADZUNA_APP_KEY`). `.env.local` was not touched.
- **`external_apply_url` stays null.** Adzuna's `redirect_url` is saved in `source_url` and is the apply link.
- **Jobs that fail scoring are skipped** and logged as a warning. If every score fails the run is `failed` and the route returns 503 (OpenAI down) or 500.
- **"Jobs by Adzuna" credit** is a muted line in the jobs card footer. It is not in the design, and the deviation is recorded in `ui-registry.md`.

## Problems solved

- **Adzuna DNS on this Mac:** Node and curl fail to resolve `api.adzuna.com` (`getaddrinfo` fails; `nslookup` works; the system cache returned only IPv6). OpenAI resolves fine. Pinning the IPv4 address in a scratch script made the live test pass, so the code is fine. The Adzuna error now logs the network code (`ENOTFOUND`, `ETIMEDOUT`) so this is not mistaken for a bad key. If the dev server shows "Job search is temporarily unavailable", check the server log first.
- **Running TypeScript against the repo without a bundler** (no `tsx` or `esbuild` here): `node --experimental-strip-types`, plus a small `module.register` hook to resolve `@/` aliases. Load `.env.local` with `set -a; . ./.env.local; set +a`. The scratch scripts live in the session scratchpad and are gone.
- **DB payload check without a transaction:** `run-raw-sql` blocks `begin`/`rollback`. Use a `DO $$ ... raise exception 'ROLLBACK_OK ...' $$;` block, which rolls back and reports results in the error message.
- The sandbox blocks network access, so live Adzuna and OpenAI checks need `dangerouslyDisableSandbox`.
- A safety check once blocked an `rm -rf` of the scratch build copy, and also misfired on an unrelated Python heredoc. The doc edits were redone with the Edit tool. The leftover `build-copy` folder in the scratchpad is harmless.

## Current state

- **Verified:** tsc, lint and `next build` pass. Scripted tests of the pure helpers pass. A live Adzuna call returned 10 IT jobs for "Frontend Engineer" (us) and for "Software Engineer" in London (gb, £ salaries). A live GPT-4o score returned sensible results and ignored a planted instruction. The insert payloads pass the real table constraints and the unique `(user_id, external_id)` index. Signed out, `POST /api/agent/find` returns 401 and `/find-jobs` redirects to `/login`.
- **Not verified (needs a real signed-in browser):** the Find Jobs click end to end, the banner and table refresh, the 400, 422 and 429 paths, a repeat search inserting nothing, `job_search_started` and `job_found` arriving in PostHog, and cross-user RLS. The older pass covering 06 to 09 is still owed too: signed-in `/profile` and `/find-jobs`, a real profile save, PDF upload and replace, the View, Extract and Generate clicks, sign-out, and OAuth landing on `/profile`.
- **Inert until feature 11:** the filter input, both selects and the pagination buttons. With more than 20 saved jobs only the newest 20 show. Table rows are not links (job details is feature 12).
- **Feature 06 review issues (b), (d), (e) are still unchecked.**

## Next session starts with

1. Ask whether to **commit** feature 10 (nothing is committed; the `mockJobs.ts` deletion is already staged).
2. Do the **one real browser pass** (covers 06 to 10). Make sure the dev server can reach Adzuna first (see the DNS note above). Search, confirm the banner and table, search again to confirm no duplicates, try an empty profile for the 422, and check PostHog for the two events.
3. Start **11 Filter + Sort + Pagination.** Read `context/build-plan.md` first. Wire the filter input (company or title, case-insensitive), the All Matches / High Match / Low Match select (using `MATCH_THRESHOLD`), the sort select (Match Score, Newest, Oldest), and real pagination at 20 per page. Reuse `listJobs`, `formatFoundLabel` and `buildPageItems`, and replace the inert controls. Decide whether state goes in the URL query string.

## Open questions

- Feature 11: URL search params versus client state for filter, sort and page. The page is `cacheComponents`, so reading `searchParams` must sit behind `<Suspense>`.
- Which of the 06 review issues (b), (d), (e) are still real?
- Should the Dashboard link be hidden or disabled until feature 14 (it goes to the 404 page)?
- Why does PostHog `identify` never fire on the client? Still unresolved.
- A complete-profile design for `CompletionIndicator` is missing (the banner is just hidden).
- Access-token lifetime, and the success path of the proxy refresh on `/api` routes, were never tested with a real expired session. A long agent run that outlives the token mid-request is not covered.
- The in-memory rate limiter needs a DB-backed version before real deployment (it is per instance and resets on restart).
- An iCloud-synced Desktop corrupted `node_modules` once (during the 08 install). Consider moving the project out of a synced folder.
