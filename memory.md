# Memory — PostHog event tracking (JobPilot / job-rider)

Last updated: 2026-11-14

## What was built

- PostHog was already initialized by the PostHog wizard: `instrumentation-client.ts` (posthog-js init, `capture_exceptions`, identify), `instrumentation.ts` (OTel logger exporting server diagnostics to PostHog logs, used in `actions/auth.ts` and the auth routes), `app/global-error.tsx`.
- Added this session:
  - `components/analytics/TrackedLink.tsx` — fires `cta_clicked` (`location`, `destination`, `label`). Used in `CtaButtons` (new required `location` prop, passed from `AuthCtaButtons`: `hero` / `bottom_cta`) and `NavbarActions` (`navbar`).
  - `components/analytics/SignInFailedTracker.tsx` — fires `sign_in_failed`, then strips `?error` via `history.replaceState` so reloads don't recount.
  - `user_signed_in` — `/api/auth/callback` sets a one-shot cookie `jp_just_signed_in` (60s, not httpOnly); `instrumentation-client.ts` identifies once, then captures the event and deletes the cookie if present. The name is duplicated in both files.
- Existing events: `oauth_sign_in_started` (`components/auth/OAuthSignInButtons.tsx`), `user_signed_out` + `posthog.reset()` (`app/sign-out/page.tsx`).
- Docs reconciled with the wizard layout: `build-plan.md` item 03, `code-standards.md` (events table, env vars), `architecture.md`, `library-docs.md`, `progress-tracker.md` (03 ticked, Next = 04).

## Decisions made

- Built on the wizard's setup; no `lib/posthog-client.ts`. `lib/posthog-server.ts` (`posthog-node`) is deferred until the first server-side event (`job_found`, `company_researched`).
- Env vars: `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST`.
- Event convention: client `posthog.capture` for UI interactions, server `posthog-node` for reliable business events, OTel logs for diagnostics only (not yet written into `code-standards.md`).
- `user_signed_in` uses the cookie approach, not a distinct-id comparison, to avoid over-counting.
- Event list in `code-standards.md` now has 9 events and must be updated before any new event is added.

## Problems solved

- `npx tsc --noEmit` prints unrelated `TS2688` "estree 2 / json-schema 2 / node 2" errors from duplicate folders in node_modules/@types; filter them out.
- `user_signed_in` over-counting (new device or cleared storage) and `sign_in_failed` repeating on reload are both fixed in code.

## Current state

- Lint clean and type-check clean for all changed files. Item 03 ticked in the progress tracker.
- NOT yet verified in a browser or against live PostHog data.

## Next session starts with

1. Sign in once, then confirm in PostHog Live events: exactly one `user_signed_in` (none on reload); `cta_clicked` with correct properties; `/login?error=oauth` gives one `sign_in_failed` and a cleaned URL.
2. Then start 04 Database Schema.

## Open questions

- `identify` sends email and name to PostHog: keep, or send only the ID?
- `progress-tracker.md` has a note about a Postgres `app_events` table and `lib/events.ts`, but `lib/events.ts` doesn't exist. Stale or lost work?
- Write the event-convention rule into `code-standards.md`?
- Minor: `TrackedLink` drops the label when children aren't a plain string; the dev-only Strict Mode double `sign_in_failed`; the stale `posthog-client.ts` naming example (`code-standards.md` line 57); the cookie name is duplicated in two files.
