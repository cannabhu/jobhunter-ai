# UI Registry

Living document. Updated after every component is built. Read this before building any new component — match existing patterns exactly before inventing new ones.

---

## How to Use

Before building any component:

1. Check if a similar component already exists here
2. If yes — match its exact classes
3. If no — build it following ui-rules.md and ui-tokens.md, then add it here

After building any component — update this file with the component name, file path, and exact classes used.

---

## Components

### Navbar — `components/layout/Navbar.tsx`
Header `w-full border-b border-border bg-surface`; inner `grid h-16 max-w-[1440px] grid-cols-[1fr_auto_1fr] px-6`. Nav link `text-sm font-medium`, active `text-accent`, inactive `text-text-dark`. CTA `rounded-md bg-overlay px-4 py-2 text-sm font-medium text-accent-foreground`.

### NavbarActions / AuthCtaButtons — `components/layout/NavbarActions.tsx`, `components/homepage/AuthCtaButtons.tsx`
Server components that read the session inside `<Suspense>`; the signed-out version is the fallback. Signed in: single "Go to Dashboard" dark button (same classes as the Navbar CTA). No sign-out control in the navbar. CtaButtons takes `isAuthed` (Get Started → Go to Dashboard).

### Auth card screens — Login, Sign-out & 404

Files: `app/login/page.tsx`, `app/sign-out/page.tsx`, `app/not-found.tsx`
Last updated: 2026-11-15

All three screens (login, sign-out, 404) share one shell: a centred card on the pastel gradient. Any future single-purpose screen (error, confirmation, onboarding step) should reuse it.

| Property | Class |
| --- | --- |
| Page background | `bg-hero-gradient` (on `main`, `flex flex-1 items-center justify-center px-6 py-16`) |
| Card background | `bg-surface` |
| Card border | `border border-border` |
| Card radius | `rounded-xl` |
| Card shadow | `shadow-card` |
| Card spacing | `max-w-sm p-8`; sign-out adds `text-center` |
| Heading | `mt-6 text-2xl font-semibold tracking-tight text-text-slate` |
| Body text | `mt-2 text-sm text-text-secondary` |
| Logo | `h-9 w-auto`, centred, links home |
| Button group | `mt-6 flex flex-col gap-3` |
| Primary button | `w-full rounded-md bg-overlay px-5 py-2.5 text-sm font-medium text-accent-foreground shadow-card hover:bg-overlay-dark` |
| Secondary / provider button | `w-full rounded-md border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text-primary shadow-card hover:bg-surface-secondary` (login adds `flex items-center justify-center gap-3`) |
| Provider icon | `size-4`, `fill="currentColor"` — monochrome, no brand hex |
| Error notice | `mt-6 rounded-md border border-error px-3 py-2 text-xs text-error` |

**Pattern notes:**
- Primary = dark `bg-overlay`; secondary = white with `border-border`. Same two button styles as `CtaButtons`, only `w-full` here.
- Destructive-looking actions (Sign out) still use the dark primary button, not `bg-error`; the Cancel button is the escape hatch.
- Error notice (login) has no tinted background. `error-light` / `error-lightest` tokens now exist in globals.css (added for the profile banner) — use them if the notice ever gets a fill. Login also shows "Your session has expired…" for `?error=session`.
- 404 (`app/not-found.tsx`) adds an eyebrow `mt-6 text-sm font-semibold text-accent` ("404") above the heading, then the same two stacked buttons: dark primary "Back to home", secondary `SIGNED_IN_HOME` link.
- Icons must stay `currentColor` so they never need hardcoded brand colours.

### Footer — `components/layout/Footer.tsx`
`max-w-[1280px] border-x border-t border-border bg-surface`, row `px-6 py-10`, links `text-xs font-medium text-text-dark`.

### CtaButtons — `components/homepage/CtaButtons.tsx`
Dark: `rounded-md bg-overlay px-5 py-2.5 text-sm font-medium text-accent-foreground shadow-card`. Light: `rounded-md border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text-primary shadow-card`.

### Hero / BottomCta — `components/homepage/Hero.tsx`, `BottomCta.tsx`
Section `bg-hero-gradient border-b border-border px-6 py-24 text-center`; h1 `text-5xl md:text-6xl font-semibold tracking-tight text-text-slate`; sub `text-sm text-text-secondary`.

### DashboardPreview — `components/homepage/DashboardPreview.tsx`
`bg-surface-muted` section, image `max-w-[1000px]`, followed by a `h-10` white spacer strip.

### FeatureSplit / Features — `components/homepage/FeatureSplit.tsx`, `Features.tsx`
2-col grid, image side `bg-surface-muted`, text side `bg-surface`; heading `text-3xl font-semibold text-text-slate`; items `border-b border-border px-10 py-6`, active item `border-l-2 border-l-accent`; title `text-sm font-semibold`, body `text-xs text-text-secondary`.

### Testimonial — `components/homepage/Testimonial.tsx`
Eyebrow `text-xs uppercase text-accent`; quote `text-2xl font-medium text-text-dark`; avatar `size-9 rounded-md`.

### AppNavbar

File: `components/layout/AppNavbar.tsx` (rendered by `app/(app)/layout.tsx`)
Last updated: 2026-11-15

| Property | Class |
| --- | --- |
| Background | `bg-surface` |
| Border | `border-b border-border` |
| Border radius | none |
| Text — active | `text-accent` + `border-b-2 border-accent` (underline sits on the bar's bottom edge) |
| Text — inactive | `text-text-secondary` on `border-transparent` |
| Type | `text-sm font-medium` |
| Spacing | bar `h-16 px-4 sm:px-6`, max `max-w-[1440px]`; link `gap-2 px-2 sm:px-4`, links `gap-1 sm:gap-2` |
| Hover state | `hover:text-text-primary` |
| Shadow | none |
| Accent usage | active item only |

**Pattern notes:** Signed-in pages only; the homepage keeps `Navbar.tsx`. Links stretch the full bar height (`items-stretch`) so the active underline touches the border. Icons are 16px lucide (`size-4`, `aria-hidden`); labels collapse to `sr-only` below `sm`. Active state is the underline plus colour, unlike the homepage navbar (colour only).

**Sign out control** (`components/layout/SignOutButton.tsx`): styled as a nav link, not a button — identical metrics to the nav items (`flex h-full items-center gap-2 border-b-2 border-transparent px-2 text-sm font-medium sm:px-4`, `text-text-secondary hover:text-text-primary`, never the accent colour, so it can't read as the active page). A 1px × 20px divider (`h-5 w-px bg-border`) separates it from the page links; group gap `gap-1 sm:gap-2`. `LogOut size-4` icon; label `sr-only` below `sm`; browser default focus outline kept. It is a `<form method="post">` submit under the hood (state change, so never a GET link): one click posts to `/api/auth/sign-out` (redirects home) after `user_signed_out` + `posthog.reset()`. No confirmation step.

### Profile card (shell for every profile section)

Files: `app/(app)/profile/page.tsx`, `components/profile/ResumeUpload.tsx`, `components/profile/ProfileForm.tsx`
Last updated: 2026-11-15

| Property | Class |
| --- | --- |
| Background | `bg-surface` |
| Border | `border border-border` |
| Border radius | `rounded-xl` (16px — `--radius-xl`) |
| Text — primary | `text-xl font-semibold text-text-primary` (card title) |
| Text — secondary | `mt-1 text-sm text-text-secondary` (subtitle) |
| Spacing | card `p-8`; cards stacked `gap-8`; page `mx-auto max-w-[932px] px-4 py-8 sm:px-6` |
| Hover state | none |
| Shadow | `shadow-card` |
| Accent usage | none on the surface |

**Pattern notes:** Profile cards use `p-8` (design) where ui-rules.md says 24px — use `p-8` for any card that sits in this 932px column. Inside a card, sections are separated by `border-t border-border py-12`; section headings are `text-base font-semibold`.

### CompletionIndicator

File: `components/profile/CompletionIndicator.tsx`
Last updated: 2026-11-15

| Property | Class |
| --- | --- |
| Background | `bg-error-lightest` (tinted card — the one exception to ui-rules "white cards", per the design) |
| Border | `border border-error-light` |
| Border radius | `rounded-xl` |
| Text — primary | `text-xl font-semibold text-text-primary`; icon `size-5 text-error` |
| Text — secondary | `text-sm leading-relaxed text-text-dark` |
| Spacing | `p-8`, title→body `mt-3`, body→tags `mt-4`, tags `gap-2` |
| Hover state | none (not interactive) |
| Shadow | `shadow-card` |
| Accent usage | error red only: tag `rounded-md bg-error-light/50 px-2.5 py-1.5 text-xs font-semibold tracking-wide text-error uppercase`; ring track `stroke-error-light`, arc `stroke-error`, centre `text-3xl font-bold` |

**Pattern notes:** The profile page does not render this banner once `is_complete` is true (no complete-state design exists yet). Ring is a 130px SVG (`size-[130px]` wrapper), 14px stroke, round caps, starts at 12 o'clock (`-rotate-90`). Missing-field slugs are lowercase in data and uppercased by CSS. Any future status banner (success, warning) should copy this shape with the matching token family; `error-light` / `error-lightest` are the only tint tokens that exist so far.

### ResumeUpload

File: `components/profile/ResumeUpload.tsx`
Last updated: 2026-11-15

| Property | Class |
| --- | --- |
| Background | zone idle `bg-surface-secondary`, dragging `bg-accent-muted` |
| Border | zone `border border-dashed border-border-muted`, dragging `border-accent` |
| Border radius | zone `rounded-xl`; buttons/file chip `rounded-md`; icon badge `rounded-full` |
| Text — primary | `text-sm font-semibold text-text-primary` |
| Text — secondary | `text-xs text-text-secondary` (hint), `text-sm text-text-secondary` (footer line) |
| Spacing | zone `px-6 py-12`; hint `mt-1`, button `mt-4`; footer `mt-6 border-t border-border pt-4` |
| Hover state | secondary button `hover:bg-surface-secondary`; primary `hover:bg-accent-dark` |
| Shadow | `shadow-card` on badge and buttons |
| Accent usage | icon `text-accent`; primary button `bg-accent text-accent-foreground` |

**Pattern notes:** Errors use `text-sm text-error` with `role="alert"`; "Resume on file" row is `rounded-md border border-border bg-surface-secondary px-3.5 py-2.5` with a `text-sm font-medium text-accent hover:text-accent-dark` View link (`ExternalLink size-3.5`, opens in a new tab) and a `text-xs text-text-secondary` replace hint. Icon badge: `size-11 border border-border bg-surface`.

**States (feature 06):** the PDF uploads the moment it is picked or dropped. While uploading, the zone is `cursor-progress`, the badge icon swaps to `LoaderCircle animate-spin text-accent`, the title reads "Uploading {name}…" and "Select Resume" is `disabled:opacity-60`. Server rejections (wrong type, over 5MB, not a real PDF) show in the same `text-error` line.

### Buttons on app pages (profile)

Files: `components/profile/ResumeUpload.tsx`, `ProfileForm.tsx`, `WorkExperienceSection.tsx`
Last updated: 2026-11-15

| Property | Primary (accent) | Secondary |
| --- | --- | --- |
| Background | `bg-accent` | `bg-surface` |
| Border | none | `border border-border` |
| Border radius | `rounded-md` | `rounded-md` |
| Text | `text-accent-foreground text-sm font-medium` (Save Profile `font-semibold`) | `text-text-primary text-sm font-medium` |
| Spacing | `px-4 py-2.5` (Save Profile `w-full py-3`) | `px-4 py-2` |
| Hover state | `hover:bg-accent-dark` | `hover:bg-surface-secondary` |
| Shadow | `shadow-card` (not on Save Profile) | `shadow-card` |

**Pattern notes:** Two primary-button styles now exist on purpose: **dark `bg-overlay`** for homepage and auth screens, **purple `bg-accent`** for in-app actions (design for the profile page). Do not mix them within one screen. Text-link action: `text-sm font-medium text-accent hover:text-accent-dark disabled:text-text-muted` ("Add role"). Pending: `disabled:opacity-60`, label "Saving…", `aria-busy`.

**Save feedback (feature 06, above the Save Profile button, `mb-4`):** success is `role="status" rounded-md border border-success-light bg-success-lightest px-4 py-3 text-sm font-medium text-success-foreground` ("Profile saved."); failure is `role="alert" rounded-md border border-error-light bg-error-lightest px-4 py-3 text-sm text-text-dark` with a `font-semibold text-error` headline and a `list-disc pl-5` list of the field messages. The success message clears as soon as the user edits the form.

### Profile form controls

Files: `components/profile/fieldStyles.ts`, `FormField.tsx`, `SelectInput.tsx`, `TagInput.tsx`, `WorkExperienceCard.tsx`
Last updated: 2026-11-15

| Property | Class |
| --- | --- |
| Background | `inputClass`: `bg-surface-secondary`, `placeholder-shown:bg-surface` (white when empty); `raisedInputClass`: always `bg-surface` |
| Border | `border border-border`; focus `border-accent` |
| Border radius | `rounded-md` |
| Text — primary | `text-sm text-text-primary`; placeholder `text-text-muted`; read-only `text-text-secondary`; disabled `bg-surface-tertiary text-text-muted` |
| Label | `text-xs font-semibold uppercase tracking-wide text-text-dark` + `mb-2` |
| Spacing | input `px-3.5 py-2.5`; field grid `gap-x-5 gap-y-6`, 2 columns from `sm` |
| Hover / focus | `focus:bg-surface focus:ring-1 focus:ring-accent focus:outline-none` |
| Shadow | `shadow-card` only on white (empty / raised) inputs, removed when disabled |
| Accent usage | focus ring; checkbox `size-4 accent-accent`; tag Add / "Add role" see below |

**Pattern notes:**
- **Filled = gray, empty = white with soft shadow**, so gaps in the profile are visible. Fields named in `missing_fields` (the education block) and anything sitting on a gray card use `raisedInputClass` (always white).
- **Select** is a native `<select>` styled with `raisedInputClass appearance-none pr-10` plus a `size-4 text-text-secondary` ChevronDown at `right-3.5`.
- **Tag chip** `rounded-md bg-surface-tertiary px-3 py-1.5 text-sm text-text-dark` with a `size-3` remove icon; chips `gap-3`, `mt-3` under the input. **Tag Add button** `rounded-md bg-surface-tertiary px-4 text-sm font-medium text-text-dark hover:bg-border`.
- **Nested role card** `rounded-xl border border-border bg-surface-secondary p-5`, inner grid `gap-x-4 gap-y-5`; remove button `rounded-md p-1.5 text-text-muted hover:bg-surface-tertiary hover:text-text-primary`.

