# Progress Tracker

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** 1 — Foundation
**Last completed:** 04 Database Schema (applied to InsForge and verified; cross-user RLS not exercised end to end — see Notes). Before that: 03 PostHog Initialization (not yet verified against live PostHog data) and 02 Auth (end-to-end OAuth login still to be confirmed by hand)
**Next:** 05 Profile Page — Full UI

---

## Progress

### Phase 1 — Foundation

- [x] 01 Homepage
- [x] 02 Auth
- [x] 03 PostHog Initialization
- [x] 04 Database Schema

### Phase 2 — Profile Page

- [ ] 05 Profile Page — Full UI
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
