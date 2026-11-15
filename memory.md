# Memory — Feature 05 Profile Page UI + post-login routing fix (JobPilot / job-rider)

Last updated: 2026-11-15

## What was built

- **Feature 05 Profile Page — Full UI**, built to `context/designs/profile.png` with mock data and no save logic.
  - Page: `app/(app)/profile/page.tsx` (checks `getUser()` behind `<Suspense>`, then renders mock data from `app/(app)/profile/mockProfile.ts`).
  - Shared signed-in shell: `app/(app)/layout.tsx` + `components/layout/AppNavbar.tsx`. `(app)` is a route group, so URLs are unchanged.
  - `components/profile/`: `CompletionIndicator`, `ResumeUpload`, `ProfileForm`, `ProfileSection`, `PersonalInfoSection`, `ProfessionalInfoSection`, `WorkExperienceSection`, `WorkExperienceCard`, `EducationSection`, `JobPreferencesSection`, `FormField`, `SelectInput`, `TagInput`, `fieldStyles.ts`.
  - `types/index.ts`: added `ProfileFormValues`, `WorkExperienceEntry`, `EducationEntry`.
  - `globals.css`: added `--color-error-light` and `--color-error-lightest`.
  - Installed `lucide-react`.
- **Post-login routing fix** (from `/review` of the auth implementation): new `lib/routes.ts` exports `SIGNED_IN_HOME` (`/profile`, "Go to Profile"). Used by the OAuth callback, `proxy.ts`, `CtaButtons`, `NavbarActions` and the sign-out page's Cancel link.
- **Redirect-loop guard:** a page that fails `getUser()` redirects to `/login?error=session`. The proxy skips its signed-in `/login` bounce when `?error` is present. The login page shows "Your session has expired…".
- `app/not-found.tsx`: 404 page on the auth-card shell (Back to home + `SIGNED_IN_HOME` button).
- Fixed a feature 03 bug in `components/analytics/SignInFailedTracker.tsx`: `URLSearchParams.delete()` returns void, so `?error` was never stripped. It blocked `next build`.
- Docs updated: `progress-tracker.md` (05 ticked, Next = 06), `architecture.md`, `ui-registry.md` (re-imprinted in table format).

## Decisions made

- **Post-login destination is `/profile`, not `/dashboard`**, until feature 14 exists. When the dashboard ships, change `SIGNED_IN_HOME` in `lib/routes.ts` back to `/dashboard`; nothing else needs to change.
- **Every protected page must `redirect("/login?error=session")`** when `getUser()` returns null. The proxy only checks for a valid-looking cookie, so any other target risks a redirect loop.
- **Feature 05 uses mock data on purpose.** It does not call `getProfile()` yet. Feature 06 must swap the mock for `getProfile()`, map `ProfileRow` to `ProfileFormValues`, and delete `mockProfile.ts`.
- **Form inputs are uncontrolled** with `name` attributes (`workExperience.{i}.company`, `education.degree`, repeated hidden `skills` / `industries` inputs), ready for a Server Action in feature 06.
- **Field state rule:** filled inputs are gray, empty inputs are white with a soft shadow, and fields named in `missing_fields` stay white. `missing_fields` slugs are lowercase (`phone`, `location`, `education`).
- **Two primary-button styles exist on purpose.** Dark `bg-overlay` is for the homepage and auth screens; purple `bg-accent` is for in-app actions.
- **Left out of the profile page:** the "Cover Letter Tone" dropdown (not in the design, and cover letters are out of scope), and any sign-out link (not in the design).

## Problems solved

- A freshly logged-in user landed on `/dashboard`, a 404 with no navbar. The homepage buttons led there too. Fixed by `SIGNED_IN_HOME` and the 404 page.
- Pointing the proxy at `/profile` would have looped when the session cookie is accepted but `getUser()` rejects it. Fixed with the `?error=session` guard. Verified with a forged unexpired token cookie.
- Checked and ruled out: the proxy does forward refreshed cookies to Server Components. `response.cookies.set` re-snapshots the request headers after `updateSession` mutates them.
- `npx tsc` showed errors from duplicate `* 2.ts` files in `.next/types`, left by running `next build` alongside the dev server. They are gitignored artifacts; delete them. Also filter out the old `TS2688` noise.
- Headless Chrome (`--headless=new --screenshot`) against a temporary public route is a workable way to compare pages with the designs, since OAuth can't be driven from the CLI. Delete the temporary route afterwards.

## Current state

- `/profile` renders matching the design. Type-check, lint and `next build` pass. Signed out, it redirects to `/login`.
- **Works in the UI:** tag add/remove (skills, industries), add/remove work roles (max 3), "Currently working here" disables the end date, and the resume drop zone validates PDF type and 5MB and shows the chosen file.
- **Not wired (by design):** Save Profile (submit is `preventDefault`ed), Generate Resume from Profile, and uploading the chosen resume.
- **Not confirmed in a real browser:** a full OAuth sign-in, landing on `/profile`, and the homepage buttons reading "Go to Profile". Please try once.
- **Dead links, now caught by the 404 page:** Dashboard and Find Jobs in both navbars and the footer, plus the hero's "Find Your First Match" when signed in.
- PostHog `identify` and `user_signed_in` never appeared in the dev log even while signed in, so browser-side `getCurrentUser()` probably returns no user. Cause not found.
- Nothing from features 03, 04 or 05 is committed (branch `development`).

## Next session starts with

1. Do a real sign-in and confirm: login lands on `/profile`, the homepage button reads "Go to Profile", and the profile page loads.
2. Start **06 Profile Save Logic**: `actions/profile.ts` Server Action; load via `getProfile()`; compute `completion_percentage`, `missing_fields` and `is_complete` on save; upload the resume to the private `resumes` bucket at `{user_id}/resume.pdf` with `upsert: true`; add the authenticated route handler that streams the PDF for the preview. Delete `mockProfile.ts`. Confirm cross-user RLS isolation with a real second session the first time data is written.

## Open questions

- Hide or disable the Dashboard / Find Jobs links until those pages exist, or leave them going to the 404 page?
- Where should a sign-out entry point live, given the profile design has none (`/sign-out` is reachable only by URL)?
- Why does PostHog `identify` never fire on the client?
- `CompletionIndicator` only has the "needs attention" state. A complete-profile state still needs designing.
- Minor: `CompletionIndicator` uses an inline `style` for the ring size, which `code-standards.md` discourages. `size-[130px]` would replace it.
