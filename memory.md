# Memory — Features 18 and 19: Cover Letters (JobPilot / job-rider)

Last updated: 2026-11-17

## What was built

- **Feature 18 (Cover Letter card UI) is committed** (`6e3283f`, `aee0cd1`). Branch `development`.
- **Feature 19 (AI Cover Letter Generation) is built and ticked in `context/progress-tracker.md`, but nothing for it is committed.** Uncommitted: the new files `actions/coverLetter.ts`, `agent/coverLetter.ts`, `app/api/agent/cover-letter/route.ts`, `db/migrations/003_cover_letters.sql`, `lib/coverLetter.ts`, `lib/coverLetterContent.ts`, `lib/coverLetterSchema.ts`, plus edits to `CoverLetter.tsx`, the job page, `lib/insforge/jobs.ts`, `lib/rateLimit.ts`, the profile tone files (`profileSchema`, `profileFormData`, `profileMapping`, `profileConstants`), `types/index.ts`, the `context/*.md` docs, and `FilterSelect` moved to `components/shared/`.
- **Route flow** (`POST /api/agent/cover-letter`): 401 signed out, 400 bad body, 404 job not the user's, 422 profile not ready, 429 rate limit, 503 OpenAI outage or quota, 500 other; on success it saves the letter and sends the `cover_letter_generated` PostHog event.
- **Per-letter tone dropdown on the card** was added after the first build. The route takes an optional `tone`.
- Full detail of what was built is in `context/progress-tracker.md` (entries for 18, 19, the follow-ups and the review fixes).

## Decisions made

- **One letter per job, stored on `jobs`;** a fourth column `cover_letter_tone` records the tone the letter was written in. No version history, no PDF.
- **Tone is no longer profile-only.** The profile tone is the default; the card dropdown overrides it for one letter and does not change the profile. This reverses the architect decision.
- **Edits are saved** via the Server Action `saveCoverLetterEdits`; generation goes through the API route. Regenerate replaces the letter and confirms first only when there are edits.
- **Rate limit** is 5 per 10 minutes (`cover-letter:{userId}`). Letters and edits are capped at 5,000 characters. Output under 400 characters is rejected, as are template placeholders such as `[Your Name]` and `{{..}}`.
- **Readiness check** (422) needs a full name plus skills or at least one work role. It runs before the rate limit, so a refused request costs no turn.
- **No automatic retry** when GPT-4o's answer fails the checks. An unusable answer keeps its rate-limit turn; an OpenAI outage (503) gives it back with `releaseRateLimit()`.
- **The company dossier is used when it exists.** Generating a letter never triggers research.

## Problems solved

- **Next 16.4.6 passes `retry`, not `reset`, to `error.tsx`.** Docs: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md`.
- **Doc edits vanished twice** in an earlier session after the tool reported success. Cause unknown; the iCloud-synced Desktop is a suspect. After any doc edit, check from disk with `git diff --stat` or `grep`.
- **GPT-4o said "over a year" for a four-year role.** Fixed by adding `TODAY` to the prompt.
- **Visual check without signing in:** add a temporary public route outside `/dashboard`, `/profile`, `/find-jobs` and `/sign-out`, render the component with mock props, screenshot with headless Chrome (`--headless=new --window-size=1440,2600 --screenshot=...`) against the dev server on port 3000, then delete the route.
- **A running dev server must be restarted** to pick up the new functions in `lib/insforge/jobs.ts`.
- **zsh:** quote `--include='*.md'` in grep, or the glob fails.

## Current state

- **Works:** `tsc --noEmit` and eslint are clean on all feature 19 files (re-checked 2026-11-17). Scripted checks of the helpers passed. Two live GPT-4o runs, with and without a dossier, gave grounded letters that did not claim the missing skill. The route returns 401 signed out.
- **Not verified (needs a signed-in browser):** Generate, Regenerate and its confirm, Save changes and the "Saved" label, the 404, 422, 429 and 503 paths, the PostHog event arriving, the tone dropdown on the card and in the profile (saving and pre-fill), the card at 1440px and 500px with a real letter, and the dashboard error card.
- **Not checked:** the migration is recorded as applied through InsForge, but the InsForge MCP server failed to connect on 2026-11-17, so it was not re-checked.
- **Known issue:** GPT-4o's letters come out around 190 to 215 words, under the prompt's 250 to 350.
- **Still owed from before:** feature 06 review issues (b), (d), (e); helper tests are not in the repo (no test runner); full job description fetch is not built; the dashboard checks from feature 17 (charts with data, empty state, error state, 60s cache, 429 on a fourth research run, another user's job id giving 404).

## Next session starts with

1. Restart the dev server, sign in, and run through the "Not verified" list above. Fix anything that breaks.
2. Decide on the short letters: tighten the prompt or lower the 250 to 350 target.
3. Commit feature 19 and the doc updates, then run `/review` before any demo.

## Open questions

- Why did the doc edits revert twice? Consider moving the project out of the iCloud-synced Desktop.
- Should the charts move to the InsForge `jobs` table so they match the stat cards?
- Why does PostHog `identify` never fire on the client?
- A long research or cover letter request could outlive the access token or the host's time limit once deployed; the in-memory rate limiter and chart cache need a shared version for serverless.
- Repeat jobs are skipped, not re-scored, so old match scores go stale when the profile changes.
