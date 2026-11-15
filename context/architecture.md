# Architecture

## Stack

| Layer                          | Tool                     | Purpose                                          |
| ------------------------------ | ------------------------ | ------------------------------------------------ |
| Framework                      | Next.js 16 (App Router)  | Full stack framework                             |
| Auth + DB + Storage + Realtime | InsForge                 | Entire backend                                   |
| Cloud browser                  | Browserbase              | Company research — browsing company public pages |
| AI browser control             | Stagehand                | Company page interaction and content extraction  |
| Job Discovery                  | Adzuna API               | Job search and discovery                         |
| AI model                       | OpenAI GPT-4o            | Matching, research synthesis, extraction         |
| Analytics                      | PostHog                  | Event tracking and dashboard charts              |
| PDF generation                 | @react-pdf/renderer      | Resume PDF rendering                             |
| Styling                        | Tailwind CSS + shadcn/ui | UI components and styling                        |
| Language                       | TypeScript strict        | Throughout                                       |

---

## Folder Structure

```
/
├── AGENTS.md
├── context/
│   ├── project-overview.md
│   ├── architecture.md
│   ├── ui-tokens.md
│   ├── ui-rules.md
│   ├── ui-registry.md
│   ├── code-standards.md
│   ├── library-docs.md
│   ├── build-plan.md
│   └── progress-tracker.md
├── app/
│   ├── layout.tsx                          → Root layout
│   ├── not-found.tsx                       → 404 page (auth-card shell) — also catches unbuilt routes like /dashboard
│   ├── page.tsx                            → Homepage
│   ├── login/
│   │   └── page.tsx                       → Login page (Google + GitHub buttons)
│   ├── sign-out/
│   │   └── page.tsx                       → Sign-out confirmation page
│   ├── dashboard/
│   │   └── page.tsx                       → Main dashboard
│   ├── (app)/                              → Route group for signed-in pages — shares AppNavbar
│   │   ├── layout.tsx                     → AppNavbar + main
│   │   ├── profile/
│   │   │   └── page.tsx                   → Profile form + resume management (URL is /profile) — reads getProfile()
│   │   └── find-jobs/
│   │       ├── page.tsx                   → Find Jobs page — search controls + the user's saved jobs, filtered/sorted/paged from the URL (`?q&match&sort&page`, 20 per page)
│   │       └── [id]/
│   │           └── page.tsx               → Individual job details page
│   └── api/
│       ├── auth/
│       │   ├── callback/route.ts          → OAuth callback — exchanges insforge_code for a session
│       │   ├── sign-out/route.ts          → Clears session cookies
│       │   └── refresh/route.ts           → Session refresh for the browser client
│       ├── agent/
│       │   ├── find/route.ts              → Trigger Adzuna job discovery
│       │   └── research/route.ts          → Trigger company research agent
│       ├── resume/
│       │   ├── upload/route.ts            → Store the picked resume PDF (POST, on file pick)
│       │   ├── file/route.ts              → Stream the user's own private resume PDF (GET)
│       │   ├── generate/route.ts          → Generate base resume PDF from profile
│       │   └── extract/route.ts           → Extract profile data from uploaded resume PDF
├── agent/
│   ├── adzuna.ts                          → discoverJobs(): search Adzuna, skip already-saved jobs, score the new ones, insert (feature 10)
│   ├── research.ts                        → Company research — Browserbase + Stagehand + GPT-4o
│   ├── matcher.ts                         → scoreJob(): one GPT-4o call per job against the saved profile (feature 10)
│   ├── resumeExtractor.ts                 → GPT-4o resume text → form-shaped profile data (feature 07)
│   ├── resumeWriter.ts                    → GPT-4o profile → resume summary + role bullets (feature 08)
│   ├── extractor.ts                       → GPT-4o job description extraction + structuring
│   └── types.ts                           → Agent-specific TypeScript types
├── proxy.ts                                → Session refresh + protected-route redirects
├── db/
│   └── migrations/
│       └── 001_initial_schema.sql         → Tables, indexes, RLS, backfill (applied via InsForge)
├── actions/
│   ├── auth.ts                            → OAuth sign-in Server Actions (Google, GitHub)
│   ├── profile.ts                         → saveProfile — validates the form, computes completion, writes profiles
│   └── jobs.ts                            → Job status updates
├── components/
│   ├── ui/                                → shadcn/ui components only
│   ├── layout/
│   │   ├── Navbar.tsx                     → Homepage navbar
│   │   ├── AppNavbar.tsx                  → Signed-in navbar (icons, underline on active item)
│   │   ├── SignOutButton.tsx              → One-click sign out in AppNavbar (POST /api/auth/sign-out)
│   │   └── Footer.tsx
│   ├── homepage/
│   │   ├── Hero.tsx
│   │   ├── HowItWorks.tsx
│   │   └── Features.tsx
│   ├── dashboard/
│   │   ├── StatsBar.tsx
│   │   ├── RecentActivity.tsx
│   │   └── AnalyticsCharts.tsx
│   ├── profile/
│   │   ├── CompletionIndicator.tsx        → "Profile needs attention" banner + ring
│   │   ├── ProfileEditor.tsx              → Holds ResumeUpload + ProfileForm; merges extracted resume data into the form (remounts it)
│   │   ├── FilledFieldsContext.tsx        → Which form fields came from the resume (highlight state); FilledBadge.tsx is the "From resume" tag
│   │   ├── ResumeUpload.tsx               → Resume card: drop zone, Extract from Resume, Generate button
│   │   ├── ProfileForm.tsx                → Form shell + Save Profile
│   │   ├── PersonalInfoSection.tsx / ProfessionalInfoSection.tsx / WorkExperienceSection.tsx
│   │   │   WorkExperienceCard.tsx / EducationSection.tsx / JobPreferencesSection.tsx
│   │   └── ProfileSection.tsx, FormField.tsx, SelectInput.tsx, TagInput.tsx, fieldStyles.ts
│   ├── find-jobs/
│   │   ├── SearchControls.tsx             → Search card: job title, location, Find Jobs, result banner
│   │   ├── JobFilters.tsx                 → Filter bar (client): text filter + FilterSelect dropdowns; writes `?q&match&sort` to the URL
│   │   ├── FilterSelect.tsx               → Controlled styled native select used by JobFilters
│   │   ├── JobsTable.tsx                  → Jobs table (+ empty states: no jobs yet / nothing matches the filters)
│   │   ├── MatchScoreBar.tsx              → Colour coded score bar + percentage (SVG, no inline style)
│   │   └── JobsPagination.tsx             → "Showing x to y of z" + page links (next/link, filters kept)
│   └── job-details/
│       ├── JobInfo.tsx
│       ├── MatchScore.tsx
│       ├── JobDescription.tsx
│       ├── CompanyResearch.tsx
│       └── JobActions.tsx
├── lib/
│   ├── insforge/
│   │   ├── client.ts                      → InsForge browser client instance
│   │   ├── server.ts                      → InsForge server client + getUser()
│   │   ├── profile.ts                     → getProfile() — reads the profiles row, creating it on first use
│   │   ├── jobs.ts                        → getSavedJobScores() (repeat-search lookup) and listJobs(query) — filtered, sorted, 20 per page (Find Jobs page)
│   │   ├── agentLogs.ts                   → logAgent(): one line to agent_logs, never throws
│   │   └── resumeStorage.ts               → downloadResume(): reads the private resume with retries and real-error logging (file, extract and generate routes)
│   ├── browserbase.ts                     → Browserbase session creation + management
│   ├── stagehand.ts                       → Stagehand initialisation with Browserbase session
│   ├── adzuna.ts                          → Adzuna client: searchJobs(), detectCountry(), formatSalary(), toJobType()
│   ├── jobScoring.ts                      → normalizeJobScore(): untrusted GPT-4o JSON → safe JobScore
│   ├── findJobs.ts / findJobsSchema.ts / findJobsMessage.ts → Find Jobs path + limits, zod body schema, banner text
│   ├── relativeTime.ts                    → formatFoundLabel(): "2 hours ago" / "Yesterday"
│   ├── pagination.ts                      → buildPageItems(totalPages, currentPage): page buttons for the jobs pagination
│   ├── jobsQuery.ts                       → Find Jobs URL state: parseJobsQuery(), buildJobsHref(), buildTextSearchFilter(), hasActiveFilters()
│   ├── profileSchema.ts                   → zod validation of the profile FormData
│   ├── profileConstants.ts                → Limits and allowed enum values shared by Save validation and resume extraction
│   ├── profileFormData.ts                 → Zod-free FormData readers (readFormValues), splitList/joinList — safe for client code
│   ├── openai.ts                          → Shared OpenAI client (45s timeout, 1 retry) + describeOpenAIError
│   ├── resumeExtraction.ts                → normalizeExtraction(): untrusted GPT-4o JSON → safe ExtractedProfile
│   ├── resumeContent.ts                   → Resume content for the PDF: normalizeResumeWriting(), buildResumeContent(), trimResumeContent()
│   ├── resumeDocument.tsx                 → @react-pdf/renderer layout + renderResumePdf() (server only, always one page)
│   ├── profileMerge.ts                    → mergeExtractedValues(): lays resume data over the current form values
│   ├── profileCompletion.ts               → Required fields → completion_percentage, missing_fields, is_complete
│   ├── profileMapping.ts                  → profiles row ↔ form values / update payload
│   ├── resume.ts                          → Resume size limit, route paths, extraction limits shared by client and server
│   ├── rateLimit.ts                       → In-memory per-user sliding-window limiter for paid API routes
│   ├── routes.ts                          → SIGNED_IN_HOME — post-login destination + homepage CTA (one place to flip to /dashboard); FIND_JOBS_PAGE_PATH
│   ├── posthog-server.ts                  → PostHog server client (job_search_started, job_found); shut down in the same function
│   └── utils.ts                           → MATCH_THRESHOLD (70)
└── types/
    └── index.ts                           → Global TypeScript types
```

---

## System Boundaries

| Folder        | Owns                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| `app/`        | Pages and API routes only. No business logic.                                                          |
| `agent/`      | All agent logic. Adzuna discovery, company research, matching, extraction. Nothing here touches React. |
| `actions/`    | Server Actions for UI-triggered mutations only. Profile save, profile update.                          |
| `components/` | UI only. No data fetching logic. No direct DB calls.                                                   |
| `lib/`        | Third party client initialisation and shared utilities only.                                           |
| `types/`      | TypeScript types shared across the project.                                                            |

---

## Data Flow

### UI Mutations (Server Actions)

```
User interaction in component
        ↓
Server Action in actions/
        ↓
InsForge DB write
        ↓
Revalidate or redirect
```

### Agent Operations (API Routes)

```
User clicks Find Jobs
        ↓
API route in app/api/agent/find
        ↓
Calls agent/adzuna.ts
        ↓
Adzuna API returns job listings
        ↓
GPT-4o scores each job against user profile
        ↓
Agent writes results to InsForge DB
        ↓
Page data revalidated
```

### Company Research (API Routes)

```
User clicks Research Company on job details page
        ↓
API route in app/api/agent/research
        ↓
Calls agent/research.ts
        ↓
Single Browserbase session opens with Stagehand
        ↓
Navigates to company homepage + sub pages
        ↓
GPT-4o synthesizes dossier from extracted content
        ↓
Dossier saved to jobs.company_research
        ↓
Page data revalidated
```

### Resume Operations (API Routes)

```
User uploads resume or clicks Generate
        ↓
API route in app/api/resume/
        ↓
GPT-4o processes content
        ↓
@react-pdf/renderer renders PDF buffer
        ↓
New PDF uploaded to InsForge Storage
        ↓
URL saved to profiles table
```

---

## InsForge Database Schema

### `profiles`

| Column              | Type        | Notes                                        |
| ------------------- | ----------- | -------------------------------------------- |
| id                  | uuid        | References auth.users                        |
| full_name           | text        |                                              |
| email               | text        | Pre-filled from auth                         |
| phone               | text        |                                              |
| location            | text        | City, country                                |
| current_title       | text        | Most recent job title                        |
| experience_level    | text        | junior / mid / senior / lead                 |
| years_experience    | integer     |                                              |
| skills              | text[]      | Array of skill tags                          |
| industries          | text[]      | Industries worked in                         |
| work_experience     | jsonb       | Array of up to 3 roles                       |
| education           | jsonb       | Degree, field, institution, year             |
| job_titles_seeking  | text[]      | Roles they want                              |
| remote_preference   | text        | remote / onsite / hybrid / any               |
| preferred_locations | text[]      | Optional preferred locations                 |
| salary_expectation  | text        | Optional                                     |
| cover_letter_tone   | text        | formal / casual / enthusiastic               |
| linkedin_url        | text        |                                              |
| portfolio_url       | text        |                                              |
| work_authorization  | text        | citizen / permanent_resident / visa_required |
| resume_pdf_url      | text        | InsForge Storage URL of current resume       |
| is_complete         | boolean     | True when all required fields filled         |
| completion_percentage | integer   | 0-100, calculated on save (feature 06)       |
| missing_fields      | text[]      | Required fields still empty (feature 06)     |
| created_at          | timestamptz |                                              |
| updated_at          | timestamptz | Kept current by a trigger                    |

Rows are created lazily by `getProfile()` in `lib/insforge/profile.ts` — InsForge does not allow triggers on `auth.users`. Any page or route that needs the profile must call it; never assume the row exists.

### `agent_runs`

| Column             | Type        | Notes                        |
| ------------------ | ----------- | ---------------------------- |
| id                 | uuid        |                              |
| user_id            | uuid        | References profiles          |
| status             | text        | running / completed / failed |
| job_title_searched | text        |                              |
| location_searched  | text        |                              |
| jobs_found         | integer     | Total jobs discovered        |
| started_at         | timestamptz |                              |
| completed_at       | timestamptz |                              |

### `jobs`

| Column             | Type        | Notes                                          |
| ------------------ | ----------- | ---------------------------------------------- |
| id                 | uuid        |                                                |
| run_id             | uuid        | References agent_runs — null if from URL input |
| user_id            | uuid        | References profiles                            |
| external_id        | text        | Adzuna job id — unique per (user_id, external_id), so repeat searches upsert instead of duplicating. Null for url source |
| source             | text        | search / url                                   |
| source_url         | text        | Adzuna redirect_url (Apply Now links here)     |
| external_apply_url | text        | Direct company apply URL — nullable, unused for now |
| title              | text        |                                                |
| company            | text        |                                                |
| location           | text        |                                                |
| salary             | text        | If available                                   |
| job_type           | text        | fulltime / parttime / contract                 |
| about_role         | text        | 2-3 sentence summary                           |
| responsibilities   | text[]      | Bullet points                                  |
| requirements       | text[]      | Bullet points                                  |
| nice_to_have       | text[]      | Optional                                       |
| benefits           | text[]      | Optional                                       |
| about_company      | text        | Brief company description                      |
| match_score        | integer     | 0-100 scored against main profile              |
| match_reason       | text        | GPT-4o explanation                             |
| matched_skills     | text[]      | Skills user has that match                     |
| missing_skills     | text[]      | Skills user lacks                              |
| company_research   | jsonb       | Company dossier from research agent            |
| researched_at      | timestamptz | When company_research was saved (activity feed)|
| found_at           | timestamptz |                                                |

`about_role` holds Adzuna's description snippet. `responsibilities`, `requirements`, `nice_to_have`, `benefits` and `about_company` are nullable and stay empty for Adzuna jobs (reserved for a future full-description fetch or URL import).

Schema source of truth: `db/migrations/001_initial_schema.sql` (applied via InsForge `run-raw-sql`). All four tables have RLS: one `for all` policy per table limiting `authenticated` to its own rows (`id = auth.uid()` on profiles, `user_id = auth.uid()` elsewhere).

### `agent_logs`

| Column     | Type        | Notes                            |
| ---------- | ----------- | -------------------------------- |
| id         | uuid        |                                  |
| run_id     | uuid        | References agent_runs            |
| user_id    | uuid        | References profiles              |
| message    | text        | Human readable log entry         |
| level      | text        | info / success / warning / error |
| job_id     | uuid        | Optional — related job           |
| created_at | timestamptz |                                  |

---

## InsForge Storage

| Bucket  | Object key             | Contents                  |
| ------- | ---------------------- | ------------------------- |
| resumes | {user_id}/resume.pdf   | Current active resume PDF |

The bucket is **private**. Browsers cannot open its storage URLs, so the file is only ever read on the server (features 07 and 08 run in API routes). The profile page's "View" link goes through `GET /api/resume/file`, an authenticated route handler that streams the PDF (feature 06). `profiles.resume_pdf_url` means "a resume exists" — the key is always `{user_id}/resume.pdf`, built from the session user. Uploading to an existing key replaces the object (the SDK's `upload()` has no `upsert` flag).

---

## Authentication

- Provider: InsForge Auth
- Methods: Google OAuth, GitHub OAuth
- Protected routes: /dashboard, /profile, /find-jobs, /find-jobs/[id]
- Also protected: /sign-out
- Public routes: /, /login
- `proxy.ts` (Next 16's replacement for middleware.ts) refreshes the session and redirects signed-out users away from protected routes. It runs on pages **and on every `/api` route except `/api/auth/*`**: the access-token cookie expires with its token, so a route handler can only call `getUser()` successfully if the proxy refreshed the cookie first. Any new `app/api/` route needs no extra session handling, but must not be added under `/api/auth/`
- Pages must still verify the user with `getUser()` — the proxy only checks that a valid-looking token cookie exists
- On login → redirect to `SIGNED_IN_HOME` (`lib/routes.ts`) — /profile until the dashboard exists (feature 14), then /dashboard

---

## InsForge Client Pattern

Two separate InsForge instances — never mix them:

```typescript
// lib/insforge/client.ts
// Browser-side — reads the SSR session; auth mutations run on the server
import { createBrowserClient } from "@insforge/sdk/ssr";
export const insforge = createBrowserClient();

// lib/insforge/server.ts
// Server-side — used in API routes, Server Actions, agent code
import { cookies } from "next/headers";
import { createServerClient } from "@insforge/sdk/ssr";

export const createInsforgeServer = async () =>
  createServerClient({ cookies: await cookies() });
```

---

## Browserbase Session Pattern

```typescript
// Company research session — single session, sequential page visits
const session = await bb.sessions.create({
  projectId: process.env.BROWSERBASE_PROJECT_ID!,
  timeout: 120, // 2 minute session — visits 3-4 pages max
});
```

---

## Job Discovery Pattern

**Adzuna API — job search**

```typescript
const response = await fetch(
  `https://api.adzuna.com/v1/api/jobs/us/search/1?` +
    `app_id=${process.env.ADZUNA_APP_ID}&` +
    `app_key=${process.env.ADZUNA_API_KEY}&` +
    `what=${encodeURIComponent(jobTitle)}&` +
    `where=${encodeURIComponent(location)}&` +
    `category=it-jobs&` +
    `results_per_page=10&` +
    `content-type=application/json`,
);
const data = await response.json();
// data.results — array of job listings
// Each job: title, company.display_name, location.display_name,
//           salary_min, salary_max, description, redirect_url, created
```

---

## Company Research Pattern

```typescript
// Single session — visits company homepage and sub pages sequentially
const stagehand = new Stagehand({
  env: "BROWSERBASE",
  apiKey: process.env.BROWSERBASE_API_KEY!,
  projectId: process.env.BROWSERBASE_PROJECT_ID!,
  browserbaseSessionID: session.id,
  modelName: "gpt-4o",
  modelClientOptions: { apiKey: process.env.OPENAI_API_KEY! },
});

await stagehand.init();
const page = stagehand.page;

// Clean company name and construct homepage URL
const cleanName = companyName
  .replace(/\s*(Inc\.?|LLC|Ltd\.?|Corp\.?|Co\.?).*$/i, "")
  .trim()
  .toLowerCase()
  .replace(/\s+/g, "");

const homepageUrl = `https://www.${cleanName}.com`;

// Navigate and extract — graceful fallback if page not found
try {
  await page.goto(homepageUrl);
  await page.waitForLoadState("networkidle");
  const content = await stagehand.extract({ instruction: "..." });
} catch (error) {
  // Log and continue — GPT-4o will synthesize from what was found
  await logAgentError(jobId, error);
}

// Always close session when done
await stagehand.close();
```

---

## Invariants

Rules the AI agent must never violate:

- API routes contain no UI logic. Components contain no DB logic.
- Agent code in `/agent` never imports from `/components` or `/actions`.
- Server Actions never call agent functions. Agent functions are only called from API routes.
- All InsForge server-side writes use `createInsforgeServer()` — never the browser client.
- No hardcoded hex values or raw Tailwind color classes in components — use CSS variables from ui-tokens.md.
- Every Stagehand action is wrapped in try/catch. Failures are logged to agent_logs, never thrown to crash the run.
- Company research always returns a dossier — even if browser research fails, GPT-4o synthesizes from company name and job description alone. Never return empty.
- Browserbase sessions are always closed with stagehand.close() when done — never leave sessions open.
- Always scope InsForge queries to the current user_id — never query without a user filter.
- Adzuna API always includes category=it-jobs — never search without this filter.
- jobs.source is always 'search' or 'url' — never any other value.
