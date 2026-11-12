# Memory — Feature 02 Auth (JobPilot / job-rider)

Last updated: 2026-11-12

## What was built

Feature 02 Auth is code complete. Nothing is committed to git.

- `lib/insforge/server.ts` — `createInsforgeServer()` and `getUser()` (React `cache()`-wrapped, calls `connection()` first, try/catch, logs `[lib/insforge/getUser]`).
- `lib/insforge/client.ts` — browser client via `createBrowserClient()`. Currently unused.
- `actions/auth.ts` — `signInWithGoogle` / `signInWithGitHub` Server Actions. They start OAuth with `skipBrowserRedirect`, store the PKCE verifier in an httpOnly `insforge_code_verifier` cookie, and redirect to the provider URL, or to `/login?error=oauth` on failure.
- `app/api/auth/callback/route.ts` — exchanges `insforge_code` for a session, then redirects to `/dashboard`.
- `app/api/auth/sign-out/route.ts` — POST. Calls `signOut`, always runs `clearAuthCookies`, 303 redirect to `/`.
- `app/api/auth/refresh/route.ts` — `createRefreshAuthRouter()`, needed by the browser client.
- `proxy.ts` — runs `updateSession`. Signed-out users on `/dashboard`, `/profile`, `/find-jobs(/**)` and `/sign-out` are redirected to `/login`. Signed-in users on `/login` are redirected to `/dashboard`. Redirects copy refreshed or cleared session cookies onto the redirect response.
- `app/login/page.tsx` — Google and GitHub buttons, plus a `?error` notice behind `<Suspense>`.
- `app/sign-out/page.tsx` — confirm and cancel card that POSTs to the sign-out route.
- `components/layout/NavbarActions.tsx` and `components/homepage/AuthCtaButtons.tsx` — session-aware pieces behind `<Suspense>`, with signed-out fallbacks.
- Modified: `Navbar.tsx` (now takes an `actions` slot), `CtaButtons.tsx` (takes `isAuthed`), `Hero.tsx`, `BottomCta.tsx`, `app/page.tsx`.
- `.env.local` (gitignored) holds NEXT_PUBLIC_INSFORGE_URL, NEXT_PUBLIC_INSFORGE_ANON_KEY and NEXT_PUBLIC_APP_URL. The anon key came from the InsForge MCP `get-anon-key` tool, and its value is not stored here.
- Context docs updated: `progress-tracker.md` (02 marked done), `ui-registry.md` ("Auth card screens" entry), `library-docs.md`, `architecture.md`, `code-standards.md`.

## Decisions made

- Use `@insforge/sdk/ssr`. `@insforge/ssr` does not exist on npm, and the old docs were wrong about it.
- Next 16 uses `proxy.ts` (exported function `proxy`), not `middleware.ts`.
- OAuth runs fully server-side (Server Action to start it, route handler to finish it). The SDK requires the code exchange on the server so the refresh token lands in an httpOnly cookie.
- Staying on Tailwind v4. The "Tailwind 3.4" line in AGENTS.md is InsForge boilerplate and does not apply.
- Homepage labels follow auth state ("Go to Dashboard" and "Find Your First Match" → `/find-jobs` when signed in). The session read sits behind `<Suspense>` so `/` stays partially prerendered under `cacheComponents`.
- No sign-out button in the navbar (user decision). Sign-out lives on its own protected `/sign-out` page, and nothing links to it yet. Profile (feature 05) or the dashboard (feature 14) should link to it.
- The sign-in Server Actions end in a redirect, so they don't use the standard `{ success, error }` return. This is documented in a code comment.
- PostHog hook points (feature 03): `identify` after the callback lands on `/dashboard`, and `reset` after the sign-out redirect.

## Problems solved

- With `cacheComponents` on, any `cookies()` or `searchParams` read must sit inside `<Suspense>`. Otherwise the build fails with "uncached or runtime data during prerendering".
- The SDK's `getCurrentUser()` uses `Date.now()`, which triggers a "unstable value Date.now()" error during prerender. Fixed by `await connection()` at the top of `getUser()`.
- `PageProps<"/login">` types only exist after `npx next typegen` or a build.
- Redirects built with `NextResponse.redirect` drop cookies set on the `NextResponse.next()` object. The proxy now copies them over.
- Port 3000 was already in use by the user's own dev server, which hot-reloads changes, so curl tests against `localhost:3000` hit it.

## Current state

- Works: `tsc`, `eslint` and `next build` pass. Proxy redirects, callback failure handling and sign-out cookie clearing were verified with curl. The user confirmed a real GitHub sign-in reaches `/dashboard`.
- Google sign-in has not been tried end to end.
- I never saw a real signed-in render of `/`, though the `Date.now()` fix was applied. The user hasn't confirmed it.
- `/dashboard` returns 404 because the page doesn't exist until feature 14. This is expected.
- InsForge backend: Google and GitHub providers are enabled. `allowedRedirectUrls` was empty when last checked; `http://localhost:3000/api/auth/callback` needs adding in the dashboard. The user got through GitHub login, so confirm it is set.
- Known limitation: the proxy only checks for a valid-looking, unexpired token cookie, and a forged cookie passes it. Protected pages must call `getUser()` themselves.
- Minor items left from the review: missing explicit return types, unused `lib/insforge/client.ts`, no `.env.example` (gitignored by `.env*`), brief signed-out flash on the homepage for signed-in users, and the app URL must exactly match the browsing host or the PKCE cookie is lost.

## Next session starts with

1. Confirm Google sign-in works and that the signed-in homepage renders without errors.
2. Start feature 03, PostHog Initialization (see `context/build-plan.md`): `lib/posthog-client.ts`, `lib/posthog-server.ts`, provider in the root layout, `identify` after login, `reset` on logout.
3. Read the context files in the AGENTS.md order first. Run `/architect` for anything complex.

## Open questions

- Where should the `/sign-out` link live? The Profile page or a dashboard user menu are the candidates.
- How to avoid a redirect loop when feature 14 adds page-level `getUser()` guards. An invalid-session redirect to `/login` collides with the proxy's `/login` → `/dashboard` rule. Decide before building the dashboard.
- Whether to add an `error-light` token to `globals.css` so error notices can have a tinted background.
- Whether to commit the auth work. Nothing has been committed. The working tree also contains unrelated skill-folder changes from before this session.
