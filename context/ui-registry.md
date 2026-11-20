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
Header `relative w-full border-b border-border bg-surface`; inner `mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 md:grid md:grid-cols-[1fr_auto_1fr]`. Nav link `text-sm font-medium`, active `text-accent`, inactive `text-text-dark`. CTA `whitespace-nowrap rounded-md bg-overlay px-3 py-2 text-sm font-medium text-accent-foreground sm:px-4`.

**Mobile (below `md`):** the inline links are `hidden md:flex`; a hamburger button (`size-11`, `md:hidden`, lucide `Menu`/`X` at `size-5`, `aria-expanded`, `aria-controls`; accent colour while open) sits next to the CTA. It opens a floating panel: `absolute inset-x-0 top-full z-50 mx-3 mt-2 rounded-xl border border-border bg-linear-to-br from-accent-muted via-surface to-info-lightest p-2 shadow-card motion-safe:animate-menu-in` (`menu-in` is a 160ms fade and 8px slide, defined in the `@theme` block of `globals.css`). Behind it a backdrop `absolute inset-x-0 top-full z-40 h-dvh bg-overlay/30` closes the menu on tap. Each row: `h-14 gap-3 rounded-lg px-3 text-sm font-medium`, a `size-9 rounded-md border border-border bg-surface` icon tile (lucide `LayoutDashboard`, `Search`, `User` at `size-4`, the same icons as `AppNavbarBar`), the label, and a `ChevronRight` (`text-text-muted`). Active row: `bg-surface/70 text-accent` plus `aria-current="page"`; pressed: `active:bg-surface/80`. Closes on row tap, backdrop tap and Escape.

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
`max-w-[1280px] border-x border-t border-border bg-surface`, row `flex flex-col items-center gap-6 px-6 py-10 sm:flex-row sm:justify-between` (stacked, centred below `sm`), links nav `flex flex-wrap items-center justify-center gap-x-6 gap-y-2`, links `text-xs font-medium text-text-dark`.

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

**Extract from Resume (feature 07):** shown only when a resume is on file, below the "Resume on file" row (`mt-3`, `flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`). A `text-sm text-text-secondary` line explains that covered fields are replaced and nothing saves until Save Profile. The button is the secondary style (`rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary shadow-card hover:bg-surface-secondary disabled:opacity-60`) with a `Sparkles size-4 text-accent` icon. While extracting the icon becomes `LoaderCircle animate-spin text-accent`, the label reads "Reading your resume…", and the drop zone and Select Resume are disabled. Errors use `text-sm text-error` with `role="alert"`. Success is the same banner as Save Profile (`border-success-light bg-success-lightest text-sm font-medium text-success-foreground`, `role="status"`): "Filled N fields from your resume. Review them, then click Save Profile."

**Generate Resume from Profile (feature 08):** the primary button in the card footer (`mt-6 border-t border-border pt-4`, row on `sm`). While generating, the icon becomes `LoaderCircle animate-spin`, the label reads "Generating…", and every other action in the card is disabled (`busy`). **Replace confirm:** when a resume is already on file the click opens an inline panel under the row (`role="alertdialog"`, `rounded-md border border-border bg-surface-secondary px-4 py-3`, bold "This replaces your current resume." lead-in) with a secondary "Cancel" and a primary "Replace and generate" button; with no resume on file it generates straight away. **Unsaved-edits note:** `role="note"`, `rounded-md border border-border bg-surface-secondary px-4 py-3 text-sm text-text-secondary`, shown while the form differs from its last saved state ("…click Save Profile first to include them."); it is warn-only. Errors reuse `text-sm text-error` with `role="alert"`; success reuses the green status banner ("Your new resume is ready. View it.", link to `RESUME_FILE_PATH`). No warning tint tokens exist, so the note uses neutral surface tokens.

### Resume-filled field highlight (feature 07)

Files: `components/profile/FilledFieldsContext.tsx`, `FilledBadge.tsx`, `FormField.tsx`, `ProfileSection.tsx`, `TagInput.tsx`, `fieldStyles.ts`, `ProfileForm.tsx`
Last updated: 2026-11-15

After Extract from Resume, every value the resume supplied is marked so the user can review it. `ProfileEditor` holds a set of form input names and shares it through `FilledFieldsProvider`.

| Part | Class / behaviour |
| --- | --- |
| Filled input / select / textarea | `border-accent bg-accent-muted` (accent border, faint purple fill), applied by `group-data-[filled=true]/field:` variants in `fieldStyles.ts`. `FormField` is the `group/field` and sets `data-filled="true"`, so inputs need no props |
| Label tag (`FilledBadge`) | `Sparkles size-3` + "From resume", `text-xs font-medium text-accent`, `normal-case tracking-normal`, sits right of the label (`flex items-center gap-2`) |
| Section header pill | same `FilledBadge` reading "Filled from resume", before the section action (`ProfileSection` `fieldPrefixes`) |
| Skill / industry chip from the resume | `bg-accent-light text-accent` with a `Sparkles size-3` (`aria-label="From resume"`); other chips stay `bg-surface-tertiary text-text-dark`. Tag inputs pass `tint={false}` so the draft box is not tinted |
| Banner (top of the form, `role="note"`) | `rounded-md border border-accent-light bg-accent-muted px-4 py-3 text-sm text-text-dark`, `Sparkles size-4 text-accent`, bold `text-accent` lead-in |

**Behaviour:** a field's highlight clears when the user edits it (form `onChange` → `onFieldEdited(name)`); everything clears after a successful save. Name keys: scalar field names, `skills`/`industries` + `skills:{lowercase tag}`, `education.{field}`, `workExperience.{index}.{field}`. Fields the resume left blank are never marked. Color is never the only cue: the tag text carries the meaning.

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


### Job Details page (feature 12)

Files: `app/(app)/find-jobs/[id]/page.tsx`, `components/job-details/*`
Last updated: 2026-11-15

Built from `context/designs/job-details.png` (1418px frame, sizes measured from the PNG). Column `mx-auto max-w-[844px] px-4 pt-8 pb-12 sm:px-6` (796px of content), sections stacked `gap-6`. Every section is the card `rounded-xl border border-border bg-surface shadow-card`.

| Part | Class |
| --- | --- |
| Back to Jobs | `mb-1 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-text-dark hover:text-text-primary`, `ChevronLeft size-4` |
| Header card | `p-6`, `flex-col gap-4 sm:flex-row sm:items-start sm:justify-between`; logo tile `size-14 rounded-xl border border-border bg-surface-tertiary` + `Building2 size-6 text-text-secondary`, `gap-4` to the text; title `text-2xl font-semibold text-text-primary`; company line `mt-1 text-sm text-text-secondary`, `gap-x-2.5`, a `size-1 rounded-full bg-text-muted` dot |
| Match badge | `rounded-full px-2.5 py-0.5 text-xs font-medium`; at or above `MATCH_THRESHOLD` `bg-success-lightest text-success-foreground`, below it `bg-surface-secondary text-text-secondary` |
| View Job Post | secondary button `rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary shadow-card hover:bg-surface-secondary` + `ExternalLink size-4`, `gap-2`; top-aligned with the tile |
| Info cards | `grid gap-3 sm:grid-cols-2 lg:grid-cols-4`; card `flex items-center gap-3 p-4`; icon tile `size-10 rounded-lg` + `size-5` icon, tinted per card: salary `bg-success-lightest text-success-alt`, location `bg-info-lightest text-info-medium`, job type `bg-accent-muted text-accent`, date `bg-surface-tertiary text-text-secondary`; value `truncate text-sm font-semibold text-text-primary`; label `mt-0.5 text-xs font-medium tracking-wide text-text-muted uppercase` |
| Section icon (`SectionIcon`) | `size-7 rounded-full`, 16px icon; tones `success` (`bg-success-lightest text-success-alt`), `neutral` (`bg-surface-tertiary text-text-secondary`), `accent` (`bg-accent-muted text-accent`); `gap-2.5` to the heading |
| AI Match Reasoning | `p-6`; heading `text-xs font-semibold tracking-wide text-text-secondary uppercase`; body `mt-3 text-sm leading-relaxed text-text-primary` |
| Skills card | `p-6`; heading as above (no icon); group labels `text-xs text-text-muted` (`mt-4` first, `mt-3` second), chips `mt-2 flex flex-wrap gap-2`; chip `inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium` + `size-3` icon: matched `bg-success-lightest text-success-foreground` + `Check`, gap `bg-accent-muted text-accent` + `X` |
| Job Description | `p-6`; heading `text-base font-semibold text-text-primary`; body `mt-5 text-sm leading-relaxed text-text-primary`; when the text ends in an ellipsis (Adzuna's 500 character preview) a note `mt-3 text-xs text-text-muted` follows: "Preview only." + link `font-medium text-accent hover:text-accent-dark` to `source_url` (new tab), or plain text when there is no link |
| Company Research | `overflow-hidden` card; header `flex items-center justify-between gap-4 border-b border-border px-6 py-4`; **primary accent button** `rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-card hover:bg-accent-dark` + `Search size-4`; empty state `flex-col items-center px-6 py-12 text-center`, tile `size-12 rounded-xl bg-surface-tertiary` + `Building2 size-6 text-text-muted`, title `mt-3 text-sm font-medium text-text-primary`, text `mt-1 max-w-xs text-sm text-text-muted` |
| Apply Now | full-width accent link `rounded-lg bg-accent px-5 py-3 text-sm font-medium text-accent-foreground shadow-card hover:bg-accent-dark`, "Apply Now at {company}" |

**Pattern notes:** this page's buttons use `rounded-lg` and `px-4 py-2`, as in the design, while the profile and Find Jobs buttons are `rounded-md`; the two sets are not mixed on one screen. Section headings come in two forms: an uppercase `text-xs` label for the AI and skills cards, and `text-base font-semibold` for Job Description and Company Research. Empty states are `text-sm text-text-muted`. The Research Company button has no handler until feature 13.

**Feature 13 additions (Company Research card, client component):** files `components/job-details/CompanyResearch.tsx`, `DossierView.tsx`. No design exists for the filled card, so it reuses the page's existing tokens. Last updated: 2026-11-15

| Part | Class / behaviour |
| --- | --- |
| Button | Same size and position as before (`rounded-lg px-4 py-2 text-sm font-medium shadow-card`). No dossier yet: primary (`bg-accent text-accent-foreground hover:bg-accent-dark`), "Research Company", `Search` icon. Dossier exists: secondary (`border border-border bg-surface text-text-primary hover:bg-surface-secondary`), "Refresh research", `RefreshCw` icon. Busy: `LoaderCircle animate-spin`, "Researching...", `disabled:cursor-not-allowed disabled:opacity-70` |
| Status line | `role="status" border-b border-border px-6 py-3 text-sm text-text-secondary`, directly under the header while the run (and the page refresh after it) is pending |
| Error line | `role="alert"`, same box, `text-error` |
| Dossier body | `flex flex-col gap-6 px-6 py-6`; each block is a label `text-xs font-semibold tracking-wide text-text-secondary uppercase` plus content |
| Paragraph (Company Overview, Why This Role) | `mt-2 text-sm leading-6 text-text-primary` |
| Tech stack chips | `flex flex-wrap gap-2`; chip `rounded-full bg-info-lightest px-3 py-1 text-xs font-medium text-info-foreground` |
| Bullet lists (Culture, Gaps to Address, Smart Questions to Ask, Interview Prep) | `mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-text-primary marker:text-text-muted`; a block with no items is left out |
| Your Edge (the highlight) | `rounded-lg border border-accent-light bg-accent-muted p-4`, label `text-accent`, same bullet list inside |
| Footer | `border-t border-border pt-4`; `text-xs leading-5 text-text-muted`: "Sources:" with underlined links (`target="_blank" rel="noopener noreferrer"`, label is host + path) or, with none, "We couldn't read the company's website, so this briefing comes from the job post and your profile only."; below it "Researched 2 hours ago" |

**Pattern notes:** tech chips use the info tint because the success/accent chip colours already mean "matched" and "gap" on this page. The empty state is unchanged.

### AppNavbar bar vs wrapper (feature 12)

`AppNavbarBar` holds the markup and classes documented under AppNavbar (unchanged); `AppNavbar` only supplies `usePathname()`. `app/(app)/layout.tsx` wraps it in `<Suspense fallback={<AppNavbarBar pathname={null} />}>`, so on `/find-jobs/[id]` the bar renders at once with no active item and the underline appears when the pathname resolves.

### Find Jobs page (feature 09)

Files: `app/(app)/find-jobs/page.tsx`, `components/find-jobs/SearchControls.tsx`, `JobFilters.tsx`, `JobsTable.tsx`, `MatchScoreBar.tsx`, `JobsPagination.tsx`
Last updated: 2026-11-15

Built from `context/designs/find-jobs.png` (sampled colours, 1440px frame). Page wrapper `mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-14`, sections stacked `gap-6`, every section a card `rounded-xl border border-border bg-surface shadow-card`. The visible page title is absent in the design, so an `sr-only` h1 carries it.

| Part | Class |
| --- | --- |
| Search card | `p-6`; fields `flex-col gap-4 sm:flex-row sm:items-end`; two `flex-1` fields plus the button |
| Label | the profile `labelClass` (`text-xs font-semibold uppercase tracking-wide text-text-dark`) + `mb-1.5` |
| Search input | `rounded-md border border-border bg-surface py-2.5 text-sm shadow-card placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent`; job title has a `Search size-4 text-text-muted` icon (`left-3.5`, `pl-9`), location is `px-4` |
| Find Jobs button | purple primary: `h-10 rounded-md bg-accent px-5 text-sm font-medium text-accent-foreground shadow-card hover:bg-accent-dark` + `Search size-4` icon |
| Result banner | `role="status" mt-4 flex h-11 items-center gap-2 rounded-md border border-success-light bg-success-lightest px-3.5 text-sm font-medium text-success-foreground`, `Sparkles size-4 text-success-alt` |
| Filter bar | `flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-2.5`; text input is borderless (`pl-7`, icon `left-1`) with the card focus ring on `focus-within`; selects sit after a `sm:border-l sm:pl-4` divider |
| Filter select | native `<select>` `appearance-none rounded-md border border-border bg-surface py-1.5 pr-9 pl-4 text-sm font-medium shadow-card` + `ChevronDown size-4 text-text-secondary` at `right-3`; first (match filter) `text-text-primary`, second (sort) `text-text-dark`, as in the design |
| Table | `table-fixed min-w-[860px]` in an `overflow-x-auto` wrapper; column widths 22.4 / 22.5 / 22.5 / 17.4 / 15.2 %; `thead` `bg-surface-secondary border-b border-border`; header `h-12 px-6 text-xs font-medium tracking-wider uppercase text-text-secondary` (Match Score centred, first column `pl-11`) |
| Row | `relative h-16` cells `px-6`, `border-b border-border last:border-b-0 hover:bg-surface-secondary`; the role is a `<Link className="block truncate after:absolute after:inset-0">` so the whole row opens `/find-jobs/[id]` (feature 12); company `font-semibold text-text-primary`, role and salary `font-medium text-text-dark`, date `text-text-secondary` |
| Company tile | `size-8 rounded-md border border-border bg-surface-tertiary` with `Building2 size-4 text-text-secondary`, `gap-3` to the name |
| Match score bar | SVG `h-1.5 w-24`, track `fill-border-light`, fill `fill-success-alt` (90+) / `fill-info-medium` (80 to 89) / `fill-warning` (below 80); percentage `w-9 text-sm font-semibold tabular-nums`, `gap-2` |
| Pagination footer | `border-t border-border bg-surface-secondary/50 px-6 py-4`; summary `text-sm text-text-secondary` with `font-semibold text-text-primary` numbers; buttons `h-8 min-w-8 rounded-md border border-border bg-surface px-3 text-sm font-medium text-text-dark shadow-card`, disabled `text-text-muted`, current page `border-accent-light bg-accent-muted text-accent`, ellipsis `text-text-muted`; `gap-2` |
| Empty state | `px-6 py-16 text-center text-sm text-text-muted` |

**Pattern notes:** the bar bands come from the design, not ui-rules.md or ui-tokens.md, which disagree (see progress-tracker). The score fill is an SVG `<rect width="94%">` so no inline style is needed.

**Feature 10 additions (search wired, real jobs):** `SearchControls` is now a client component with a `<form onSubmit>`; the filter input, both selects and the pagination buttons are still not wired (feature 11).

| Part | Class |
| --- | --- |
| Find Jobs button, loading | same purple primary, `disabled:cursor-not-allowed disabled:opacity-70`; icon swaps to `LoaderCircle size-4 animate-spin`, label "Searching..."; both inputs are disabled while searching |
| Progress line | `role="status" mt-4 text-sm text-text-secondary` ("Searching and scoring jobs against your profile. This can take up to a minute.") |
| Result banner | unchanged, but `min-h-11 py-2` instead of a fixed `h-11` so a long message (e.g. the zero-results text) can wrap |
| Error | `role="alert" mt-4 text-sm text-error`; on a 422 (empty profile) it ends with a `font-medium underline underline-offset-2` link "Go to your profile" |
| Adzuna credit | `border-t border-border px-6 py-3 text-xs text-text-muted` under the pagination bar, "Jobs by" + an underlined link to adzuna.com (`target="_blank" rel="noopener noreferrer"`), shown only when jobs are listed. **Not in the design**; added because Adzuna's terms and project-overview require attribution |
| Empty state | `JobsTable` now shows "No jobs yet. Search above to find your first matches." for a user with no saved jobs |

**Feature 11 additions (filter, sort and paging wired):** no new visual patterns, only behaviour and two small states. State lives in the URL (`?q=&match=&sort=&page=`).

| Part | Class / behaviour |
| --- | --- |
| Filter bar | unchanged classes. `JobFilters` is now a client component with `aria-busy` while the list reloads; the text input has `maxLength` 100 and applies 300ms after the last keystroke, both selects apply at once |
| Filter select | `FilterSelect` (now in `components/shared/`) is controlled (`value` + `onChange`); same classes |
| Pagination buttons | now `next/link` `<Link>`s with the same classes (`inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-3 text-sm font-medium shadow-card`, `border-border bg-surface text-text-dark hover:bg-surface-secondary`). Current page `border-accent-light bg-accent-muted text-accent` with `aria-current="page"`. First/last page buttons are a `<span aria-disabled="true">` with `cursor-not-allowed text-text-muted` instead of a disabled button. `prefetch={false}` |
| Page window | `1 2 3 … last` near the start (the design), `1 … last-2 last-1 last` near the end, `1 … n-1 n n+1 … last` in the middle; all pages when there are 4 or fewer |
| Empty, filtered | `px-6 py-16 text-center text-sm text-text-muted`: "No jobs match your filters." and a "Clear filters" link `mt-2 inline-block font-medium text-accent hover:text-accent-dark`. The "No jobs yet…" text is kept for a user with no saved jobs |

**Pattern notes:** the pagination footer, "Showing x to y of z" text and the Adzuna credit are unchanged; the credit still shows whenever the current page has jobs. Default sort is Match Score (the design's default).

### Dashboard page (feature 14)

Files: `app/(app)/dashboard/page.tsx`, `components/dashboard/*`
Last updated: 2026-11-16

Built from `context/designs/dashboard.png` (2000px render of a 1440px frame, so design px = measured / 1.389). Page wrapper `mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-14`, sections stacked `gap-6`, every section a card `rounded-xl border border-border bg-surface shadow-card`. The design has no visible page title, so an `sr-only` h1 carries it. Layout: four stat cards (`grid gap-6 sm:grid-cols-2 lg:grid-cols-4`), then Recent Activity + Company Research Activity (`lg:grid-cols-2`), then Jobs Found Over Time (`lg:col-span-2`) + Match Score Distribution (`lg:grid-cols-3`).

| Part | Class |
| --- | --- |
| Stat card | `p-6`; label `text-sm font-medium text-text-secondary`; number `mt-1 text-3xl font-semibold text-text-primary` (30px / 36px); footer `mt-2` |
| Trend badge | `rounded-sm px-2 py-0.5 text-xs font-medium` (4px, not a pill) + tone: up `bg-success-lightest text-success-darker` (the design), down `bg-error-light text-error`, flat (0%) `bg-surface-secondary text-text-secondary` (down and flat are not in the design); then `text-xs text-text-muted` "vs last week", `gap-3`. Cards without a trend show a `mt-2 py-0.5 text-xs text-text-muted` note instead ("Total researched", "All time") |
| Recent Activity | heading `border-b border-border px-6 py-5 text-base font-semibold text-text-primary` (the card has no padding of its own); list `px-6 pt-6 pb-6`; entry `flex gap-4`, 64px pitch (`pb-6.5` after all but the last) |
| Activity dot | 16px ring `size-4 rounded-full` + 8px dot `size-2 rounded-full`; ring/dot by tone: accent `bg-accent-light`/`bg-accent`, info `bg-info-light`/`bg-info`, success `bg-success-light`/`bg-success-alt`; 1px connector `mt-1 w-px flex-1 bg-border` under every dot but the last |
| Activity data (feature 16) | search run = `success` (green) dot, researched company = `info` (blue) dot; labels from `formatActivityLabel` ("10 mins ago", "1 hour ago", "Yesterday"). The design's accent (purple) dot is no longer used by the real feed |
| Activity text | message `text-sm leading-4 font-medium text-text-primary`; time `mt-1.5 text-xs text-text-muted`; empty state `px-6 py-16 text-center text-sm text-text-muted` |
| Activity link (2026-11-17) | a "Researched {company}" entry's message is a `Link` to its job details page (`jobDetailPath`), same text classes as a plain message; on hover it turns `text-accent` with `underline underline-offset-2`, and on keyboard focus `text-accent`. Search-run entries ("Found N jobs…") stay plain text. The entry carries an optional `href` (`ActivityEntry`), so any future entry can link the same way |
| Chart states (feature 17) | inside the chart box (`h-full`), centred `flex flex-col items-center justify-center px-6 text-center`. **Empty** (`ChartEmptyState`): title `text-sm font-medium text-text-primary`, text `mt-1 max-w-xs text-sm text-text-muted`. **Error** (`ChartErrorState`, `role="alert"`): title `text-sm font-medium text-error` "Couldn't load this chart", same muted text. **Loading** (`ChartSkeleton`): `h-full rounded-lg bg-surface-tertiary motion-safe:animate-pulse`, inside the card so the heading shows at once |
| Chart window caption (feature 17) | optional `window` prop on `ChartCard`: `shrink-0 text-xs text-text-muted` at the right end of the heading row (`flex items-baseline justify-between gap-4`), so the plot does not move. "Last 30 days" (Jobs, Match Score) and "Last 7 days" (Research); it explains why chart totals can differ from the stat cards, which count all jobs |
| Chart card (`ChartCard`) | `flex flex-col p-6`; heading `text-base font-semibold text-text-primary`; chart box `relative mt-6 min-h-[280px] flex-1` holding an `absolute inset-0` child (recharts needs a definite size) |
| Chart styling | bars: research `var(--color-info)`, max 40px wide; match distribution `var(--color-success)`, max 32px wide, square tops. Line: `var(--color-accent)` 3px, smooth (`monotone`), no dots, area fill accent 20% to 2%. Grid horizontal only, `4 4` dashed `var(--color-border)`; axis labels 12px `var(--color-chart-axis)`, no axis or tick lines. Tooltip: white card, `border-border`, `rounded-md`, `shadow-card` (not in the design) |

**Pattern notes:** the Company Research Activity chart has a 40px top margin because its plot starts lower in the design than the other two charts (115px vs 82px below the card top). Y ticks are passed in as `yTicks` and, since feature 17, derived from the data by `niceTicks` (`lib/chartTicks.ts`; the mock used the design's fixed 0 to 12 and 0 to 100). Jobs Found Over Time has 30 daily labels ("Oct 18"), thinned with `interval="preserveStartEnd"` and `minTickGap={24}`; Company Research Activity keeps weekday labels ("Mon"); Match Score Distribution has six bars (`<50%` first). Chart colours are CSS variables in SVG props (recharts takes no class names); `--color-chart-axis` is the existing token for the design's `#9CA3AF`. The design's navbar shows no Sign out and a larger logo; the shipped `AppNavbar` is kept, as for the other pages.

**Incomplete-profile banner:** the dashboard reuses `CompletionIndicator` (see its entry) at the top, only while `is_complete` is false. It takes an optional `actionHref`; when set, a `mt-5 inline-block text-sm font-medium text-accent hover:text-accent-dark` "Complete your profile" link follows the tags. The profile page does not pass it. Not in the design (which shows a complete profile).

### Dashboard route error — `app/(app)/dashboard/error.tsx`
Route-level fallback (client component, `retry` prop from this Next version, not `reset`). Renders inside the `(app)` layout, so the navbar stays. Not in the design; built from existing patterns.

| Property | Value |
|---|---|
| Wrapper | same page container as the dashboard: `mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-14` |
| Card | `role="alert"`, `flex flex-col items-center rounded-xl border border-border bg-surface px-6 py-16 text-center shadow-card` |
| Icon tile | `size-12 rounded-xl bg-surface-tertiary` + `TriangleAlert size-6 text-error` (same tile as the Company Research empty state) |
| Heading | `h1` `mt-3 text-base font-semibold text-text-primary` ("Couldn't load your dashboard") |
| Text | `mt-1 max-w-xs text-sm text-text-muted` |
| Button | in-app purple primary: `mt-4 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-card hover:bg-accent-dark` + `RefreshCw size-4`, "Try again" calls `retry()` |

**Pattern notes:** the raw error is never shown; it goes to `posthog.captureException` like `app/global-error.tsx`. The chart readers never reject, so this only catches something unexpected. A future `error.tsx` for another `(app)` route should copy this shape.

### Cover Letter card (feature 18) — `components/job-details/CoverLetter.tsx`
Client component on `/find-jobs/[id]`, between Company Research and Apply Now. No design exists; it copies the Company Research card. Wired to the route and Server Action in feature 19. Last updated: 2026-11-16

| Part | Class / behaviour |
| --- | --- |
| Card + header | same as Company Research: `overflow-hidden rounded-xl border border-border bg-surface shadow-card`; header `flex items-center justify-between gap-4 border-b border-border px-6 py-4`; `SectionIcon tone="accent"` + `FileText`; title `text-base font-semibold text-text-primary` |
| Tone dropdown | `FilterSelect` (`components/shared/`, shared with Find Jobs; has a `disabled` prop: `disabled:cursor-not-allowed disabled:opacity-70`), `aria-label="Cover letter tone"`, Formal / Casual / Enthusiastic, left of the header button in a `flex flex-wrap items-center gap-2` group; the header wraps (`flex-wrap gap-x-4 gap-y-3`) on narrow screens. Starts on the letter's tone, else the profile's; sent with Generate / Regenerate for that letter only. Disabled while busy or while the replace confirm is open |
| Header button | `rounded-lg px-4 py-2 text-sm font-medium shadow-card`, `gap-2`, `size-4` icon. No letter: primary accent, "Generate Cover Letter", `FileText`. Letter exists: secondary, "Regenerate", `RefreshCw`. Busy: `LoaderCircle animate-spin`, "Writing your cover letter...", `disabled:cursor-not-allowed disabled:opacity-70` |
| Empty state | same as Company Research (`px-6 py-12`, tile `size-12 rounded-xl bg-surface-tertiary` + `FileText size-6 text-text-muted`, "No cover letter yet") |
| Body (letter exists) | `flex flex-col gap-4 px-6 py-6` |
| Meta line | `text-xs text-text-muted`: "Formal tone · Generated 2 hours ago"; "Edited" pill `rounded-full bg-surface-secondary px-2 py-0.5 font-medium text-text-secondary` |
| Textarea | `w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm leading-6 text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none`, 18 rows, `aria-label`, `maxLength` 5,000, disabled while busy |
| Footer row | `flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`; word count `text-xs text-text-muted` ("152 words"), "Saved" `role="status" font-medium text-success-foreground`; buttons `gap-2`: secondary Copy (`Copy` icon, becomes `Check` + "Copied" for 2s) and primary "Save changes" (disabled until the text differs from the saved letter) |
| Regenerate confirm | `role="alertdialog"` strip under the header: `border-b border-border bg-surface-secondary px-6 py-3`, bold "This replaces your edited letter." lead-in, secondary Cancel + primary "Replace and regenerate". Shown only when the letter has saved or unsaved edits |
| Error line | `role="alert" border-b border-border px-6 py-3 text-sm text-error` (as the research card). After a 422 it is followed by an underlined "Go to your profile" link (`font-medium underline underline-offset-2`), as on Find Jobs |

**Profile form:** "Cover Letter Tone (Optional)" is a full-width `SelectInput` at the end of Job Preferences (placeholder "Choose a tone"; Formal, Casual, Enthusiastic). It saves with the profile and pre-fills on return visits (`defaultValue`).

### Loading states (2026-11-17) — `components/shared/Skeleton.tsx`, page skeletons, `AsyncActionButton`

| Element | Pattern |
| --- | --- |
| Skeleton block (`Skeleton`) | `rounded-md bg-surface-tertiary motion-safe:animate-pulse` (the `ChartSkeleton` look); `tone="page"` uses `bg-border` for blocks straight on the page background. Size and shape come from `className`. Always `aria-hidden` |
| `SkeletonText` | `flex flex-col gap-2.5` lines of `h-3.5`; the last is `w-2/3` |
| `SkeletonRegion` | `role="status" aria-busy="true"` with an `sr-only` label ("Loading your dashboard", "Loading your profile", "Loading this job", "Loading jobs") |
| Page skeletons | Same wrapper widths and card shells as the real pages (`max-w-[1440px]` dashboard and find-jobs, `max-w-[932px]` profile, `max-w-[844px]` job), same grids and gaps, so nothing jumps when data arrives. Files: `DashboardSkeleton`, `ProfileSkeleton`, `FindJobsSkeleton`, `JobDetailsSkeleton`. They are the `<Suspense>` fallback, inside the page wrapper |
| Jobs table skeleton | `JobsTableSkeleton` shows the real header row (static labels) and 10 rows `h-16`; `JobRowsSkeleton` is the rows alone. Both use a grid with the table's column widths (`22.4% 22.5% 22.5% 17.4% 15.2%`, `min-w-[860px]`) |
| Jobs results card while changing | filters or page: table replaced by `JobsTableSkeleton`, footer `opacity-60`. Search running: 3 skeleton rows above the existing rows (only the skeleton when there are no jobs). Card has `aria-busy` |
| Letter and dossier placeholders | `LetterSkeleton` (meta line and three paragraphs inside a bordered box, `px-6 py-6`) replaces the textarea; `DossierSkeleton` (text and a 2-column grid of heading and two lines) replaces the dossier. Both appear while the action runs |
| Busy button (`AsyncActionButton`) | Same classes as before (the caller passes `className`). Busy: icon becomes `LoaderCircle size-4 animate-spin` (`spinnerClassName` for a coloured one), label becomes "Searching...", "Writing...", "Researching...", "Reading your resume…" or "Generating…" followed by an `m:ss` timer (`tabular-nums`, `aria-hidden`). Idle and busy labels share one grid cell (`col-start-1 row-start-1`, the hidden one `invisible`), so the width is the longer label and never changes. `aria-busy` is set |
| Progress checklist (`ProgressSteps`) | Replaces the old static status lines. Full entry below ("Progress checklist") |
| Status line while busy | Superseded by the progress checklist above. The `border-b border-border px-6 py-3` text lines are gone |

### Progress checklist (`ProgressSteps`) — `components/shared/ProgressSteps.tsx`

File: `components/shared/ProgressSteps.tsx` (state from `components/shared/useProgressAction.ts`)
Last updated: 2026-11-17

Shown while one of the six AI actions runs, in place of the old static status line. Two variants share the same step markup.

| Property | Class |
| --- | --- |
| Wrapper, `card` variant | `border-b border-border px-6 py-4` (sits under a card header band: cover letter, company research) |
| Wrapper, `inline` variant | `mt-3 rounded-md border border-border bg-surface-secondary px-4 py-3` (boxed note inside a form card: Find Jobs search, profile Extract and Generate) |
| Step list | `flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2` |
| Step row | `flex items-center gap-2 text-sm`; icon in a `size-4` box |
| Text, done | `text-text-secondary` |
| Text, current | `font-medium text-text-primary` |
| Text, skipped / upcoming | `text-text-muted` |
| Count ("4 of 10") | `tabular-nums text-text-secondary` |
| Icon, done | `Check size-4 text-success-foreground` |
| Icon, current | `LoaderCircle size-4 text-accent motion-safe:animate-spin` |
| Icon, skipped | `Minus size-4 text-text-muted` |
| Icon, upcoming | `size-1.5 rounded-full bg-border` dot |
| Hover / focus | none (not interactive) |
| Shadow | none |
| Accent usage | the spinner only |

**Pattern notes:**
- State is never colour alone: each label ends with an `sr-only` word ("done", "in progress", "skipped", "waiting"), the wrapper is `role="status"` with an `aria-label`, and the spinner respects reduced motion.
- A step is "skipped" only when the server never started it (no website found, nothing new to score). Never fake a step, and show a count only when the server sent a real one.
- The `inline` wrapper deliberately matches the replace-confirm panel in `ResumeUpload` (`rounded-md border border-border bg-surface-secondary px-4 py-3`). Use the same panel classes for any other boxed note in a form card.
- Use `card` only directly under a card header band; anywhere else use `inline`. Do not add a third wrapper style.
- Success tick uses `text-success-foreground`, the same token as the "Saved" label and the success banners, not `text-success`.
- Keep the skeleton placeholder (LetterSkeleton, DossierSkeleton, JobsTableSkeleton rows) alongside it; the checklist replaces the status text only.
