# Memory — Features 18 and 19: Cover Letters (JobPilot / job-rider)

Last updated: 2026-11-17

## What was built

- **Feature 18 (Cover Letter card UI) is committed** (`6e3283f`, `aee0cd1`). Branch `development`.
- **Feature 19 (AI Cover Letter Generation) is built and ticked in `context/progress-tracker.md`, but nothing for it is committed.** Uncommitted: the new files `actions/coverLetter.ts`, `agent/coverLetter.ts`, `app/api/agent/cover-letter/route.ts`, `db/migrations/003_cover_letters.sql`, `lib/coverLetter.ts`, `lib/coverLetterContent.ts`, `lib/coverLetterSchema.ts`, plus edits to `CoverLetter.tsx`, the job page, `lib/insforge/jobs.ts`, `lib/rateLimit.ts`, the profile tone files (`profileSchema`, `profileFormData`, `profileMapping`, `profileConstants`), `types/index.ts`, the `context/*.md` docs, and `FilterSelect` moved to `components/shared/`.
- **Route flow** (`POST /api/agent/cover-letter`): 401 signed out, 400 bad body, 404 job not the user's, 422 profile not ready, 429 rate limit, 503 OpenAI outage or quota, 500 other; on success it saves the letter and sends the `cover_letter_generated` PostHog event.
- **This session: the per-letter tone now actually works.** `/review` found the card sent `tone` but the zod schema stripped it, so every letter used the profile tone. Fixed in three files: `lib/coverLetterSchema.ts` (optional `tone`, enum of the three tones), `app/api/agent/cover-letter/route.ts` (reads `tone`, passes it on), `agent/coverLetter.ts` (`writeCoverLetter(job, profile, requestedTone?)`: request tone, then profile tone, then formal). The saved `cover_letter_tone` is the tone used.
- **This session: word target lowered to 150 to 200** in `context/build-plan.md` and `context/progress-tracker.md`. The prompt already said this, so no code changed.
- Full detail of earlier work is in `context/progress-tracker.md` (entries for 18, 19, the follow-ups and the review fixes).

## Decisions made

- **One letter per job, stored on `jobs`;** a fourth column `cover_letter_tone` records the tone the letter was written in. No version history, no PDF.
- **Tone is no longer profile-only.** Precedence: the card dropdown (this letter only), then the profile tone, then formal. The card does not change the profile. This reverses the architect decision.
- **Edits are saved** via the Server Action `saveCoverLetterEdits`; generation goes through the API route. Regenerate replaces the letter and confirms first only when there are edits.
- **Rate limit** is 5 per 10 minutes (`cover-letter:{userId}`). Letters and edits are capped at 5,000 characters. Output under 400 characters is rejected, as are template placeholders such as `[Your Name]` and `{{..}}`.
- **Word target is 150 to 200** (never fewer than 150), three short paragraphs. GPT-4o already writes about 190 to 215.
- **Readiness check** (422) needs a full name plus skills or at least one work role. It runs before the rate limit, so a refused request costs no turn.
- **No automatic retry** when GPT-4o's answer fails the checks. An unusable answer keeps its rate-limit turn; an OpenAI outage (503) gives it back with `releaseRateLimit()`.
- **The company dossier is used when it exists.** Generating a letter never triggers research.

## Problems solved

- **The tracker described the tone feature as done while the code did not have it.** The code edits for the per-letter tone were missing from disk even though the docs claimed them. Lesson: before committing, check what is really on disk with `git diff --stat` and `grep`, not the tracker.
- **Next 16.4.6 passes `retry`, not `reset`, to `error.tsx`.** Docs: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md`.
- **Doc edits vanished twice** in an earlier session after the tool reported success. Cause unknown; the iCloud-synced Desktop is a suspect. After any doc edit, check from disk (checked again this session; the edits held).
- **`tsc --noEmit` shows errors only from stale `.next/types/* 2.ts` copies** (`routes.d 2.ts` and others, likely iCloud duplicates). Filter them out with `| grep -v "^\.next/"`; source files are clean.
- **GPT-4o said "over a year" for a four-year role.** Fixed by adding `TODAY` to the prompt.
- **Visual check without signing in:** add a temporary public route outside `/dashboard`, `/profile`, `/find-jobs` and `/sign-out`, render the component with mock props, screenshot with headless Chrome (`--headless=new --window-size=1440,2600 --screenshot=...`) against the dev server on port 3000, then delete the route.
- **A running dev server must be restarted** to pick up the new functions in `lib/insforge/jobs.ts`.
- **zsh:** quote `--include='*.md'` in grep, or the glob fails.

## Current state

- **Works:** source-file `tsc` and eslint are clean on the files changed this session. Earlier: scripted helper checks passed, and two live GPT-4o runs gave grounded letters that did not claim the missing skill. The route returns 401 signed out.
- **Not verified (needs a signed-in browser):** the tone fix end to end (profile formal, card casual, letter and saved label both casual), Generate, Regenerate and its confirm, Save changes and the "Saved" label, the 404, 422, 429 and 503 paths, the PostHog event arriving, the tone dropdown in the profile (saving and pre-fill), the card at 1440px and 500px with a real letter, and the dashboard error card.
- **Not checked:** the migration is recorded as applied through InsForge, but the InsForge MCP server failed to connect on 2026-11-17, so it was not re-checked.
- **Minor, left as is:** a `tone` that is not one of the three returns the generic 400 "That job could not be found." The card only sends valid tones.
- **Still owed from before:** feature 06 review issues (b), (d), (e); helper tests are not in the repo (no test runner); full job description fetch is not built; the dashboard checks from feature 17 (charts with data, empty state, error state, 60s cache, 429 on a fourth research run, another user's job id giving 404).

## Next session starts with

1. Run `git diff --stat` and confirm the feature 19 files and the tone fix are on disk.
2. Restart the dev server, sign in, and run through the "Not verified" list above. Fix anything that breaks.
3. Commit feature 19 and the doc updates, then run `/review` before any demo.

## Open questions

- Why did the doc and code edits go missing? Consider moving the project out of the iCloud-synced Desktop.
- Should the charts move to the InsForge `jobs` table so they match the stat cards?
- Why does PostHog `identify` never fire on the client?
- A long research or cover letter request could outlive the access token or the host's time limit once deployed; the in-memory rate limiter and chart cache need a shared version for serverless.
- Repeat jobs are skipped, not re-scored, so old match scores go stale when the profile changes.
