# Memory — Feature 09 Find Jobs Page UI (JobPilot / job-rider)

Last updated: 2026-11-15

## What was built

- **Feature 09, built to `context/designs/find-jobs.png` with mock data.** Nothing is committed; it is uncommitted on `development`. The latest commits are `a7b3070 feat: add generate resume` (08) and `a80f447` (07), so 07 and 08 are committed. The old memory.md was stale on this.
  - `app/(app)/find-jobs/page.tsx`: `getUser()` behind `<Suspense>`, with `redirect("/login?error=session")` on a null user, then the layout below. Visible h1 is `sr-only` (the design has no title).
  - `app/(app)/find-jobs/mockJobs.ts`: 6 rows from the design, the banner text "Found 8 jobs and saved 4 strong matches.", and the paging mock (page 1, pages `[1,2,3,"ellipsis",8]`, 1 to 6 of 24). **Delete it when features 10 and 11 land.**
  - `components/find-jobs/`: `SearchControls`, `JobFilters`, `FilterSelect`, `JobsTable`, `MatchScoreBar`, `JobsPagination`.
  - `types/index.ts`: added `JobListItem` (`foundLabel` is a ready made string) and `PaginationItem`.
- Docs updated: `progress-tracker.md` (09 ticked, Next = 10, long note), `ui-registry.md` ("Find Jobs page (feature 09)" entry), `architecture.md` (tree).

## Decisions made

- **The design beat the written specs.** It has no SOURCE column (the build plan and project-overview list a Search/URL badge), so there is none. It also shows no "Jobs by Adzuna" credit, so none was added.
- **Match score bar bands follow the design** (sampled from the PNG): 90 and above `fill-success-alt`, 80 to 89 `fill-info-medium`, below 80 `fill-warning`, track `fill-border-light`, 96 x 6 px. `ui-rules.md` and `ui-tokens.md` disagree with each other and with the design. These are display bands, separate from `MATCH_THRESHOLD` = 70 (the high/low filter), which does not exist yet because `lib/utils.ts` doesn't exist. Feature 11 must create it.
- Existing `AppNavbar` kept as is, including Sign out (the design omits it).
- Dropdowns are native `<select>`s, uncontrolled. The first (match filter) is `text-text-primary`, the second (sort) `text-text-dark`, as in the design. Inputs carry `name`s: `jobTitle`, `location`, `query`, `match`, `sort`.

## Problems solved

- **Dynamic bar width without an inline style** (code-standards bans them): draw the bar as an SVG with `<rect width="94%">`.
- **`text-left` and `text-center` on the same `<th>` clash.** Keep alignment out of the shared header class.
- **Visual check without signing in:** temporary public route `app/zz-preview` rendering the same components, screenshotted with headless Chrome against the running dev server, then deleted. Chrome headless clamps the window to about 500px minimum, so a 390px screenshot lies; measure `scrollWidth` instead.
- **`next build` while the dev server runs:** don't build in the project dir. `rsync` the project (without node_modules, .next, .git) to the scratchpad, **`cp -cR node_modules`** (APFS clone; Turbopack rejects a symlinked node_modules), build there, then delete the copy.
- Sampling design colours: no PIL available; `sips -c 1 1 --cropOffset Y X -s format bmp` plus reading the BMP bytes works.

## Current state

- **Verified:** tsc, lint and `next build` pass (`/find-jobs` is a partial prerender). Signed out, `/find-jobs` redirects to `/login`. The screenshot matches the design (offsets within about 5px). The page does not overflow at 500px and the table scrolls inside its card.
- **Not wired (by design):** the Find Jobs button, filter input, both selects and the pagination buttons do nothing. Rows are not links (job details is feature 12). The empty state in `JobsTable` was added (ui-rules requires one) but never rendered, since the mock is never empty.
- **Never verified with a real sign-in (owed since feature 04):** a signed-in render of `/profile` and `/find-jobs`, a real profile save, upload and replace of a PDF, the View link, Extract and Generate clicks, the 429 and 422 paths, tag commit on blur, sign-out click, second-user RLS, and OAuth landing on `/profile`.
- **Feature 06 review issues (b), (d), (e) are still unchecked** (no try/catch around `saveProfile` in the transition; upload buffers the whole body before the 5MB check; PDF logic in the route handler).

## Next session starts with

1. Ask whether to **commit** feature 09 (nothing is committed).
2. Do the **one real browser pass** (covers 06 to 09): sign in, land on `/profile`, save a partial profile, upload/replace a PDF and click View, Extract and Generate, sign out, and open `/find-jobs` signed in.
3. Start **10 Adzuna Job Discovery**. Read `context/build-plan.md` first. It needs `POST /api/agent/find` with `jobTitle` and `location`, `agent/adzuna.ts`, `lib/adzuna.ts` (always `category=it-jobs`, omit `where` when empty), GPT-4o scoring through the shared `lib/openai.ts` client with `checkRateLimit` first, and an `agent_runs` row. Add `lib/posthog-server.ts` for `job_search_started` and `job_found`. Wire the real search into `SearchControls` and replace the mock rows. Use `JobListItem`.

## Open questions

- **Where does the "Jobs by Adzuna" credit go?** The design omits it, but `project-overview.md` asks for it and Adzuna's terms normally require attribution. Decide when real jobs land (feature 10).
- Feature 11 needs a relative time formatter for `found_at` ("2 hours ago"), and a page-size decision (the plan says 20 per page, while the design mock shows 6).
- Which of the 06 review issues (b), (d), (e) are still real?
- Should the resume-filled highlight clear on edit and save, as built?
- Should the Dashboard link be hidden or disabled until feature 14 (it goes to the 404 page)?
- Why does PostHog `identify` never fire on the client? Still unresolved.
- A complete-profile design for `CompletionIndicator` is missing (the banner is just hidden).
- Access-token lifetime, and the success path of the proxy refresh on `/api` routes, were never tested with a real expired session.
- The in-memory rate limiter needs a DB-backed version before real deployment.
- An iCloud-synced Desktop corrupted `node_modules` once (during the 08 install). Consider moving the project out of a synced folder.
