# Memory — Feature 04 Database Schema (JobPilot / job-rider)

Last updated: 2026-11-15

## What was built

- `db/migrations/001_initial_schema.sql`, applied to InsForge via `run-raw-sql`: tables `profiles`, `agent_runs`, `jobs`, `agent_logs`, with indexes, check constraints, an `updated_at` trigger on `profiles`, one `for all` RLS policy per table for `authenticated` (`id = auth.uid()` on profiles, `user_id = auth.uid()` elsewhere), and a backfill of `profiles` rows for the 2 users who existed.
- Private `resumes` storage bucket created.
- `lib/insforge/profile.ts` — `getProfile()` (React `cache()`d): reads the signed-in user's `profiles` row and creates it on first use.
- `types/index.ts` — `ProfileRow` type mirroring the table.
- Dropped the unused empty `app_events` table.
- Docs updated: `architecture.md`, `build-plan.md` (item 04), `progress-tracker.md` (04 ticked, Next = 05). `ui-registry.md` untouched (no UI).

## Decisions made

- Added to the spec: `profiles.completion_percentage` and `missing_fields`; `jobs.external_id` (unique per `(user_id, external_id)`, so repeat searches upsert) and `jobs.researched_at` (feeds the activity feed in feature 16).
- Structured job columns (`responsibilities`, `requirements`, `nice_to_have`, `benefits`, `about_company`) kept but nullable and unused for Adzuna jobs. Adzuna's snippet goes in `about_role`; `source_url` = Adzuna `redirect_url`; `external_apply_url` nullable and unused.
- InsForge refuses triggers on `auth.users`, so profile rows are created lazily by `getProfile()`, not by a signup trigger. Feature 06 can then use a plain `update`.
- `resumes` bucket is private, object key `{user_id}/resume.pdf`, read only on the server. `profiles.resume_pdf_url` just means "a resume exists".

## Problems solved

- Trigger on `auth.users` fails with `must be owner of relation users`. Fallback: lazy `getProfile()`.
- The OAuth callback can't create the profile row, because the SDK strips tokens from `exchangeOAuthCode` results.
- The InsForge SQL tool blocks `set role` and session config, so impersonating users in SQL is not possible. It also returns only the last statement of a multi-statement query.
- `npx tsc --noEmit` prints unrelated `TS2688` "estree 2 / json-schema 2 / node 2" noise from duplicate `@types` folders. Filter for `error TS` excluding `TS2688`.

## Current state

- Schema, policies, indexes and bucket are live. Constraints were tested in a rolled-back block: unique `external_id`, `source`/`match_score`/status checks, and `run_id` set-null all behave. Type-check and lint are clean.
- NOT verified: real cross-user RLS isolation (policies only inspected), and `getProfile()` has never run against a real session.
- NOT wired: no page calls `getProfile()` yet.
- Nothing from features 03 or 04 is committed (branch `development`).
- Feature 03 (PostHog events) is still not verified in a browser or in live PostHog data.

## Next session starts with

1. Start 05 Profile Page — Full UI (mock data first, per the build plan). Run `/architect` first if wanted.
2. Features 05/06/14 must call `getProfile()` instead of querying `profiles` directly.
3. Whenever convenient: PostHog check from feature 03. Sign in once and confirm in Live events: exactly one `user_signed_in` (none on reload); `cta_clicked` with correct properties; `/login?error=oauth` gives one `sign_in_failed` and a cleaned URL.

## Open questions

- Feature 05/06 owes an authenticated route handler that streams the private resume PDF for the preview.
- Confirm RLS isolation with a real second session the first time feature 06 or 10 writes data.
- The dashboard in the build plan has a "Cover Letters Generated" card, but cover letters are out of scope (feature 14). Replace it with something else?
- Carried over from feature 03: `identify` sends email and name to PostHog (keep, or send only the ID?). Write the event convention (client `capture` for UI, server `posthog-node` for business events, OTel logs for diagnostics only) into `code-standards.md`? Minor: `TrackedLink` drops the label when children aren't a plain string; the dev-only Strict Mode double `sign_in_failed`; the stale `posthog-client.ts` example at `code-standards.md` line 57; the `jp_just_signed_in` cookie name is duplicated in two files.
- OAuth redirect: `http://localhost:3000/api/auth/callback` must be in `allowedRedirectUrls` in the InsForge dashboard (it was empty); a full browser sign-in round trip is still unconfirmed.
