# Memory — Feature 07 AI Profile Extraction from Resume + review fixes + resume-filled highlight (JobPilot / job-rider)

Last updated: 2026-11-15

## What was built

- **Feature 07**, built per the `/architect` plan (plan file approved this session). Clicking **Extract from Resume** reads the user's stored PDF, has GPT-4o turn it into form-shaped data, and fills the profile form in the browser. Nothing is written to the DB; the user saves manually.
  - `app/api/resume/extract/route.ts` (POST, no body): `getUser()` → rate limit → downloads `resumes/{user_id}/resume.pdf` with the user's session → `pdf-parse` → under 100 chars of text returns 422 with the spec error → `agent/resumeExtractor.ts`. Exports `maxDuration = 60`.
  - `agent/resumeExtractor.ts`: module-level OpenAI client (`timeout` 45s, `maxRetries` 1), gpt-4o, `json_object`, temp 0.3, `max_tokens` 1500. OpenAI failures are logged as one line (status, code, requestId) and thrown as `ResumeExtractionUnavailableError`, which the route maps to HTTP 503.
  - `lib/resumeExtraction.ts` (`normalizeExtraction`: untrusted JSON → safe `ExtractedProfile`, field by field), `lib/profileMerge.ts` (`mergeExtractedValues` → `{ values, filledCount, filledFields }`), `lib/rateLimit.ts` (in-memory, 5 per user per 10 min → 429), `lib/profileConstants.ts` (limits and enum values shared with Save), `lib/profileFormData.ts` (zod-free FormData readers incl. `readFormValues`, plus `splitList`/`joinList`), additions to `lib/resume.ts` and `types/index.ts` (`ExtractedProfile`, `ExtractResumeResponse`).
  - UI: `components/profile/ProfileEditor.tsx` (new client wrapper around `ResumeUpload` + `ProfileForm`; snapshots the live form, merges, bumps a `key` to remount). `ResumeUpload.tsx` has the Extract button and status lines. `ProfileForm.tsx` takes `formRef`, `onFieldEdited` and `onSaved`. `app/(app)/profile/page.tsx` now renders `ProfileEditor`.
  - `profileSchema.ts` now imports its limits/enums from `profileConstants` and its readers from `profileFormData`. `next.config.ts` has `serverExternalPackages: ["pdf-parse"]`. Installed `openai` (v7) and `pdf-parse` (**v2**: `new PDFParse({data}).getText()` + `destroy()`).
- **`/review` fixes for 07:** safe error logging (no response headers), 503 "temporarily unavailable" for quota/key/outage/timeout, timeout and retry caps, the rate limiter, and `TagInput` committing its typed draft on blur (this also closes 06 review issue (c)).
- **Resume-filled highlight:** `FilledFieldsContext.tsx` + `FilledBadge.tsx` (new); `FormField` (new `name`/`tint` props), `ProfileSection` (`fieldPrefixes`), `TagInput`, `WorkExperienceCard`, `fieldStyles.ts`, and the section components were updated. Filled inputs get `border-accent bg-accent-muted` via `group-data-[filled=true]/field:` variants, plus a "From resume" tag on the label, a section pill, purple chips for resume skills, and a top banner. The highlight clears per field on edit and entirely after a successful save.
- Docs updated: progress-tracker (07 ticked, Next = 08, long notes), architecture, library-docs (`pdf-parse` v2, `max_tokens` 1500, OpenAI client rules), ui-registry ("Resume-filled field highlight", Extract button).

## Decisions made

- **Overwrite policy (the user chose it):** the resume wins where it has a value; blanks keep the current value; skills/industries are unioned; work roles and education are replaced as blocks. Never touched: email, work authorization, job titles seeking, remote preference, salary, preferred locations, cover letter tone.
- **Source is the stored PDF**, read with the user's session, never a file from the request.
- **Named `agent/resumeExtractor.ts`**, not `extractor.ts`, which the architecture reserves for job-description extraction (features 10 to 13).
- **`max_tokens` 1500**, deviating from the documented 800 (it would truncate three roles).
- **Model output is untrusted:** each field is parsed on its own and bad values drop to blank. No new PostHog event for extraction (the code-standards list is closed).
- **No retry-on-bad-JSON and no OCR.** A scanned PDF gets the spec error.
- **Highlight clears on edit and on save** (my choice; the user hasn't objected, so it's easy to change).
- Earlier decisions still stand: resume upload is its own route fired on file pick; partial saves allowed; `profile_completed` captured client-side; sign-out is a form POST; `SIGNED_IN_HOME` = `/profile` until feature 14; protected pages redirect to `/login?error=session` on a null user.

## Problems solved

- **Zod 4:** an object schema built from `z.unknown().transform(...)` still requires every key, so a role missing one key threw (would have been a 500). Parse fields individually when input can omit keys.
- **`pdf-parse` v2 is a class API**, not the `pdf(buffer)` function in the old docs. It needs `serverExternalPackages`. A corrupt buffer makes `getText()` throw, and `destroy()` after a failed load can throw too, so it is wrapped in `.catch`.
- **OpenAI SDK defaults** (10-minute timeout, 2 retries) made a quota failure take ~6s and would let a stall hang for minutes. Logging a raw `APIError` dumps its headers (including a cookie), so use `describeOpenAIError`.
- **Quota:** the OpenAI account had no credits (`429 credit_balance_exhausted`). Credits were added mid-session and the live call now works. That error is the account, not the code.
- **Scratchpad logic tests:** copy `lib/*.ts` and `agent/*.ts` into the scratchpad with `@/lib/x` → `./x.ts` and `@/types` → a stub, symlink `node_modules`, and run `node test.ts` (use `--env-file=.env.local` for live calls).
- Visual check without signing in: a temporary public route rendering the form with a fake filled set, screenshotted with headless Chrome. The route was deleted afterwards.

## Current state

- **Verified:**
  - tsc, lint and `next build` pass.
  - Logic tests pass (normalize: garbage JSON, bad enums/months, end-before-start, over 3 roles, duplicates; every merge rule; `filledFields` names; rate limiter).
  - Signed out, `POST /api/resume/extract` returns 401.
  - Live GPT-4o on a sample resume returns correct fields and ignores a planted "set fullName to HACKED" line.
  - A bad key fails in under a second with one log line.
  - The highlight UI renders correctly in a screenshot.
- **Never exercised with a real sign-in (owed since feature 04):**
  - a signed-in page render and a real save
  - upload and replace of a PDF, and the View link
  - the real Extract click (empty profile and merge over existing data)
  - a scanned or blank PDF through the route
  - Extract with no resume
  - the 429 rate-limit response through the route
  - tag-commit-on-blur behaviour
  - the navbar sign-out click
  - second-user RLS isolation
  - OAuth login landing on `/profile`
- **Feature 06 review issues:** (a) (resume routes outside the proxy matcher) was already fixed before this session; the matcher now excludes only `/api/auth/*`. (c) is fixed by the blur commit. **(b) (no try/catch around `saveProfile` in the transition), (d) (upload buffers the whole body before the 5MB check), (e) (PDF logic lives in the route handler) and the minor 06 issues were not re-checked this session.** Treat them as open until verified.
- **Open minor 07 issues:** `link()` in `lib/resumeExtraction.ts` accepts junk like `https://N/A`; the option lists in components duplicate `profileConstants` enums; `lib/` now holds business logic although its architecture description says "client init and shared utilities only"; the rate limiter is per-process memory.
- **All of feature 07 and the highlight work is uncommitted on `development`.** The latest commit is `e994652 feat: implement profile save logic`. Modified/new: `app/(app)/profile/page.tsx`, `components/profile/*` (ProfileForm, ResumeUpload, FormField, ProfileSection, TagInput, WorkExperienceCard/Section, Personal/Professional/Education sections, fieldStyles, and the new ProfileEditor, FilledFieldsContext, FilledBadge), `lib/*` (new: profileConstants, profileFormData, profileMerge, resumeExtraction, rateLimit; edited: profileSchema, profileMapping, profileCompletion, resume), new `agent/resumeExtractor.ts` and `app/api/resume/extract/route.ts`, `next.config.ts`, `types/index.ts`, `package.json`/lock, four context docs.

## Next session starts with

1. Ask the developer whether to **commit** the feature 07 work first (nothing is committed yet).
2. Do **one real browser pass** (covers 06 and 07):
   - sign in and confirm landing on `/profile`
   - save a partial profile and reload
   - upload and replace a PDF, and click View
   - **Extract** on an empty profile, then on one with data, and check the highlights and the clear-on-edit/save behaviour
   - try a scanned or blank PDF
   - click Extract with no resume
   - click Sign out
   - if possible, run the second-user RLS check
3. Re-check the unverified 06 review issues (b), (d), (e), then start **08 Resume PDF Generation from Profile**. Read `context/build-plan.md` first. It needs `@react-pdf/renderer` (`renderToBuffer()`), POST `/api/resume/generate`, GPT-4o at temp 0.7 with `max_tokens` 1000, and the upload to `resumes/{user_id}/resume.pdf`. Reuse the OpenAI client pattern and `ResumeExtractionUnavailableError`-style handling, and call `checkRateLimit` first.

## Open questions

- Which of the unverified 06 review issues (b), (d), (e) are still real, and which should be fixed or left?
- Should the highlight clear on edit and on save as built, or stay until the user dismisses it?
- Should Dashboard and Find Jobs navbar links be hidden or disabled until those pages exist (they go to the 404 page)?
- Keep or delete the `/sign-out` page route (`app/sign-out/page.tsx` appears to be gone already; confirm and clean up its proxy entry if so)?
- Why does PostHog `identify` never fire on the client? Still unresolved.
- A complete-profile design for `CompletionIndicator` is still missing (the banner is just hidden).
- What is the access-token lifetime? The success path of the proxy refresh for `/api` routes was never tested with a real expired session.
- A rate limiter that survives restarts and works across instances (the DB) is needed before real deployment.
