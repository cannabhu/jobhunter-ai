# Progress Tracker

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** 2 — Profile Page
**Last completed:** 07 AI Profile Extraction from Resume (built and reviewed; the signed-in click-through is still unverified, see Notes). Before that: 06 Profile Save Logic (built and checked headlessly — the signed-in save, upload and RLS paths still need one real browser pass, see Notes). Before that: 05 Profile Page — Full UI, 04 Database Schema, 03 PostHog Initialization (not yet verified against live PostHog data) and 02 Auth (end-to-end OAuth login still to be confirmed by hand)
**Next:** 08 Resume PDF Generation from Profile

---

## Progress

### Phase 1 — Foundation

- [x] 01 Homepage
- [x] 02 Auth
- [x] 03 PostHog Initialization
- [x] 04 Database Schema

### Phase 2 — Profile Page

- [x] 05 Profile Page — Full UI
- [x] 06 Profile Save Logic
- [x] 07 AI Profile Extraction from Resume
- [ ] 08 Resume PDF Generation from Profile

### Phase 3 — Find Jobs Page

- [ ] 09 Find Jobs Page — Full UI
- [ ] 10 Adzuna Job Discovery
- [ ] 11 Filter + Sort + Pagination

### Phase 4 — Job Details Page

- [ ] 12 Job Details Page — Full UI
- [ ] 13 Company Research Agent

### Phase 5 — Dashboard

- [ ] 14 Dashboard Page — Full UI
- [ ] 15 Stats Bar — Real Data
- [ ] 16 Recent Activity — Real Data
- [ ] 17 Analytics Charts — PostHog Data

---

## Decisions Made During Build

- Homepage CTAs are auth-aware: signed out → "Get Started"/"Start for free" → /login; signed in → "Go to Dashboard" → /dashboard (Find Your First Match → /find-jobs). Session is read behind `<Suspense>` (AuthCtaButtons, NavbarActions) so the page stays partially prerendered under `cacheComponents`.
- Added `.bg-hero-gradient` utility in globals.css (built from accent-light/info-light tokens) for the pastel hero/CTA backgrounds.
- Navbar is a client component only for `usePathname` active state.
- Root layout switched from Geist to Inter via `--font-sans`, per ui-rules.md.
- Next 16 `next/image` uses `preload` (not `priority`).
- Auth uses `@insforge/sdk/ssr` (`@insforge/ssr` does not exist on npm). Server-side OAuth: Server Actions in `actions/auth.ts` start the flow and store the PKCE verifier in an httpOnly `insforge_code_verifier` cookie; `/api/auth/callback` exchanges `insforge_code`; `/api/auth/sign-out` and `/api/auth/refresh` complete the set. Sign-out lives on its own protected `/sign-out` confirmation page (not in the navbar); later pages (e.g. Profile) should link to it.
- Next 16 renamed middleware to `proxy.ts`. It runs `updateSession`, redirects signed-out users from /dashboard, /profile, /find-jobs(/**) to /login, and signed-in users from /login to /dashboard.
- Staying on Tailwind v4 — AGENTS.md's "Tailwind 3.4" line is InsForge boilerplate and does not apply.
- Env vars live in `.env.local` (gitignored): NEXT_PUBLIC_INSFORGE_URL, NEXT_PUBLIC_INSFORGE_ANON_KEY, NEXT_PUBLIC_APP_URL.

---

## Notes

_Add notes here as the build progresses — workarounds, patterns, anything that differs from the context files._

- **Before the first real login:** add `http://localhost:3000/api/auth/callback` to `allowedRedirectUrls` in the InsForge dashboard (it is currently empty). Google and GitHub providers are already enabled, and OAuth init was verified for both.
- Verified: build, lint, tsc pass; proxy redirects; callback rejects a missing code. Not yet verified: a full browser sign-in round trip.
- PostHog hook points: `identify` after the callback redirect lands, `reset` after the sign-out redirect (feature 03).
- Post-review fixes: `getUser()` is wrapped in React `cache()` (one InsForge call per request); proxy redirects carry over refreshed/cleared session cookies; callback, sign-out and sign-in action have try/catch with `[prefix]` logging (sign-out always clears cookies locally); architecture.md and code-standards.md updated to the real paths (`lib/insforge/{client,server}.ts`, `@insforge/sdk/ssr`, `proxy.ts`).
- **Open for feature 14+:** the proxy only checks that a valid-looking, unexpired token cookie exists (a forged cookie passes it). Protected pages must verify with `getUser()`, and the invalid-session case needs handling so `redirect("/login")` plus the proxy's `/login` → `/dashboard` rule can't loop.
- Under `cacheComponents`, any `cookies()`/`searchParams` read must sit behind `<Suspense>` (see AuthCtaButtons, NavbarActions, login ErrorNotice).
- PostHog event tracking added for existing surfaces: `cta_clicked` (via `components/analytics/TrackedLink.tsx`; locations hero / bottom_cta / navbar), `user_signed_in` (in `instrumentation-client.ts`, gated by the one-shot `jp_just_signed_in` cookie set in `/api/auth/callback`), `sign_in_failed` (`SignInFailedTracker` on /login; strips `?error` so reloads don't recount), plus existing `oauth_sign_in_started` and `user_signed_out`. Events listed in code-standards.md.
- **04 Database Schema:** applied `db/migrations/001_initial_schema.sql` (profiles, agent_runs, jobs, agent_logs with RLS, indexes, check constraints; existing two users backfilled) and created the private `resumes` bucket. Verified via `get-table-schema`/`list-buckets`: columns, policies, `rlsEnabled`, unique `(user_id, external_id)`, check constraints and `on delete set null` behave as specified (tested in a rolled-back block). **Not verified:** actual cross-user isolation — the SQL tool blocks role switching, so RLS is confirmed by policy inspection only. Confirm with a real second session when feature 06 or 10 first writes data.
- InsForge refuses triggers on `auth.users` ("must be owner of relation users"), so there is no signup trigger. `getProfile()` in `lib/insforge/profile.ts` creates the `profiles` row on first use. It is not wired into any page yet — **features 05/06/14 must call it** instead of querying `profiles` directly. The SDK strips tokens from `exchangeOAuthCode` results, so the OAuth callback cannot create the row itself.
- The unused, empty `app_events` table (leftover from an earlier event-logging approach) was dropped after feature 04. The older note about `lib/events.ts` is stale.
- Feature 05/06 still owes a small authenticated route handler that streams the private resume PDF for the preview.
- **05 Profile Page — Full UI:** built to `context/designs/profile.png` and compared against a headless-Chrome screenshot (layout, spacing and field states match). Signed-in pages now share `app/(app)/layout.tsx` + `components/layout/AppNavbar.tsx` (route group — URLs unchanged); features 09 and 14 should live inside `app/(app)/` too. The page checks `getUser()` behind `<Suspense>`, then renders **mock data** from `app/(app)/profile/mockProfile.ts` — it does not call `getProfile()` yet. Feature 06 must swap the mock for `getProfile()`, map `ProfileRow` → `ProfileFormValues` (types/index.ts), and delete the mock file.
- 05 behaviour that is real: skills/industries tag add/remove (Enter or Add; duplicates ignored), add/remove work roles (max 3, remove shown only when more than one), "Currently working here" disables the end date, resume drop zone validates PDF type and 5MB and shows the chosen file. Not wired (by design): Save Profile (submit is `preventDefault`ed), Generate Resume from Profile, and uploading the chosen resume. Inputs carry `name` attributes (`workExperience.{i}.company`, `education.degree`, repeated hidden `skills` inputs) ready for the 06 Server Action.
- Field state rule: inputs are gray when filled and white with a soft shadow when empty; fields flagged in `missing_fields` stay white (the education block, as in the design). `missing_fields` slugs are lowercase (`phone`, `location`, `education`) and shown uppercase in the banner. The banner only renders the "needs attention" state — a complete-profile state is still to design.
- Deliberately left out: the "Cover Letter Tone" dropdown (listed in the build plan, absent from the design, and cover letters are out of scope). Also no sign-out link anywhere — the design has none; /sign-out is reachable only by URL until a place for it is decided.
- Added `lucide-react` (already approved in code-standards.md) and `--color-error-light` / `--color-error-lightest` tokens.
- Fixed a feature-03 bug found by `next build`: `SignInFailedTracker` tested the return value of `URLSearchParams.delete()` (always undefined), so `?error` was never stripped from the URL. It now checks `has()` first.
- **Post-login routing fix (review of 02 Auth):** `/dashboard` doesn't exist until feature 14, so the OAuth callback, the proxy's signed-in `/login` bounce, both homepage CTAs and the sign-out Cancel link all led to a 404 dead end with no navbar. They now share `SIGNED_IN_HOME` in `lib/routes.ts` (currently `/profile`, label "Go to Profile"). **When feature 14 ships, change that one constant back to `/dashboard`.**
- Redirect-loop guard: with `/login` now bouncing to `/profile`, a session the proxy accepts (valid-looking cookie) but `getUser()` rejects would loop forever. Pages that fail `getUser()` now `redirect("/login?error=session")`; the proxy leaves `/login?error=...` alone and the login page shows "Your session has expired". Every new protected page (dashboard, find-jobs) must use the same redirect. Verified with a forged unexpired token cookie; a real OAuth round trip is still unconfirmed.
- Added `app/not-found.tsx` (reuses the auth-card shell: Back to home + `SIGNED_IN_HOME` button) so unbuilt routes such as /dashboard and /find-jobs no longer strand users on a bare 404.
- **06 Profile Save Logic:** the profile page now reads `getProfile()` (mock deleted) and `saveProfile` in `actions/profile.ts` writes every form field. Pure helpers in `lib/`: `profileSchema.ts` (zod validation of the FormData, plus `splitList`/`joinList`), `profileCompletion.ts` (the 11 required fields → `completion_percentage`, `missing_fields`, `is_complete`), `profileMapping.ts` (row ↔ form values; jsonb is read leniently so bad stored data can't crash the page). Required fields: full name, phone, location, work authorization, current title, experience level, years of experience, ≥1 skill, ≥1 work role (company + title), education (degree + institution), ≥1 job title seeking. Empty required fields never block a save — only malformed values do (bad URL, years outside 0–60, graduation year not 4 digits, end date before start, >3 roles). Fully empty work roles are dropped; `endDate` is cleared when "Currently working here" is ticked.
- **Resume upload is separate from Save:** `POST /api/resume/upload` runs the moment a PDF is picked (checks type, ≤5MB and the `%PDF-` header server-side), stores it at `resumes/{user_id}/resume.pdf` and sets `profiles.resume_pdf_url`. `GET /api/resume/file` streams the user's own PDF for the "View" link. The key always comes from the session, never the request. Feature 07's Extract button can rely on the file existing before the profile is saved.
- **InsForge `storage.upload()` has no `upsert` option** — it PUTs to the object path, which replaces an existing file. `library-docs.md` and the old build-plan text said `upsert: true`; both corrected. Replacing a resume (second upload) has not been exercised against the live bucket yet.
- **`profile_completed`** is captured client-side (posthog-js) when the action returns `justCompleted` — i.e. each time a save moves the profile from incomplete to complete. There is no persisted "first time ever" flag, so a user who completes, edits to incomplete, and completes again fires it twice; count it as first-occurrence-per-user in PostHog. `lib/posthog-server.ts` is still deferred to feature 10.
- **The form submits via `onSubmit` + `useTransition`, not `<form action>`,** because React 19 resets uncontrolled fields after a form action — that would wipe the user's input after a validation error. Validation messages are shown as a list above Save Profile (not per field). Zod runs object-level checks (end-before-start) only once the individual fields are valid, so that message can appear on the second save attempt.
- GET route handlers under `cacheComponents` are prerendered; `app/api/resume/file/route.ts` calls `await connection()` **outside** its try/catch so the build pass doesn't log a spurious error. Do the same in any new GET handler that reads the session.
- The completion banner is hidden when `is_complete` (no complete-state design exists). Cover Letter Tone is still not in the form, and `saveProfile` never writes that column.
- **Still unverified (needs a real browser sign-in):** a signed-in save round trip, uploading and replacing a PDF, the View link, and cross-user RLS isolation with a second real session. Verified headlessly: tsc, lint and `next build` pass; zod/completion/mapping logic passes a scripted test (empty, partial, complete, malformed, >3 roles, garbage jsonb, save→load round trip); the exact update payload passes the table's check constraints (tested in a rolled-back DB block); signed-out `GET /api/resume/file` and `POST /api/resume/upload` return 401 and `/profile` redirects to `/login`.
- **Sign out button:** `AppNavbar` now has a one-click `SignOutButton` (secondary-button style per ui-rules/ui-tokens). It posts straight to `/api/auth/sign-out` (clears cookies, redirects to `/`) after `user_signed_out` + `posthog.reset()`, with no confirmation. This supersedes the earlier note that sign-out lives only on the `/sign-out` page. `app/sign-out/page.tsx` still works at its URL but nothing links to it any more.
- **Fix: "session expired" on `/api` routes.** The proxy matcher used to exclude all of `/api`, but the access-token cookie expires with its JWT and only `updateSession` (in `proxy.ts`) can refresh it. So after the token lifetime, `GET /api/resume/file` (View) and `POST /api/resume/upload` returned 401 until the user reloaded a page. The matcher now excludes only `/api/auth/*`, so every other API route (resume, and the planned agent/find, agent/research, resume/extract, resume/generate) gets the same refresh as pages. `GET /api/resume/file` also redirects to `/login?error=session` when the session is truly dead, since it is opened as a page navigation. Verified: with a forged expired access cookie plus a fake refresh cookie, the API routes now trigger a refresh attempt and clear the cookies (before the fix they did nothing); `/api/auth/sign-out` is untouched. **Not verified:** the success path with a real expired-but-refreshable session (needs a real sign-in left open past the token lifetime). Caveat: a long agent run that outlives the token mid-request is not covered — each route calls `getUser()` once at the start.
- **07 AI Profile Extraction from Resume:** `POST /api/resume/extract` (no body) downloads the signed-in user's stored PDF, reads it with `pdf-parse` v2, returns the spec error (422) if there are under 100 characters of text, then `agent/resumeExtractor.ts` asks GPT-4o (`json_object`, temp 0.3, `max_tokens` 1500, not the documented 800, which truncates three roles) for form-shaped JSON. `lib/resumeExtraction.ts` treats that JSON as untrusted: every field is read on its own and bad values drop to blank. It writes nothing to the database.
- **How the form gets the values:** its inputs are uncontrolled, so `ProfileEditor` (new client wrapper around `ResumeUpload` + `ProfileForm`) snapshots the live form with `readFormValues`, applies `mergeExtractedValues`, and bumps a `key` to remount the form. **Merge rule:** resume wins where it has a value; blanks keep the current value; skills/industries are unioned; work roles and education are replaced as blocks; email, work authorization, job titles, remote preference, salary and preferred locations are never touched. Unsaved edits to fields the resume covers are replaced; a typed-but-not-added skill is committed on blur first, so it survives.
- Named `agent/resumeExtractor.ts`, not `extractor.ts`, because the architecture reserves `extractor.ts` for job-description extraction. Refactor on the way: Save's limits and enum values moved to `lib/profileConstants.ts` and the FormData readers (plus `splitList`/`joinList`) to the zod-free `lib/profileFormData.ts`; `profileSchema.ts` now imports them.
- Zod 4 gotcha found by the logic test: an object schema built from `z.unknown().transform(...)` still **requires every key**, so a role missing one key threw and would have returned a 500. Parse fields individually when input may omit keys.
- `next.config.ts` has `serverExternalPackages: ["pdf-parse"]`. Verified in plain Node on a hand-made PDF; a corrupt file throws and is mapped to the "could not extract" error.
- **Verified:** tsc, lint and `next build` pass; scripted logic test (garbage JSON, bad enums/months, end-before-start, >3 roles, duplicate skills, every merge rule) passes; signed out, `POST /api/resume/extract` returns 401; the real GPT-4o call on a sample resume returns correct fields and ignores an instruction planted in the resume text; a bad key fails in under a second with one log line. **Not verified:** the signed-in click-through (extract, merge over existing data, scanned PDF, no resume) and the rate-limit response through the route (the limiter itself is unit-tested).
- **Review fixes for 07:** (1) OpenAI failures (quota, bad key, outage, timeout) are caught in `agent/resumeExtractor.ts`, logged as one line (`status`, `code`, `requestId`, plus an "out of credits" hint) instead of dumping the SDK error with its response headers and cookies, and surface as `ResumeExtractionUnavailableError` → HTTP 503 "Reading your resume is temporarily unavailable. Please try again later." (before: 500 and "try again", which can never help on a quota error). (2) The OpenAI client is module-level with `timeout` 45s and `maxRetries` 1 (SDK defaults are 10 minutes and 2 retries, which made a quota failure take ~6s); the route exports `maxDuration = 60`. (3) `lib/rateLimit.ts`: 5 extractions per user per 10 minutes, checked before the download and the model call, returns 429 with a "try again in N minutes" message. It lives in server memory, so it is per instance and resets on restart. (4) `TagInput` now commits the typed draft on blur, so clicking Save or Extract no longer drops a half-added skill or industry (this also closes 06 review issue (c)).
- **Resume-filled highlight (UI follow-up to 07):** `mergeExtractedValues` also returns `filledFields` (input names). `ProfileEditor` keeps them in state and shares them via `FilledFieldsProvider`; filled inputs get an accent border + `bg-accent-muted` through `group-data-[filled=true]/field:` variants in `fieldStyles.ts`, labels get a "From resume" tag, section headers a "Filled from resume" pill, resume-supplied skill/industry chips a purple style, and the form a top banner. A highlight clears when the field is edited, all clear after a successful save. Checked on a temporary preview page screenshotted in headless Chrome (page deleted); **not** checked through the real Extract click. Skill chips only highlight tags the resume returned, so a tag the user already had that the resume also lists becomes highlighted too. See ui-registry.md "Resume-filled field highlight".
- No new PostHog event for extraction: the event list in code-standards.md is closed.
