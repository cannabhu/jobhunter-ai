# Memory — Feature 14: Dashboard Page — Full UI (JobPilot / job-rider)

Last updated: 2026-11-16

## What was built

- **Feature 14 is built but NOT committed** (branch `development`; last commit is still `2d3beba`). Uncommitted: all of the below, plus `context/progress-tracker.md` and the earlier `memory.md` edit.
- **New files:**
  - `app/(app)/dashboard/page.tsx` — Server Component; `getUser()` behind `<Suspense>` (redirect `/login?error=session`), real `getProfile()` for the banner, everything else mock. Sits inside the `(app)` group so it shares `AppNavbar`.
  - `app/(app)/dashboard/mockDashboard.ts` — `MOCK_STATS`, `MOCK_ACTIVITY`, `MOCK_RESEARCH_BY_DAY`, `MOCK_JOBS_BY_DAY`, `MOCK_SCORE_DISTRIBUTION`. Features 15, 16 and 17 each replace one export, then the file is deleted.
  - `components/dashboard/`: `StatsBar`, `StatCard`, `RecentActivity`, `ChartCard`, `ResearchActivityChart`, `JobsOverTimeChart`, `MatchDistributionChart` (the three charts are `"use client"`, recharts), `chartStyles.ts` (CSS-variable strings for axis, grid and tooltip).
- **Edited:** `types/index.ts` (added `StatCardData`, `ActivityTone`, `ActivityEntry`, `ChartPoint`); `components/profile/CompletionIndicator.tsx` (optional `actionHref` prop that adds a "Complete your profile" link; the profile page doesn't pass it); `lib/routes.ts` (`SIGNED_IN_HOME` is now `/dashboard` / "Go to Dashboard"); `package.json` + lock (`recharts ^3.10.1`).
- **Docs updated:** `architecture.md`, `code-standards.md` (recharts on the approved list), `library-docs.md` (new Recharts section), `ui-registry.md` (Dashboard page entry), `progress-tracker.md` (14 ticked, Next = 15, notes added).

## Decisions made

- **Followed the design over the build plan:** fourth stat card is "Jobs This Week" (plan said "Cover Letters Generated", out of scope); top-right chart is "Company Research Activity" (plan said "Resume Tailoring Activity"). The build-plan text for 14 was left as is.
- **Incomplete-profile banner is real** (reuses `CompletionIndicator`, shown only while `is_complete` is false) even though the design shows the complete state.
- **Charts use CSS variables in SVG props, never hex.** `--color-chart-axis` already existed in `globals.css`. Y ticks are passed in as `yTicks` from the page (fixed by the design: 0-12 by 3, 0-100 by 25); feature 17 must compute them from real data.
- **`ChartCard` gives the chart an `absolute inset-0` box inside `relative min-h-[280px] flex-1`** because `ResponsiveContainer` needs a definite size.
- **Company Research Activity chart has a 40px top margin** because its plot starts lower in the design than the other two charts.
- **Activity dot tone is stored on each mock entry** (design mixes accent, info, success). Feature 16 should map entry type to tone: research = info blue, found = success green.
- Kept the existing `AppNavbar` (design's navbar has no Sign out and a bigger logo), as for earlier pages.

## Problems solved

- **`next build` in a scratch copy fails with a symlinked `node_modules`** ("Could not find the Next.js package"). Fix: `cp -Rc node_modules <scratch>/node_modules` (APFS clone, instant) and rsync the project without `node_modules`, `.next`, `.git`. The dev server owns `.next`, so build in a copy.
- **`tsc` shows errors in `.next/types/* 2.ts`:** stale iCloud-sync duplicates, not code errors. Filter with `grep -v "^.next/"`.
- **BSD `sed -i` on macOS chokes on patterns with slashes;** use the Edit tool.
- **Visual check method that worked:** temporary public route (e.g. `app/tmp-dashboard-preview/page.tsx`, deleted after), screenshot with headless Chrome at `--window-size=1440,1120 --virtual-time-budget=8000` against the running dev server on port 3000. Design PNG is a 2000px render of a 1440px frame (scale 1.389).

## Current state

- **Verified:** tsc (filtered), eslint and `next build` (scratch copy) pass; `/dashboard` is a partial prerender; signed out, `/dashboard` redirects to `/login`. Screenshot matches the design at 1440px (stat cards 137px, activity card 407px vs 410px, column widths, bar widths, line and gradient); stacks cleanly at 500px.
- **Not verified (needs a real signed-in browser):** the real `/dashboard` render, the banner with an incomplete profile, chart tooltips on hover, widths between `sm` and `lg`.
- **Still unverified from earlier features:** Refresh research, the 429 on a fourth research run in 10 minutes, another user's job id giving 404, how the dossier card looks.
- **Still owed from earlier:** feature 06 review issues (b), (d), (e).
- **Not built:** full job description fetch (Adzuna `about_role` is a 500-char preview).
- **Environment:** Wi-Fi DNS is 8.8.8.8 / 8.8.4.4 (1.1.1.1 times out on this network). Dev server runs on port 3000.

## Next session starts with

1. Commit feature 14 on `development` (include `package.json`/lock for recharts). Optionally open `/dashboard` signed in first to eyeball it.
2. Start **15 Stats Bar — Real Data**: replace `MOCK_STATS` with real counts for the current user (Total Jobs Found = count of jobs; Avg. Match Rate = avg `match_score`; Companies Researched = jobs where `company_research` is not null; Jobs This Week = jobs found in last 7 days). Scope every query to `user_id`. The "+12% vs last week" trend badges on cards 1 and 2 have no defined source in the build plan; decide whether to compute week-over-week or drop the badges.
3. Then 16 (Recent Activity from `agent_runs` + `jobs.researched_at`) and 17 (PostHog charts).

## Open questions

- Feature 15: how to compute the trend badge ("+12% vs last week") for Total Jobs Found and Avg. Match Rate, and what to show when last week has no data.
- Feature 17: PostHog HogQL/query access from the server for `job_found` and `company_researched` events (needs a personal API key — never commit it); Y-axis ticks must be derived from data.
- Add a web-search step or a "company website" field on the job for companies the model doesn't know?
- Which of the 06 review issues (b), (d), (e) are still real?
- Why does PostHog `identify` never fire on the client?
- `CompletionIndicator` has no complete-profile design (banner is just hidden).
- A research run (up to about 2 minutes) could outlive the access token mid-request; a 120s synchronous request may hit the host's time limit once deployed.
- The in-memory rate limiter needs a DB-backed version before deployment.
- An iCloud-synced Desktop corrupts `node_modules` and `.next` at times; consider moving the project out of a synced folder.
- Repeat jobs are skipped, not re-scored, so old match scores go stale if the profile changes.
