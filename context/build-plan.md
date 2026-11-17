# Build Plan

## Core Principle

Full page UI built with mock data first — verified visually before any logic is written. Then functionality is built and wired to the UI step by step. Every feature must be visible and testable before moving to the next. No invisible backend phases.

---

## Phase 1 — Foundation

### 01 Homepage

Build the complete homepage UI.

**UI:**

- Navbar — logo, Dashboard, Find Jobs, Profile links, Start for free button
- Hero section — headline, subheadline, Get Started CTA and Find Your First Match CTA
- Dashboard preview screenshot embedded below hero
- Features section — three value props with descriptions
- Testimonial section
- Bottom CTA section
- Footer

**Logic:**

- Get Started and Start for free → /login if not authenticated, /dashboard if authenticated

---

### 02 Auth

InsForge authentication — Google and GitHub OAuth.

**UI:**

- Login page — Google OAuth button, GitHub OAuth button

**Logic:**

- Google OAuth via InsForge
- GitHub OAuth via InsForge
- OAuth callback handler
- Session management
- Middleware protecting /dashboard, /profile, /find-jobs, /find-jobs/[id]
- After login → redirect to /dashboard

---

### 03 PostHog Initialization

Set up PostHog before any events fire. Must be done before any agent features.

**Logic:**

- Browser client: `instrumentation-client.ts` (Next.js loads it on every page) calls `posthog.init` with NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN and NEXT_PUBLIC_POSTHOG_HOST, with `capture_exceptions` on. No provider in the root layout is needed
- `posthog.identify()` runs in the same file once `insforge.auth.getCurrentUser()` returns a user; `user_signed_in` fires once per sign-in via the one-shot `jp_just_signed_in` cookie set by `/api/auth/callback`
- `posthog.reset()` is called on /sign-out
- `instrumentation.ts` exports an OTel logger that sends server diagnostics to PostHog logs (not events); `app/global-error.tsx` reports render errors
- Server client (`lib/posthog-server.ts`, `posthog-node`, `flushAt: 1`, `flushInterval: 0`) is **deferred** until the first server-side event is built (`job_found`, `company_researched`)

---

### 04 Database Schema

All InsForge tables and storage bucket created before any data is written.

**Logic:**

- Schema lives in `db/migrations/001_initial_schema.sql`, applied via InsForge `run-raw-sql`
- Create `profiles` table with all columns from architecture.md, including `completion_percentage` and `missing_fields`
- Create `agent_runs` table
- Create `jobs` table with all columns including:
  - `external_id` (unique per user — repeat searches must not duplicate jobs)
  - company_research jsonb column and `researched_at`
  - source values: 'search' | 'url'
- Create `agent_logs` table
- Create private `resumes` storage bucket; objects keyed `{user_id}/resume.pdf`, read only on the server
- Row level security policies on all four tables — always filter by user_id
- Profile rows: InsForge does not allow triggers on `auth.users`, so `getProfile()` (`lib/insforge/profile.ts`) creates the row on first use; existing users are backfilled in the migration

---

## Phase 2 — Profile Page

### 05 Profile Page — Full UI

Build the complete profile page UI with mock data. No save logic yet.

**UI:**

- Profile needs attention banner at top — completion percentage ring, missing field tags highlighted (e.g. PHONE, LOCATION, EDUCATION)
- Resume section — drag and drop upload area, "Click to upload or drag and drop" text, PDF only note, Select Resume button, Generate Resume from Profile button below
- Profile Information form with clearly labeled sections:
  - Personal Info — Full Name, Email (pre-filled, not editable), Phone Number, Location, LinkedIn URL, Portfolio/GitHub, Work Authorization dropdown
  - Professional Info — Current Job Title, Experience Level dropdown, Years of Experience, Skills tag input with Add button, Industries tag input with Add button
  - Work Experience — up to 3 roles, each with Company Name, Job Title, Start Date, End Date, Currently working here checkbox, Key Responsibilities textarea. Add role button.
  - Education — Highest Degree dropdown, Field of Study, Institution Name, Graduation Year
  - Job Preferences — Job Titles Seeking, Remote Preference dropdown, Salary Expectation, Preferred Locations, Cover Letter Tone dropdown
- Save Profile button at bottom

---

### 06 Profile Save Logic

Wire profile form to InsForge DB.

**Logic:**

- Server Action in actions/profile.ts saves all form fields to profiles table
- Resume PDF uploaded to InsForge Storage at resumes/{user_id}/resume.pdf the moment it is picked, via POST /api/resume/upload (InsForge's upload() replaces an existing key — there is no upsert flag)
- resume_pdf_url saved to profiles table after upload
- is_complete set to true when all required fields are filled
- Completion percentage and missing fields calculated and saved
- Form pre-fills with existing data on return visits
- revalidatePath('/profile') called after save

---

### 07 AI Profile Extraction from Resume

Extract from Resume button — GPT-4o reads uploaded PDF and auto-fills profile form fields.

**UI:**

- Extract from Resume button appears after resume is uploaded
- Loading state while processing
- Form fields populate automatically after extraction
- User reviews and edits if needed before saving

**Logic:**

- pdf-parse extracts raw text from uploaded PDF buffer
- If extracted text is empty or too short — return error: "Could not extract text from this PDF. Please try a different file."
- GPT-4o reads extracted text and returns structured JSON matching all profile field names
- Form fields populated with extracted data
- User saves manually after reviewing

---

### 08 Resume PDF Generation from Profile

Generate a clean professional PDF resume from current profile data using GPT-4o.

**Logic:**

- POST /api/resume/generate
- Reads current profile data from profiles table
- GPT-4o generates professional resume content:
  - Professional summary paragraph
  - Polished work experience bullet points
  - Clean professional language throughout
- @react-pdf/renderer renders GPT-4o output into clean single-page PDF using renderToBuffer()
- Buffer uploaded to InsForge Storage at resumes/{user_id}/resume.pdf (upload() replaces an existing key)
- resume_pdf_url updated in profiles table

---

## Phase 3 — Find Jobs Page

### 09 Find Jobs Page — Full UI

Build the complete Find Jobs page UI with mock data. No logic yet.

**UI:**

- Search controls card at top:
  - JOB TITLE label + input with search icon placeholder "Frontend Engineer"
  - LOCATION label + input placeholder "Remote, New York..."
  - Find Jobs button with search icon
  - Success message area below controls — green banner: "Found 8 jobs and saved 4 strong matches."
- Job list section below:
  - Filter bar: text search input "Filter by company or role...", All Matches dropdown, Match Score sort dropdown
  - Jobs table with columns: COMPANY, ROLE, MATCH SCORE (color coded progress bar + percentage), SALARY EST., SOURCE (Search/URL badge), DATE FOUND
  - Pagination — "Showing 1 to 6 of 24 results", Previous, page numbers, Next

---

### 10 Adzuna Job Discovery

Agent calls Adzuna API to find jobs matching user's search criteria, scores them against user profile, saves to DB.

**Logic:**

- POST /api/agent/find receives jobTitle and location from client
- Call Adzuna API:
  - GET https://api.adzuna.com/v1/api/jobs/{country}/search/1
  - params: what={jobTitle}, where={location}, results_per_page=10, app_id, app_key
  - Detect country from location input — default to 'us'
- For each job returned:
  - Extract title, company, location, salary, description snippet, redirect_url
  - GPT-4o scores job against user profile:
    - matchScore — integer 0-100
    - matchReason — one paragraph explanation
    - matchedSkills — skills user has that job requires
    - missingSkills — skills job requires that user lacks
  - Save complete record to jobs table:
    - source: 'search'
    - run_id from agent_runs record
    - All structured fields saved
- Create agent_run record in DB
- After all jobs saved — update agent_run with total count, return success message to frontend

**PostHog events:** `job_search_started`, `job_found`

---

### 11 Filter + Sort + Pagination

Wire filter tabs, sort dropdown, text search, and pagination to real InsForge DB data.

**Logic:**

- All Matches tab — all jobs for current user
- High Match filter — jobs with match_score >= 70
- Low Match filter — jobs with match_score < 70
- Sort by Match Score — order by match_score descending
- Sort by Newest — order by found_at descending
- Sort by Oldest — order by found_at ascending
- Text search — filter by company name or job title (case insensitive)
- Pagination — 20 jobs per page, total count shown

---

## Phase 4 — Job Details Page

### 12 Job Details Page — Full UI

Build the complete job details page UI. Job data from DB is already available from Phase 3 — wire real data for all job info and match sections immediately. Company research section shows empty state only.

**UI:**

- Back to Jobs link
- Job header — company logo placeholder, job title, company name, match score badge with percentage, View Job Post button (links to redirect_url)
- Info cards row — Salary Est., Location, Job Type, Date Found
- AI Match Reasoning section — match reason paragraph from GPT-4o
- Required Skills vs Your Profile — matched skills as green badges, missing skills as red/orange badges
- Job Description section — description content from Adzuna
- Company Research card — empty state with Research Company button. After research: structured dossier with company overview, tech stack, culture, why this role, interview prep
- Apply Now button (links to redirect_url, opens in new tab)

---

# Feature 13 — Company Research Agent (Updated)

Agent researches the company using their public website and builds a structured dossier using a single Browserbase session. Three data sources fused together: company website content, job description from DB, user profile from DB.

**Logic:**

- POST /api/agent/research receives jobId
- Load job data from DB — extract company_name, job description, matched_skills, missing_skills
- Load user profile from DB — skills, experience, work history
- Derive company homepage URL by following the Adzuna redirect with server-side fetch() — no browser needed for this step:
  - fetch(redirect_url, { redirect: "follow" }) follows HTTP redirects natively before the browser opens
  - Use response.url as the real employer job page URL
  - Strip subdomain from response.url hostname (e.g. jobs.stripe.com → stripe.com)
  - Construct homepage URL as https://{rootDomain}
  - If response.url still contains "adzuna.com" or fetch throws — fall back to https://www.{company}.com (company name from DB)
  - If Stagehand gets no meaningful content (oneLiner and productSummary empty) — skip browser research entirely, proceed to GPT-4o synthesis with job description and profile only
- Open single Browserbase session with Stagehand
  **Stagehand homepage extraction:**

```typescript
const homepage = await stagehand.extract({
  instruction:
    "This is a company's homepage. Capture what the company actually does, who it's for, and any concrete signals (funding, customers, scale, mission, recent launches). Then find the internal links most worth visiting to research them as an employer.",
  schema: z.object({
    oneLiner: z.string().describe("What the company does in one sentence"),
    productSummary: z
      .string()
      .describe("What they build/sell and who it's for"),
    signals: z
      .array(z.string())
      .describe("Funding, notable customers, scale, mission, recent news"),
    pageLinks: z
      .array(
        z.object({
          url: z.string(),
          kind: z.enum([
            "about",
            "careers",
            "blog",
            "engineering",
            "product",
            "team",
            "other",
          ]),
        }),
      )
      .describe("Internal links worth visiting"),
  }),
});
```

If oneLiner and productSummary are empty — bail to synthesis with job description and profile only.

**Stagehand sub-page extraction (max 3 pages — prefer about/blog/engineering/product over careers):**

```typescript
const page = await stagehand.extract({
  instruction:
    "Extract substance that helps a candidate understand this company before applying: what they do, their values and how they work, the specific technologies and tools they use, notable projects or customers, and how the team operates. Ignore nav, footers, cookie banners, and generic marketing copy.",
  schema: z.object({
    keyPoints: z.array(z.string()),
    technologies: z
      .array(z.string())
      .describe("Specific languages, frameworks, tools, platforms"),
    valuesOrCulture: z
      .array(z.string())
      .describe("Stated values, working style, team norms"),
    notable: z
      .array(z.string())
      .describe("Customers, funding, scale, projects, awards"),
  }),
});
```

- Close Browserbase session after homepage + max 3 sub-pages
  **GPT-4o synthesis (runs after browser closes):**

System prompt:

```
You are a sharp career strategist preparing a candidate to apply for a specific role.
You are given (a) research collected from the company's own website, (b) the job posting,
and (c) the candidate's profile. Produce a concise, concrete briefing that gives this
specific candidate an edge for this specific role.

Rules:
- Ground every company claim in the provided research or job posting. Never invent
  funding, customers, headcount, or facts. If research was thin, infer carefully from
  the job posting and say what's inferred.
- Be specific to THIS candidate. Connect their actual skills and past work to this
  company's stack, product, and values. No generic advice that would apply to anyone.
- Turn the candidate's missing skills into a strategy: how to frame the gap honestly
  and what adjacent experience to lean on.
- Talking points and questions must reference real things from the research, the kind
  of detail that signals the candidate did their homework.
- Keep every item tight: one or two sentences. No fluff.

Return ONLY valid JSON.
```

User prompt feeds three data sources:

```
COMPANY RESEARCH (from their website): {companyResearch}
JOB POSTING: title, company, description, matched_skills, missing_skills
CANDIDATE PROFILE: current_title, years_experience, experience_level, skills, work_experience
```

Temperature: 0.4

**Dossier shape saved to jobs.company_research jsonb:**

```json
{
  "companyOverview": "string",
  "techStack": ["string"],
  "culture": ["string"],
  "whyThisRole": "string",
  "yourEdge": ["string"],
  "gapsToAddress": ["string"],
  "smartQuestions": ["string"],
  "interviewPrep": ["string"],
  "sources": ["string"]
}
```

- Save complete dossier to jobs.company_research jsonb column
- Always return a dossier — never fail silently. If browser research failed, GPT-4o synthesizes from job description and profile alone.
  **PostHog event:** `company_researched` — { userId, jobId, company }

---

## Job Details UI — Company Research Card (Updated)

The Company Research card on the job details page must render all 9 fields:

- **Company Overview** — paragraph
- **Tech Stack** — tag list
- **Culture** — bullet list
- **Why This Role** — paragraph
- **Your Edge** — bullet list (highlight — specific to this candidate)
- **Gaps to Address** — bullet list (reframed as strategy, not weaknesses)
- **Smart Questions** — bullet list (questions to ask in interview)
- **Interview Prep** — bullet list
- **Sources** — small text, links to pages researched

## Phase 5 — Dashboard

### 14 Dashboard Page — Full UI

Build the complete dashboard UI with mock data.
**UI:**

- Four stat cards: Total Jobs Found, Avg. Match Rate, Companies Researched, Cover Letters Generated — all showing mock numbers with trend indicators
- Recent Activity card — list of 5 activity entries with colored dots and timestamps
- Resume Tailoring Activity — bar chart (mock data, days of week)
- Jobs Found Over Time — line chart (mock data, days of week)
- Match Score Distribution — bar chart (mock data, score ranges 50-60%, 60-70%, 70-80%, 80-90%, 90-100%)
- Incomplete profile banner at top if profile not complete

---

### 15 Stats Bar — Real Data

Wire four stat cards to real InsForge DB data for current user.

**Logic:**

- Total Jobs Found — COUNT of jobs where user_id = current user
- Avg. Match Rate — AVG of match_score across all user jobs
- Companies Researched — COUNT of jobs where company_research IS NOT NULL and user_id = current user
- Jobs This Week — COUNT of jobs found in last 7 days

---

### 16 Recent Activity — Real Data

Wire recent activity list to real InsForge DB data for current user.

**Logic:**

- Query agent_runs table — most recent runs for current user
- Query jobs table — most recent company research entries for current user
- Merge and sort all by created_at descending — take last 5-10 entries
- Format each into human readable string:
  - agent_run completed → "Found X jobs for [jobTitle] — [time ago]"
  - company_research populated → "Researched [company] — [time ago]"
- Color coded dot per entry type — info blue, success green

---

### 17 Analytics Charts — PostHog Data

Wire three dashboard charts to real PostHog event data for current user.

**Logic:**

- Jobs Found Over Time — query PostHog for job_found events where distinctId = current userId, last 30 days, group by day
- Match Score Distribution — query PostHog for job_found events, extract matchScore property, group into ranges: 50-60, 60-70, 70-80, 80-90, 90-100
- Company Research Activity — query PostHog for company_researched events where distinctId = current userId, last 7 days, group by day
- All three charts rendered with recharts
- Empty state shown for each chart when no data exists yet

---

## Phase 6 — Cover Letters

### 18 Cover Letter Card — Full UI

Build the Cover Letter card on the job details page and the Cover Letter Tone control on the profile form. No generation or save logic yet — the card shows its empty state for real jobs, and the generated state is built with a mock letter and checked visually.

**UI:**

- Cover Letter card on `/find-jobs/[id]`, after Company Research and before Apply Now, same card shell as Company Research
- Header — "Cover Letter" title, Generate Cover Letter primary button (accent, `FileText` icon); once a letter exists it becomes a secondary Regenerate button
- Empty state — icon tile, "No cover letter yet", one line saying the letter uses the profile, the job and the company research when it exists
- Generated state:
  - Editable textarea holding the letter
  - Meta line — tone used and "Generated 2 hours ago"; "Edited" label once the user's changes are saved
  - Save changes button — disabled until the text is edited; "Saved" confirmation after a save
  - Copy button — label changes to "Copied" for a moment
  - Regenerate button
  - Word count
- Regenerate confirm — when the letter has edits, an inline `role="alertdialog"` panel under the row ("This replaces your edited letter.") with a secondary Cancel and a primary "Replace and regenerate", same as Generate Resume
- Loading state — button disabled, label "Writing your cover letter..."
- Error line — `role="alert"`, same style as the research error
- Cover Letter Tone dropdown in the Job Preferences section of the profile form — Formal, Casual, Enthusiastic (listed in feature 05, left out of the design)
- Optional field: it does not count toward profile completion

---

### 19 AI Cover Letter Generation

GPT-4o writes a cover letter for one saved job, in the user's chosen tone, from three sources: the job posting, the saved profile, and the company dossier when the job has been researched. The user can edit and save the letter.

**Logic:**

- `db/migrations/003_cover_letters.sql`, applied via InsForge `run-raw-sql`: add `cover_letter` (text), `cover_letter_generated_at` (timestamptz) and `cover_letter_edited_at` (timestamptz, null until the user saves an edit) to `jobs`. Existing RLS already covers them
- Profile tone saves: add `coverLetterTone` to `lib/profileSchema.ts` (enum `""`, formal, casual, enthusiastic), `lib/profileFormData.ts` and `lib/profileMapping.ts`; `inputToRowUpdate()` writes `cover_letter_tone` and its "left out on purpose" comment is removed; the form pre-fills it on return visits
- POST /api/agent/cover-letter receives jobId (zod schema `lib/coverLetterSchema.ts`, same shape as `researchSchema`)
- Auth check first — 401 if signed out
- `checkRateLimit('cover-letter:{userId}')` before any model call — 429 with the minutes to wait
- Load the job scoped to `user_id` (title, company, `about_role`, `matched_skills`, `missing_skills`, `match_reason`, `company_research`) with a new `getJobForCoverLetter()` in `lib/insforge/jobs.ts` — 404 if it is not the user's
- Load the saved profile with `getProfile()` — the saved profile, not the form on screen
- If the profile has no full name and no skills, return 422 "Complete your profile first" with a link to /profile (same pattern as `/api/agent/find`)
- `agent/coverLetter.ts` — `writeCoverLetter(job, profile)`: one GPT-4o call through the shared client in `lib/openai.ts`
  - Tone comes from `profiles.cover_letter_tone`, falling back to formal
  - If `company_research` exists, the letter may use `companyOverview`, `techStack`, `culture`, `whyThisRole` and `yourEdge`; with no research it is written from the posting and profile alone
  - Missing skills are framed honestly through adjacent experience, never hidden or invented

System prompt:

```
You are an expert career writer drafting a cover letter for one specific candidate and one specific role.
You are given (a) the job posting, (b) the candidate's profile, and (c) optionally research on the company.
Write in the requested tone.

Rules:
- Ground every claim about the candidate in the provided profile. Never invent employers, titles,
  projects, metrics, degrees or years of experience.
- Ground every claim about the company in the provided research or job posting. If research is missing,
  stay with what the posting says.
- Lead with why this role and this company, not with a summary of the resume.
- Connect two or three of the candidate's real strengths to what the role asks for.
- If a required skill is missing, do not claim it. Point to adjacent experience, or leave it out.
- 150 to 200 words (never fewer than 150), three short paragraphs, no bullet points.
- No placeholders such as [Your Name] or [Company]. Use the real names. Sign off with the candidate's full name.

Return ONLY valid JSON: { "coverLetter": "string" }
```

- User prompt feeds the three sources: `JOB POSTING`, `CANDIDATE PROFILE` (name, current_title, years_experience, skills, work_experience), `COMPANY RESEARCH` (only when present), plus `TONE`
- Temperature: 0.5
- `lib/coverLetterContent.ts` — `normalizeCoverLetter()`: untrusted GPT-4o JSON → trimmed, length-capped text; rejects empty, too-short and leftover-placeholder answers
- Save with `saveCoverLetter()`: updates `jobs.cover_letter` and `cover_letter_generated_at` and clears `cover_letter_edited_at`. Regenerate replaces the letter. Nothing is saved if GPT-4o fails
- GPT-4o is required here, so unlike research there is no fallback letter: an OpenAI outage or quota error → 503, anything else → 500 (human-readable text, never the raw error)
- Save edits: Server Action `saveCoverLetterEdits(jobId, text)` in `actions/coverLetter.ts` (a plain DB write, no model call). Validates with zod (job id, trimmed text, non-empty, length cap in `lib/coverLetter.ts`), updates `jobs.cover_letter` and sets `cover_letter_edited_at`, scoped to `user_id` and only when a letter already exists, then `revalidatePath` for the job page
- Card wiring: Generate / Regenerate posts to the route and refreshes the page the same way the research card does; the card reads the saved letter, `generated_at` and `edited_at`
- Copy copies what is on screen, including unsaved changes
- Delete the mock letter used by feature 18
- Docs when built: `architecture.md` (new route, Server Action, agent file, lib files, `jobs` columns, data flow), `progress-tracker.md`, `ui-registry.md`

**PostHog event:** `cover_letter_generated` — { userId, jobId, company } (server side with `createPostHogServer()`, shut down in the same function)

---

## Feature Count

| Phase                   | Features |
| ----------------------- | -------- |
| Phase 1 — Foundation    | 4        |
| Phase 2 — Profile       | 4        |
| Phase 3 — Find Jobs     | 3        |
| Phase 4 — Job Details   | 2        |
| Phase 5 — Dashboard     | 4        |
| Phase 6 — Cover Letters | 2        |
| **Total**               | **19**   |
