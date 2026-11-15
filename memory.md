# Memory — Feature 06 Profile Save Logic + review + navbar sign-out (JobPilot / job-rider)

Last updated: 2026-11-15

## What was built

- **Feature 06 Profile Save Logic**, built per the `/architect` plan. The profile page now reads `getProfile()`; `mockProfile.ts` is deleted.
  - `actions/profile.ts`: `saveProfile(formData)` validates, computes completion, updates `profiles` (scoped to the session user, checks that a row was actually updated), and calls `revalidatePath("/profile")`. It returns `{ success, error?, fieldErrors?, justCompleted? }`.
  - `lib/profileSchema.ts` (zod 4 validation of FormData, plus `splitList`/`joinList`), `lib/profileCompletion.ts` (11 required fields → `completion_percentage`, `missing_fields`, `is_complete`), `lib/profileMapping.ts` (row ↔ form values, lenient jsonb parsing, update payload), `lib/resume.ts` (size limit and route paths).
  - `app/api/resume/upload/route.ts` (POST, runs the moment a PDF is picked: checks type, ≤5MB and the `%PDF-` header, stores it at `resumes/{user_id}/resume.pdf`, sets `profiles.resume_pdf_url`) and `app/api/resume/file/route.ts` (GET, streams the user's own PDF; calls `await connection()` outside its try/catch).
  - UI: `ProfileForm.tsx` (submits via `onSubmit` + `useTransition`, not `<form action>`; shows a saving state, a success message, an error list; fires `profile_completed` in posthog-js when `justCompleted`), `ResumeUpload.tsx` (upload on pick, "Resume on file" row with a View link), `CompletionIndicator.tsx` (inline style → `size-[130px]`; the page hides it when `is_complete`).
  - `types/index.ts`: added `ProfileInput` and `SaveProfileResult`. Installed `zod`.
- **Navbar sign-out:** `components/layout/SignOutButton.tsx` is used by `AppNavbar.tsx`. It looks like a nav link (same metrics as the other items, gray, a `bg-border` divider before it, icon only on mobile) but is a `<form method="post">` to `/api/auth/sign-out`. One click signs out, with no confirmation, after `user_signed_out` + `posthog.reset()`. `app/sign-out/page.tsx` still works by URL but nothing links to it.
- Docs updated: progress-tracker (06 ticked, Next = 07, long notes), architecture, library-docs (storage section rewritten), ui-registry, code-standards (`profile_completed` and `user_signed_out` rows), build-plan (`upsert` text corrected).

## Decisions made

- **Resume upload is its own route, fired on file pick**, not part of Save. Feature 07's Extract button needs the file before any save, and Server Actions cap at 1MB against our 5MB limit.
- **Preview is a View link only** (no iframe, no Remove button). `resume_pdf_url` is only a "resume exists" marker. The bucket is private, so files are read through `GET /api/resume/file`, and the key always comes from the session user.
- **Partial saves are allowed.** Empty required fields never block Save; only malformed values do. Required fields: full name, phone, location, work authorization, current title, experience level, years of experience, ≥1 skill, ≥1 work role (company + title), education (degree + institution), ≥1 job title seeking. Slugs in `missing_fields` are lowercase.
- **`profile_completed` is captured client-side.** It fires on each incomplete→complete transition (there is no persisted "first time ever" flag). `lib/posthog-server.ts` stays deferred to feature 10.
- **Sign out is a form POST styled as a link**, because signing out changes state and the route only accepts POST. It is never a GET link.
- **Validation errors show as one list above Save Profile**, not per field (a deviation from the plan). The banner is hidden when the profile is complete (no complete-state design exists).
- Earlier decisions still stand: `SIGNED_IN_HOME` = `/profile` until feature 14; every protected page must `redirect("/login?error=session")` on a null `getUser()`; dark `bg-overlay` primary buttons for homepage/auth, purple `bg-accent` for in-app actions.

## Problems solved

- InsForge `storage.upload()` has no `upsert` option; it PUTs to the object path and replaces an existing file. The docs and build plan said `upsert: true`, and both are corrected.
- InsForge `fetch-docs` doc types are `db-sdk`, `storage-sdk`, etc. (not `db-sdk-typescript`). `run-raw-sql` rejects BEGIN/ROLLBACK, so a `DO $$ ... raise exception ... $$` block is the way to test a write that rolls back.
- With `cacheComponents`, GET route handlers are prerendered. A `connection()` rejection caught by try/catch logs a spurious build error, so call `await connection()` outside the try in new GET handlers.
- Zod 4 skips object-level `superRefine` checks while individual fields are invalid, so the "end date before start date" message only appears once other errors are fixed.
- React 19 resets uncontrolled form fields after a `<form action>` action, which is why the form uses `onSubmit` + `useTransition`.
- `next build` shares `.next` with a running dev server. Running both leaves `* 2.ts` files in `.next/types` (none were found this time). Restart the dev server if it acts strangely.
- Logic scripts can be run by copying `lib/*.ts` into the scratchpad with `@/lib/x` rewritten to `./x.ts`, symlinking `node_modules`, and running `node test.ts` (Node 24 strips types).

## Current state

- **Verified headlessly:** tsc, lint and `next build` pass. A scripted logic test (empty, partial, complete, malformed, >3 roles, garbage jsonb, save→load round trip) passes. The update payload passes the DB check constraints (rolled-back test; no data written). Signed out, both resume routes return 401 and `/profile` redirects to `/login`.
- **Never exercised with a real sign-in:** a signed-in page render, a real save, a PDF upload and a replacing second upload, the View link, the navbar sign-out click, and cross-user RLS isolation with a second session (owed since feature 04). OAuth login landing on `/profile` is also still unconfirmed.
- **Not wired (by design):** Generate Resume from Profile (feature 08) and extraction from the resume (feature 07). Cover Letter Tone is not in the form, and `saveProfile` never writes that column.
- **`/review` of feature 06 found 13 issues; none are fixed yet.**
  - Important:
    - (a) Resume routes sit outside the proxy matcher, so `updateSession` never runs there. After the access-token cookie expires, upload and View return 401 even though the user is signed in. Save is unaffected.
    - (b) `await saveProfile()` in the transition has no try/catch. A network failure reaches the error boundary and replaces the page.
    - (c) A skill or industry typed but not added with Enter/Add is silently dropped on Save (`TagInput` has no named draft field).
    - (d) The upload route buffers the whole body via `req.formData()` before the 5MB check.
    - (e) PDF validation, storage upload and marker update live inside the route handler, against code-standards, and feature 08 will need the same logic.
    - (f) The planned live verification above has not been done.
  - Minor:
    - Errors are not per field.
    - Missing explicit return types.
    - Option lists are duplicated between components and the schema, and `BLANK_ROLE` is duplicated.
    - A nested `font-normal` span inside `font-medium` on the "Resume on file" row.
    - Error list keys use the message, so duplicate keys are possible.
    - The upload spinner stops before `router.refresh()` finishes.
    - `profile_completed` may be unattributed because PostHog `identify` is unconfirmed.
- All feature 06 and sign-out work is **uncommitted** on `development` (modified: `app/(app)/profile/page.tsx`, the three profile components, `AppNavbar.tsx`, `types/index.ts`, `package.json`/lock, six context docs; new: `actions/profile.ts`, `app/api/resume/`, four `lib/` files, `SignOutButton.tsx`; deleted: `mockProfile.ts`).

## Next session starts with

1. Ask the developer which of the open review issues to fix before feature 07. I recommend (a), (b) and (c) first, because feature 07's Extract button will call the resume routes and both (a) and (b) affect it.
2. Do one real browser pass: sign in, confirm landing on `/profile`, save a partial profile and reload, upload and replace a PDF, click View, click Sign out, and, if possible, run the second-user RLS check.
3. Then start **07 AI Profile Extraction from Resume**. Read `context/build-plan.md` first. Install `pdf-parse` (approved), add `app/api/resume/extract/route.ts` and `agent/extractor.ts`, and download the stored PDF through the user's own session.

## Open questions

- Which review issues does the developer consider intentional or acceptable to leave?
- Should Dashboard and Find Jobs links be hidden or disabled until those pages exist (they currently go to the 404 page)?
- Delete `app/sign-out/page.tsx` (and its entry in the proxy's protected list), or keep it?
- Why does PostHog `identify` never fire on the client? Still unresolved.
- A complete-profile design for `CompletionIndicator` still needs doing; the banner is simply hidden for now.
- What is the access-token lifetime? This determines how often review issue (a) will be hit.
