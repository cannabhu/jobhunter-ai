# Progress Tracker

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** 2 — Profile Page
**Last completed:** 05 Profile Page — Full UI (mock data, no save logic). Before that: 04 Database Schema, 03 PostHog Initialization (not yet verified against live PostHog data) and 02 Auth (end-to-end OAuth login still to be confirmed by hand)
**Next:** 06 Profile Save Logic

---

## Progress

### Phase 1 — Foundation

- [x] 01 Homepage
- [x] 02 Auth
- [x] 03 PostHog Initialization
- [x] 04 Database Schema

### Phase 2 — Profile Page

- [x] 05 Profile Page — Full UI
- [ ] 06 Profile Save Logic
- [ ] 07 AI Profile Extraction from Resume
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
