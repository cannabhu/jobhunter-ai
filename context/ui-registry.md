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

### Auth card screens — Login & Sign-out

Files: `app/login/page.tsx`, `app/sign-out/page.tsx`
Last updated: 2026-11-12

Both screens share one shell: a centred card on the pastel gradient. Any future single-purpose screen (error, confirmation, onboarding step) should reuse it.

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
- Error notice has no tinted background because no `error-light` token exists yet. Add one to globals.css before building more error UI, then update this entry.
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
