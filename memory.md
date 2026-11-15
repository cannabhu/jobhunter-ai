# Memory — Feature 13 Company Research Agent (JobPilot / job-rider)

Last updated: 2026-11-15

## What was built

- **Feature 13, built and checked headlessly and live. It is NOT committed.** Features 11 and 12 are committed (`baa2d78`, `1da14ce`), so the working tree holds only feature 13.
- **New:**
  - `agent/research.ts`: `researchCompany()` finds the homepage, reads it in one Browserbase/Stagehand session, then GPT-4o writes the dossier.
  - `lib/companyResearch.ts`: pure helpers (homepage choice, job-board denylist, `pickSubPages`, `normalizeDossier`, `parseModelDossier`, limits).
  - `lib/researchSchema.ts`.
  - `app/api/agent/research/route.ts`: `POST { jobId }`, `maxDuration` 120.
  - `components/job-details/DossierView.tsx`.
- **Changed:**
  - `components/job-details/CompanyResearch.tsx`: now a client component with Research / Refresh button, status and error lines.
  - `app/(app)/find-jobs/[id]/page.tsx`: passes the dossier and `jobId`.
  - `lib/insforge/jobs.ts`: `getJobDetail` now returns the dossier, plus new `getJobForResearch` and `saveCompanyResearch`.
  - `lib/insforge/agentLogs.ts`: `runId` may be null.
  - `agent/matcher.ts`: `describeProfile` is exported.
  - `types/index.ts`: `CompanyDossier`, `ResearchJob`, `ResearchCompanyResponse`, and `JobDetail.companyResearch` / `researchedLabel`.
  - `next.config.ts`: Stagehand added to `serverExternalPackages`.
  - `package.json` and lock: added `@browserbasehq/stagehand`, and **zod pinned to exactly 4.6.6**.
- **Docs updated:** `progress-tracker.md` (13 ticked, Next = 14, long notes), `ui-registry.md`, `architecture.md`, `library-docs.md` (Browserbase and Stagehand sections rewritten for v4), `code-standards.md`.

## Decisions made

- **Synchronous run:** the route awaits the whole research (about 25s per page, 48 to 79s in tests). There is no status column and no polling. If a deployment host cuts requests short, the fallback is background + polling.
- **Homepage:** follow the Adzuna `source_url` server-side and take the final registrable domain. If it lands on a job board or ATS (denylist), an unsafe host, or the fetch fails, fall back to `https://www.{cleanedCompanyName}.com`. This differs from the build plan's "strip the subdomain".
- **Always a dossier:** browser failures only shorten the research (warnings in `agent_logs` with `run_id` null). Only a failed or unusable GPT-4o answer is an error (503 outage/quota, 500 otherwise), and nothing is saved then.
- **Sources:** `sources` comes from pages actually visited, never from the model. Stored jsonb is re-read through `normalizeDossier` (caps, http(s) links only).
- **Refresh allowed:** limited to 3 runs per user per 10 minutes (in-memory limiter), and it overwrites `company_research` / `researched_at`.
- **Dossier UI:** no design exists, so it reuses the existing card tokens. Tech stack chips use the info tint, because success and accent already mean matched and gap on this page. Your Edge is highlighted in `accent-muted`.
- **Navigation limit:** `browserSettings.allowedDomains` restricts the session to the company's own domain.
- **Time budget:** no new pages after 30s of the 70s budget remain, and a timer closes the session at 85s.
- **Synthesis tokens:** `max_tokens` is 1400, not the documented 800, which truncates the JSON.

## Problems solved

- **Stagehand is v4.4, not the v3 API in the old docs.** Use `browserbase.launch({ apiKey, projectId, api_timeout })`, then `Stagehand.create({ browser, model: { modelName: "openai/gpt-4o", apiKey } })`. The page is `(await browser.context.pages())[0]`, and `extract(instruction, zodSchema, { page, timeout })` returns `{ data }`. Close Stagehand first, then the browser. There is no `lib/browserbase.ts`.
- **Link fields in an extract schema must be `z.string().url()`.** With a plain string the model returns element ids like `0-2448`, which showed up as fake "sources".
- **Two zod copies break `extract()` type-checking.** Stagehand pins zod 4.6.6, so the project is pinned to exactly 4.6.6.
- **Turbopack can't bundle Stagehand** (it reads its extension zip relative to its own files). It is now in `serverExternalPackages`.
- **`cleanCompanyName`:** the documented regex `\s*(Co\.?).*$` turns "Coinbase" into an empty string. The fixed version strips legal suffixes only after whitespace or a comma.
- **DNS on this Mac:** Node's `getaddrinfo` can't resolve `api.browserbase.com` or `api.adzuna.com` (`ENOTFOUND`) though `nslookup` works. In the dev server the browser step fails every time ("Failed to upload the Stagehand extension to Browserbase") and research silently falls back to job + profile only. Live tests used a test-only preload that resolves through 8.8.8.8; the scratch files are gone after cleanup. Real fix: set the machine's DNS to 1.1.1.1 / 8.8.8.8.
- **Stale ` 2` duplicate files in `.next` make a plain `tsc` report errors.** Filter them with `grep -v "^\.next/"`. This is iCloud sync again, and a stopped dev server plus `rm -rf .next` would clear it.
- **Live testing without a user session:** the sandbox blocks network, so use `dangerouslyDisableSandbox`, and load env with `set -a; . ./.env.local; set +a`. TypeScript helpers run with `node --experimental-strip-types --import <register.mjs>`, where a small hook maps `@/x` to `<repo>/x.ts`. A DB check without a transaction uses a `DO $$ ... RAISE EXCEPTION 'ROLLBACK_OK ...' $$` block. `next build` goes in a scratch copy because the dev server owns `.next`.

## Current state

- **Verified:** tsc, lint and `next build` pass, with `/api/agent/research` registered. Scripted helper tests pass. Live runs against real Browserbase and GPT-4o:
  - Stripe via the company-name guess: 3 pages, 79s.
  - Stripe via a redirect: 48s.
  - Stripe from a Greenhouse link: 52s.
  - A made-up company: "nothing to read", still a full dossier in 21s.
  - The update payload and a replace-on-refresh pass the real table in a rolled-back block. Signed out, the route returns 401 and `/find-jobs/<id>` redirects to `/login`.
- **Not verified (needs a real signed-in browser):**
  - the Research Company click, the status line and the page refresh after saving;
  - Refresh research;
  - the 429 on a fourth run;
  - another user's job id giving a 404;
  - `company_researched` reaching PostHog;
  - what the dossier card looks like (never screenshotted).
- **Still owed from earlier:** the signed-in browser pass for features 06 to 12, and feature 06 review issues (b), (d), (e).
- **Not built:** fetching the full job description (Adzuna's `about_role` is a 500 character preview).

## Next session starts with

1. Ask whether to **commit** feature 13 (nothing is committed). Branch is `development`.
2. Fix the machine's DNS first, so Browserbase and Adzuna resolve from the dev server. Then do the **one real signed-in browser pass** covering 06 to 13: research a job, reload (the dossier persists), Refresh, a fourth run in 10 minutes (429), and look at the dossier card visually.
3. Start **14 Dashboard Page — Full UI.** Read `context/build-plan.md` first. When it ships, change `SIGNED_IN_HOME` in `lib/routes.ts` back to `/dashboard`. Features 15 and 16 will read `researched_at`.

## Open questions

- Which of the 06 review issues (b), (d), (e) are still real?
- Should the Dashboard link be hidden or disabled until feature 14 (it goes to the 404 page)?
- Why does PostHog `identify` never fire on the client? Still unresolved.
- `CompletionIndicator` has no complete-profile design (the banner is just hidden).
- Access-token lifetime, and the success path of the proxy refresh on `/api` routes, were never tested with a real expired session. A research run (up to about 2 minutes) could outlive the token mid-request, since each route calls `getUser()` once at the start.
- The in-memory rate limiter needs a DB-backed version before real deployment (per instance, resets on restart).
- An iCloud-synced Desktop corrupts `node_modules` and `.next` at times. Consider moving the project out of a synced folder.
- Repeat jobs are skipped, not re-scored, so old match scores go stale if the profile changes.
- A 120s synchronous research request may hit the host's own time limit once deployed.
