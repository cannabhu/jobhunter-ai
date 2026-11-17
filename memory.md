# Memory — Streamed progress for the AI buttons + favicon and SEO metadata (JobPilot / job-rider)

Last updated: 2026-11-17 (streamed progress, then favicon and SEO metadata later the same day)

## What was built

All of it, including the favicon and SEO work below, is **uncommitted** on branch `development`. The loading UX work from the previous session is already committed (`701c3c7`); the old note saying it was uncommitted was wrong.

- **Protocol and helpers.** `lib/progress.ts` (event types `stage` / `count` / `done` / `error`, `StageDef`, `ProgressListener`, `PREPARE_STAGE_ID`, `PROGRESS_INTERRUPTED`), `lib/progressStream.ts` (`streamProgress(route, run)` returns an NDJSON `Response`), `lib/progressClient.ts` (`runProgressAction()` reads the lines and returns `{ ok, data }` or `{ ok: false, error, status, interrupted }`).
- **UI.** `components/shared/ProgressSteps.tsx` (step checklist, `card` and `inline` variants), `components/shared/useProgressAction.ts` (client hook: stage, reached stages, counts). It replaces the static `role="status"` lines on all six actions.
- **Six routes now stream** (checks still answer as JSON with real statuses, then NDJSON): `app/api/agent/cover-letter`, `agent/research`, `agent/find`, `resume/extract`, `resume/generate`.
- **Stage lists** live with each action's constants: `COVER_LETTER_STAGES` (lib/coverLetter.ts), `RESEARCH_STAGES` (lib/companyResearch.ts), `FIND_JOBS_STAGES` (lib/findJobs.ts), `RESUME_EXTRACT_STAGES` and `RESUME_GENERATE_STAGES` (lib/resume.ts). The first stage, `prepare`, is driven only by the browser.
- **Agents** take an optional last parameter `report?: ProgressListener`: `researchCompany` (agent/research.ts: site, read with a pages-tried count, write) and `discoverJobs` (agent/adzuna.ts: search, score with a count as each parallel call settles, save).
- **Clients moved to the hook:** `CoverLetter.tsx`, `CompanyResearch.tsx`, `ResumeUpload.tsx`, `SearchControls.tsx`.
- **Docs:** `context/architecture.md` (file list, a "Streamed progress" data flow, a new invariant), `context/code-standards.md` (a "Streamed routes" section), `context/ui-registry.md` (full "Progress checklist" entry, so `/imprint` is done for `ProgressSteps`), `context/progress-tracker.md` (a "Streamed progress" entry).

### Favicon and SEO metadata (second task, same day)

- **Icons in `app/`** (generated from the mark in `public/logo.png`, file conventions, no code): `favicon.ico` (16/32/48, replaced the Create Next App default), `icon.png` 512, `apple-icon.png` 180 (full bleed, because iOS rounds corners itself), `opengraph-image.png` and `twitter-image.png` 1200x630 (static PNGs, wordmark plus tagline). The generator script lived in the scratchpad and is not in the repo; to change the artwork, regenerate the PNGs with `sharp` (already in `node_modules` through Next).
- **`lib/site.ts`** (new): `SITE_NAME`, `SITE_TITLE`, `SITE_DESCRIPTION`, `SITE_URL` (from `NEXT_PUBLIC_APP_URL`, default `http://localhost:3000`) and `BRAND_COLORS`.
- **`app/layout.tsx`**: `metadataBase`, title, description, keywords, canonical, Open Graph, `summary_large_image` Twitter card, `viewport.themeColor`. **New:** `app/robots.ts`, `app/sitemap.ts` (only `/` and `/login`), `app/manifest.ts`. **`app/(app)/layout.tsx`** sets `robots: noindex, nofollow`; **`app/login/page.tsx`** has its own title, description and canonical. `.env.example` documents `NEXT_PUBLIC_APP_URL` (the file is gitignored by `.env*`, so it stays local). `context/progress-tracker.md` has an entry; `ui-registry.md` unchanged (no UI component).

## Decisions made

- **Scope: all six actions** on one shared helper, reader and component.
- **Honest stages only.** No percentages, no token streaming; counts only where the server has a real number. The cover letter is still validated whole before saving, so "nothing saved if unusable" still holds.
- **Checks stay JSON with real statuses** (401, 400, 404, 422, 429) before the first byte; after it, failures are `error` events with the same user-facing messages. The 422 "go to your profile" link depends on that.
- **Display: step checklist.** A stage the run never reached shows as skipped (research "read" only starts once the browser really opens; Find Jobs "score" and "save" are skipped when there is nothing to score or save).
- **Disconnect: finish and save anyway.** No abort plumbing, no Cancel button. `report` is best-effort and never throws.
- **Order kept:** save, then PostHog (flushed before the terminal event), then `done`. The cover letter still releases its rate-limit turn on an OpenAI outage. Find Jobs now flushes PostHog before `done`.
- **No stream end means "interrupted":** the card shows "The connection dropped…" and refreshes anyway, in case the result saved.
- **Headers:** `Cache-Control: no-cache, no-transform` and `X-Accel-Buffering: no`.
- No new PostHog events, packages, tables or migrations.
- Earlier decisions still stand: skeleton per page (not `loading.tsx`), footer stays mounted while the jobs table loads, cover letter tone precedence card then profile then formal, 5 letters per 10 minutes, 5,000 character cap.
- **SEO decisions:** page titles keep their full "X — JobPilot" form (no `title.template`); root `openGraph` has no `url`, because a hard-coded `/` made `/login` advertise the homepage (the canonical link carries the URL); signed-in routes are blocked in `robots.ts` and also `noindex`; `BRAND_COLORS` in `lib/site.ts` is the **one allowed place for hex values in code** (meta tags and the manifest can't read CSS variables), so it must mirror `--color-accent` and `--color-background` in `globals.css`.

## Problems solved

- **Streaming under production compression:** chunk timing was checked under `next dev` and `next start` with gzip on; chunks arrive as sent (`no-transform` is honoured).
- **`revalidatePath` and `cookies()` inside a stream both work** (tested with a throwaway route on the dev server). The route handlers still create the InsForge client and read the profile before opening the stream.
- **`next build` with a temporary mock page** failed the `cacheComponents` rule because the page read `searchParams` outside a Suspense; that was only the mock, not product code. Mock routes were deleted from the project.
- **Headless screenshots:** `--virtual-time-budget` fast-forwards a mock run to its end. A mock mode that stalls (a long sleep on a count) gives a stable mid-run frame.
- **Earlier, still useful:** `tsc --noEmit` shows errors only from stale `.next/types/* 2.ts` copies, so filter with `| grep -v "^\.next/"`. Build in a scratch copy (rsync without `node_modules`, `cp -Rc node_modules`) because the dev server owns `.next`. zsh: use `${=var}` for word splitting.
- **Icon crop with `sharp`:** `extract()` then `trim()` in one chain throws `bad extract area`; do them in two steps. The mark is a 153x153 square at offset (7, 7) in `logo.png`; a loose crop for the apple icon left a rounded corner visible, an inset of 24px (105px square) is clean.

## Current state

- **Verified:** `tsc` and eslint clean on the whole project; `next build` passes with all six routes dynamic; raw chunk timing under dev and production; the checklist's done, current-with-count, skipped and interrupted states at 1000px and 500px (mock only); the pre-flight JSON status and the cut-stream case through the real helper and reader.
- **Favicon and SEO verified:** `next build` passes; against `next start` the `<head>` of `/login`, `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest` and `/favicon.ico` come out as intended; the OG and apple icons were checked by eye. After that check, the `og:url` line was removed from the root layout (a tiny edit, not rebuilt; `tsc` is clean). **Not verified:** a real social-card preview (needs a public URL), the manifest install prompt, and the noindex tag on a signed-in page (the route redirects when signed out).
- **Not verified (needs a signed-in browser):**
  - All six real actions end to end, the stage wording on screen, the 401/404/422 link/429 paths, the 503 path with the cover letter turn given back, closing the tab mid-run and returning to a saved result, and Safari.
  - The `company_researched`, `cover_letter_generated`, `job_search_started` and `job_found` events still firing once per run, and saved rows matching a non-streamed run.
  - The `inline` checklist on Find Jobs is 4px closer to the form than the old line (`mt-3` vs `mt-4`).
- **Not checked:** the `003_cover_letters.sql` migration is recorded as applied but the InsForge MCP was not re-queried.
- **Still owed from before:** feature 06 review items (b), (d), (e); no test runner, so helper tests are not in the repo; full job description fetch is not built; the feature 17 dashboard checks (empty and error states, 60s cache, 429 on a fourth research run, another user's job id giving 404); cover letter checks (tone end to end, Regenerate confirm, Save changes, the profile tone dropdown, the card at 500px).

## Next session starts with

1. Run `git status` and `git diff --stat`, then commit in separate commits: the streaming protocol and helpers, the six routes with their clients, the docs, and the favicon and SEO files (`app/icon.png`, `apple-icon.png`, `favicon.ico`, `opengraph-image.png`, `twitter-image.png`, `robots.ts`, `sitemap.ts`, `manifest.ts`, `lib/site.ts`, the layout and login edits).
2. Restart the dev server, sign in, and run all six actions (Find Jobs, a job's Research and Generate/Regenerate, the profile's Extract and Generate Resume), including the failure paths above. Fix anything that breaks.
3. Set `NEXT_PUBLIC_APP_URL` to the deployed origin (no trailing slash) in the host's environment, then check the share card with the LinkedIn, Facebook or X debugger.
4. Run `/review` before any demo.

## Open questions

- Why did earlier doc and code edits go missing? (This session's doc edits held; the iCloud-synced Desktop is still a suspect.)
- Should the charts move to the InsForge `jobs` table so they match the stat cards? Why does PostHog `identify` never fire on the client?
- Hosting: a Node host keeps a route running after the client leaves; a serverless host may not. The in-memory rate limiter and chart cache also need a shared version before serverless. A 120 s research run could outlive the access token.
- OpenAI's 45 s timeout with one retry can exceed `maxDuration = 60` on four of the routes (not changed here).
- Repeat jobs are skipped, not re-scored, so old match scores go stale when the profile changes.
- Should search-run activity entries link to `/find-jobs`?
- What is the production domain? Until `NEXT_PUBLIC_APP_URL` is set, canonical, share-image and sitemap URLs point at localhost.
