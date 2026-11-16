# Library Docs

Project-specific usage patterns for every third party library in this project. This file only covers how we use each library in this specific project — rules, patterns, and constraints specific to JobPilot.

Read the relevant section before implementing any feature that touches these libraries.

---

## Before Using Any Library

Before implementing any feature that uses a third party library:

1. **Check AGENTS.md** at the project root — it lists every skill installed for this project and how to use them. Skills contain up-to-date API documentation, usage patterns, and best practices specific to this codebase.

2. **Check if an MCP server is configured** for that library. Some tools have MCP servers that give the AI agent direct access to documentation, logs, and debugging tools. If an MCP server is available — use it before falling back to general knowledge.

3. **Read this file** for project-specific patterns that override general library knowledge.

The order of authority is:

```
MCP server (real-time docs) → Skills via AGENTS.md → This file (project rules) → General training knowledge
```

Never rely on general training knowledge alone for library APIs — they change frequently and training data may be outdated.

---

## InsForge

**Check first:** Check AGENTS.md for an installed InsForge skill. If an InsForge MCP server is configured — use it. The skill/MCP will have the latest API patterns.

### Client vs Server

Package is `@insforge/sdk` — the SSR helpers live at `@insforge/sdk/ssr` (there is no `@insforge/ssr` package). Env: `NEXT_PUBLIC_INSFORGE_URL`, `NEXT_PUBLIC_INSFORGE_ANON_KEY` (read automatically by the SSR helpers).

```typescript
// lib/insforge/client.ts — browser context only (reads the SSR session; no auth mutations)
import { createBrowserClient } from "@insforge/sdk/ssr";
export const insforge = createBrowserClient();
```

```typescript
// lib/insforge/server.ts — server context only
import { cookies } from "next/headers";
import { createServerClient } from "@insforge/sdk/ssr";

export const createInsforgeServer = async () =>
  createServerClient({ cookies: await cookies() });
```

**Rules:**

- Browser client — Client Components, browser-side session reads, realtime subscriptions
- Server client — Server Components, API routes, Server Actions, agent functions
- Never use browser client in server context
- Never use server client in browser context
- Auth mutations (sign in/out, OAuth) run on the server via `createAuthActions` so tokens stay in httpOnly cookies
- Session refresh runs in `proxy.ts` via `updateSession` from `@insforge/sdk/ssr/middleware`

---

### Auth

```typescript
// Get current user in server context (helper: lib/insforge/server.ts → getUser())
const insforge = await createInsforgeServer();
const { data } = await insforge.auth.getCurrentUser();
const user = data?.user;
if (!user) redirect("/login");
```

With `cacheComponents`, reading the session must sit behind `<Suspense>`.

---

### DB Queries

```typescript
// Read
const { data, error } = await insforge
  .from("jobs")
  .select("*")
  .eq("user_id", user.id)
  .order("found_at", { ascending: false });

// Insert
const { data, error } = await insforge
  .from("jobs")
  .insert({ user_id: user.id, title, company, match_score })
  .select()
  .single();

// Update
const { error } = await insforge
  .from("jobs")
  .update({ company_research: dossier })
  .eq("id", jobId)
  .eq("user_id", user.id); // always scope to user
```

**Rules:**

- Always scope queries to `user_id` — never query without user filter
- Always handle the `error` return — never assume success
- Use `.single()` when expecting exactly one row

**Filtering, sorting and paging (feature 11, probed against the live API):**

- `database.from()` is `@supabase/postgrest-js`, so `.or()`, `.not()`, `.range()` and `select(..., { count: "exact" })` all work, although the InsForge docs list only the simple filters. There is **no `.and()`** on the builder.
- **One `.or()` per query.** A second `.or()` fails to parse (400 `PGRST100`). Put the OR you need in the single call and express any other condition with a plain filter such as `.lt()` or `.gte()`.
- **Escaping user text in `.or()`:** escape `\`, `%` and `_` for LIKE, wrap the whole pattern in double quotes, and escape `"` and `\` inside the quotes. An unquoted comma or parenthesis breaks the filter (`buildTextSearchFilter` in `lib/jobsQuery.ts`).
- **A `.range()` past the last row returns a 416 error (`error.code === "PGRST103"`), not an empty array.** Catch it and fall back to the last page.
- `order("col", { ascending: false })` puts NULLs first; pass `nullsFirst: false`. Add a final `.order("id")` when paging so ties can't reorder between pages.

---

### RPC (database functions)

```typescript
const { data, error } = await insforge.database.rpc("dashboard_stats", { p_user_id: user.id });
// data is an array with one row, because the function RETURNS TABLE
```

- Functions live in `db/migrations/` and are applied with `run-raw-sql`. Make them `security invoker` so RLS still applies, take `p_user_id` and filter by it, `revoke all ... from public` and `grant execute ... to authenticated`. The anon key gets `42501 permission denied`, which is the quickest way to prove the function name resolves without a session.
- Use one for aggregates (counts, averages): a plain select is capped at 1000 rows by PostgREST. Read the answer through a parser (`parseDashboardStats`), never cast it; `numeric` columns arrive as JSON numbers but a string is tolerated.

---

### Storage

```typescript
// Upload file (server context). Takes a File or Blob — there is no upsert option:
// uploading to an existing key replaces that object.
const { data, error } = await insforge.storage
  .from("resumes")
  .upload(`${userId}/resume.pdf`, file); // data.url, data.key, data.size

// Read a file back (server context) — returns a Blob
const { data: blob, error } = await insforge.storage
  .from("resumes")
  .download(`${userId}/resume.pdf`);
```

**Storage paths:**

- Base resume: `resumes/{user_id}/resume.pdf`

**Rules:**

- The `resumes` bucket is **private** — browsers cannot open its URLs. Read files on the server (`download()`) and stream them through an authenticated route (`app/api/resume/file/route.ts`); never use `getPublicUrl` for it
- Build the key from the session user (`getUser()`), never from request input
- Re-uploading to the same key replaces the file — no `upsert` flag exists
- `profiles.resume_pdf_url` stores the URL `upload()` returns, but only as a "resume exists" marker
- Never write files to disk — upload the File/Blob (or a buffer wrapped in a Blob) directly
- Read the resume through `downloadResume()` (`lib/insforge/resumeStorage.ts`), never `storage.download()` directly. A download is two steps (signed link, then a fetch of it) and the fetch can fail briefly right after an object is replaced; the helper retries, logs the real status and code on every failed attempt, and returns the final status. Routes map **404 → "not found"** and anything else → **502 "try again"**, so a storage failure is never reported as a missing file

---

## Adzuna API

**Check first:** Check AGENTS.md for an installed Adzuna skill. If none exists — use this file and the official Adzuna API docs.

### Job Search

```typescript
// lib/adzuna.ts
export async function searchJobs(
  jobTitle: string,
  location: string,
  country: string = "us",
): Promise<AdzunaJob[]> {
  const params = new URLSearchParams({
    app_id: process.env.ADZUNA_APP_ID!,
    app_key: process.env.ADZUNA_API_KEY!,
    what: jobTitle,
    category: "it-jobs", // always filter to IT jobs
    results_per_page: "10",
    "content-type": "application/json",
  });

  // Only add where if location is provided
  if (location) {
    params.set("where", location);
  }

  const response = await fetch(
    `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`,
  );

  if (!response.ok) {
    throw new Error(`Adzuna API error: ${response.status}`);
  }

  const data = await response.json();
  return data.results || [];
}
```

### Response Shape

Each Adzuna job result contains:

```typescript
type AdzunaJob = {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  description: string; // snippet only — not full description
  redirect_url: string; // Adzuna tracking URL → redirects to actual job
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted: "0" | "1"; // "1" means salary is estimated
  contract_type?: string;
  created: string; // ISO date string
  category: { tag: string; label: string };
};
```

### Saving Jobs to DB

```typescript
// Map Adzuna result to jobs table
const jobRecord = {
  user_id: userId,
  run_id: runId,
  source: "search", // always 'search' for Adzuna jobs
  source_url: job.redirect_url,
  // external_apply_url stays null: Adzuna's redirect_url is not a direct company link (see architecture.md)
  title: job.title,
  company: job.company.display_name,
  location: job.location.display_name,
  salary: formatSalary(job.salary_min, job.salary_max, country), // lib/adzuna.ts; salary_max can be missing
  job_type: job.contract_type || "fulltime",
  about_role: job.description, // Adzuna returns snippet — used as description
  match_score: scoredJob.matchScore,
  match_reason: scoredJob.matchReason,
  matched_skills: scoredJob.matchedSkills,
  missing_skills: scoredJob.missingSkills,
  found_at: new Date().toISOString(),
};
```

**Rules:**

- Always include `category=it-jobs` — never search Adzuna without this filter
- Never pass `where` if location is empty — omit the parameter entirely
- `source` is always `'search'` for Adzuna jobs — never any other value
- `salary_is_predicted: "1"` means Adzuna estimated the salary — this is normal
- Adzuna description is a snippet — GPT-4o scores from it, not a full description
- Default country to `'us'` — support `gb`, `au`, `ca` as alternatives

---

## Browserbase

**Check first:** Check AGENTS.md for an installed Browserbase skill (none is installed at the moment). Use the Stagehand docs (docs.stagehand.dev/v4) and the installed types in `node_modules/@browserbasehq/stagehand/dist/index.d.mts`; the API changed between v3 and v4.

### Session creation — company research

Stagehand v4 (installed: 4.4.x) creates the session itself. There is no `lib/browserbase.ts`, no `bb.sessions.create` and no `browserbaseSessionID`.

```typescript
import { browserbase } from "@browserbasehq/stagehand";

const browser = await browserbase.launch({
  apiKey: process.env.BROWSERBASE_API_KEY!,
  projectId: process.env.BROWSERBASE_PROJECT_ID,
  api_timeout: 120, // seconds; the session is ended by Browserbase after this (minimum 60)
  browserSettings: { allowedDomains: ["example.com"] }, // main-frame navigations only; subdomains allowed
});
```

**Important — the route drives the browser.** Stagehand runs in our API route and every `goto`/`extract` is a call the route waits on, so the route needs `export const maxDuration = 120` (`app/api/agent/research/route.ts`). A run is about 25s per page.

**Rules:**

- Always use single sessions — never parallel sessions (free plan limit)
- `api_timeout` is 120 seconds; the agent stops starting pages after a 70s budget and closes the session at 85s (`agent/research.ts`)
- Always end sessions cleanly — `await stagehand.close()` then `await browser.close()`, in a `finally`
- Project ID always from `process.env.BROWSERBASE_PROJECT_ID` — never hardcode
- Restrict navigation with `allowedDomains` to the company's own domain
- `next.config.ts` lists `@browserbasehq/stagehand` in `serverExternalPackages` (bundling it fails)
- `zod` is pinned to exactly the version Stagehand pins (4.6.6); a second copy breaks the schema types

---

## Stagehand

**Check first:** Check AGENTS.md for an installed Stagehand skill (none is installed at the moment). Read the installed types before using an option.

### Initialisation

```typescript
import { browserbase, Stagehand } from "@browserbasehq/stagehand";

const browser = await browserbase.launch({ apiKey, projectId, api_timeout: 120 });
const stagehand = await Stagehand.create({
  browser,
  model: { modelName: "openai/gpt-4o", apiKey: process.env.OPENAI_API_KEY! }, // "provider/model" names only
  logging: { level: "off" }, // its CDP chatter is harmless; failures still throw
});
const [page] = await browser.context.pages(); // pages() is async
```

### extract()

`extract(instruction, zodSchema, options?)` — positional arguments, and the result is `{ data }`.

```typescript
import { z } from "zod";

const { data } = await stagehand.extract(
  "Extract the company overview and the internal links most worth visiting.",
  z.object({
    oneLiner: z.string(),
    pageLinks: z.array(z.object({ url: z.string().url(), kind: z.string() })),
  }),
  { page, timeout: 30_000 },
);
```

**Link fields must be `z.string().url()`.** Stagehand has the model pick an element and maps it to the real address only for URL fields; with a plain `z.string()` the value comes back as an element id such as `0-2448`.

### act()

```typescript
// Always wrap in try/catch
try {
  await stagehand.act("Click the About link in the navigation");
} catch (error) {
  // log to agent_logs and continue
}
```

### Company Research Pattern

Three-step process: homepage extraction → sub-page extraction → GPT-4o synthesis.
Job description and user profile come from DB — never re-fetch what you already have.
Browser's only job is the company website.

```typescript
// Step 1 — Homepage extraction (positional arguments; the result is { data })
const { data: homepageData } = await stagehand.extract(
  "This is a company's homepage. Capture what the company actually does, who it's for, and any concrete signals (funding, customers, scale, mission, recent launches). Then find the internal links most worth visiting to research them as an employer.",
  z.object({
    oneLiner: z.string().describe("What the company does in one sentence"),
    productSummary: z.string().describe("What they build/sell and who it's for"),
    signals: z.array(z.string()).describe("Funding, notable customers, scale, mission, recent news"),
    pageLinks: z
      .array(
        z.object({
          url: z.string().url(), // .url() so Stagehand returns real addresses, not element ids
          kind: z.string().describe("One of: about, careers, blog, engineering, product, team, other"),
        }),
      )
      .describe("Internal links worth visiting"),
  }),
  { page, timeout: 30_000 },
);

// If oneLiner and productSummary are empty — wrong site or parked domain
// Skip to synthesis with job description and profile only

// Step 2 — Sub-page extraction (max 3, prefer about/product/engineering/blog over careers: pickSubPages())
const { data: subPageData } = await stagehand.extract(
  "Extract substance that helps a candidate understand this company before applying: what they do, their values and how they work, the specific technologies and tools they use, notable projects or customers, and how the team operates. Ignore nav, footers, cookie banners, and generic marketing copy.",
  z.object({
    keyPoints: z.array(z.string()),
    technologies: z.array(z.string()).describe("Specific languages, frameworks, tools, platforms"),
    valuesOrCulture: z.array(z.string()).describe("Stated values, working style, team norms"),
    notable: z.array(z.string()).describe("Customers, funding, scale, projects, awards"),
  }),
  { page, timeout: 30_000 },
);

// Step 3 — GPT-4o synthesis (after browser closes)
// Feed three data sources: company research + job from DB + profile from DB
const systemPrompt = `You are a sharp career strategist preparing a candidate to apply for a specific role. You are given (a) research collected from the company's own website, (b) the job posting, and (c) the candidate's profile. Produce a concise, concrete briefing that gives this specific candidate an edge for this specific role.

Rules:
- Ground every company claim in the provided research or job posting. Never invent funding, customers, headcount, or facts. If research was thin, infer carefully from the job posting and say what's inferred.
- Be specific to THIS candidate. Connect their actual skills and past work to this company's stack, product, and values. No generic advice that would apply to anyone.
- Turn the candidate's missing skills into a strategy: how to frame the gap honestly and what adjacent experience to lean on.
- Talking points and questions must reference real things from the research, the kind of detail that signals the candidate did their homework.
- Keep every item tight: one or two sentences. No fluff.

Return ONLY valid JSON matching this shape:
{
  "companyOverview": string,
  "techStack": string[],
  "culture": string[],
  "whyThisRole": string,
  "yourEdge": string[],
  "gapsToAddress": string[],
  "smartQuestions": string[],
  "interviewPrep": string[],
  "sources": string[]
}`;

const userPrompt = `COMPANY RESEARCH (from their website):
${JSON.stringify(companyResearch)}

JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}
Matched skills (already computed): ${job.matched_skills.join(", ")}
Missing skills (already computed): ${job.missing_skills.join(", ")}

CANDIDATE PROFILE:
Current title: ${profile.current_title}
Experience: ${profile.years_experience} years, level ${profile.experience_level}
Skills: ${profile.skills.join(", ")}
Work history: ${JSON.stringify(profile.work_experience)}`;

const response = await openai.chat.completions.create({
  model: "gpt-4o",
  response_format: { type: "json_object" },
  temperature: 0.4,
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ],
});
```

**Dossier fields:**

| Field           | Type     | Purpose                                             |
| --------------- | -------- | --------------------------------------------------- |
| companyOverview | string   | What the company does                               |
| techStack       | string[] | Technologies they use                               |
| culture         | string[] | Values and working style                            |
| whyThisRole     | string   | Why this role exists                                |
| yourEdge        | string[] | Specific links between THIS candidate and this role |
| gapsToAddress   | string[] | Missing skills reframed as strategy                 |
| smartQuestions  | string[] | Questions that show real research                   |
| interviewPrep   | string[] | Topics to prepare for this role                     |
| sources         | string[] | Pages the company info came from                    |

**Rules:**

- Always use `extract()` with a Zod schema — never parse raw HTML or use regex
- Always wrap every `act()` and `extract()` in try/catch
- Always call `await stagehand.close()` then `await browser.close()` in a `finally` — ends the Browserbase session
- Model is always `gpt-4o` — never use other models
- Temperature is `0.4` for synthesis — grounded but flexible enough to make real connections
- Max 3 sub-pages — never exceed this on free plan
- Always close session in finally block — never leave sessions open even if research fails
- Job description and profile always come from DB — never re-fetch via browser
- If browser research returns empty — still run synthesis with job + profile only
- yourEdge, gapsToAddress, and smartQuestions are the most valuable fields — never skip them
- `sources` is filled by code from the pages actually visited, never from the model's answer, and the model is not asked for it; the model's JSON goes through `parseModelDossier()` (`lib/companyResearch.ts`) before it is saved
- Synthesis uses `max_tokens` 1400: 800 cuts the dossier JSON off; a `finish_reason` of `length` is treated as unusable
- The employer's homepage is found by following the Adzuna `source_url` server-side and skipping job boards and ATS domains (`homepageFromUrl`), with `https://www.{company}.com` as the fallback

## OpenAI GPT-4o

**Check first:** Check AGENTS.md for an installed OpenAI skill. The skill will have the latest API patterns and model capabilities.

### Structured JSON Response

```typescript
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const response = await openai.chat.completions.create({
  model: "gpt-4o",
  response_format: { type: "json_object" },
  temperature: 0.3,
  messages: [
    {
      role: "system",
      content: "You are a job matching assistant. Return only valid JSON.",
    },
    {
      role: "user",
      content: `Your prompt here`,
    },
  ],
});

const result = JSON.parse(response.choices[0].message.content!);
```

**Temperature settings:**

- `0.3` — matching, scoring, extraction, research synthesis — deterministic results
- `0.7` — resume generation — natural variation

**Max tokens:**

- Job matching + scoring: `300`
- Company research synthesis: `1400` (800 truncates the dossier JSON)
- Resume generation: `1000` (the model returns only a summary and short bullets; the PDF facts come from the DB)
- Profile extraction from resume: `1500` (800 truncates the JSON for a resume with three roles)

**Rules:**

- Model string is always `'gpt-4o'` — never use other model names
- Use the shared client from `lib/openai.ts` (module level, `timeout: 45_000`, `maxRetries: 1`); never construct another. The SDK defaults (10 minutes, 2 retries) leave the UI spinning and delay quota/auth failures
- Catch `APIError` around every call and log `status`, `code` and `requestID` only — logging the error object dumps the response headers, including cookies. Throw a typed error so the route can return 503 instead of a generic 500
- Every route that makes a paid model call checks `checkRateLimit` (`lib/rateLimit.ts`) after the session check and before any work
- Always use `response_format: { type: 'json_object' }` for structured data
- Always parse `response.choices[0].message.content` as string — even with json_object it returns a string
- Always validate parsed JSON before using — wrap in try/catch
- Match threshold is always `MATCH_THRESHOLD` from `lib/utils.ts` — never hardcode 70
- Company research synthesis must always return a complete dossier — never return empty even if browser research failed

---

## PostHog

**Check first:** Check AGENTS.md for an installed PostHog skill. If a PostHog MCP server is configured — use it. The skill/MCP will have the latest client and server patterns.

### Client Setup (Browser)

```typescript
// instrumentation-client.ts — Next.js runs this on every page load; no provider needed.
import posthog from "posthog-js";

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
  capture_exceptions: true,
});

// Capture event client-side
posthog.capture("job_found", {
  userId,
  source: "search",
  matchScore: score,
});
```

### Server Setup

```typescript
// lib/posthog-server.ts
import { PostHog } from "posthog-node";

export const createPostHogServer = () =>
  new PostHog(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
    flushAt: 1, // send immediately
    flushInterval: 0, // no batching — Next.js functions are short-lived
  });

// Always use and shutdown in the same function
const posthog = createPostHogServer();
posthog.capture({
  distinctId: userId,
  event: "company_researched",
  properties: { userId, jobId, company },
});
await posthog.shutdown(); // required — ensures event is sent
```

**Rules:**

- Always call `await posthog.shutdown()` in server-side functions — events are lost without it
- `flushAt: 1` and `flushInterval: 0` always set on server client
- Event names must match exactly the list in `code-standards.md`
- Always include `userId` as a property on every server-side event
- Call `posthog.identify(userId)` after login on client side
- Call `posthog.reset()` on logout on client side

### Reading events back (dashboard charts, feature 17)

Reading needs a **personal API key** with query read access (`POSTHOG_PERSONAL_API_KEY`); the project token above can only send events. The query API lives on the app host, not the ingestion host: `POSTHOG_API_HOST` is `https://eu.posthog.com` (this project is on the EU cloud) and not `https://eu.i.posthog.com`.

```typescript
// lib/posthog-query.ts — server only
POST {POSTHOG_API_HOST}/api/projects/{POSTHOG_PROJECT_ID}/query/
Authorization: Bearer {POSTHOG_PERSONAL_API_KEY}
{ "name": "dashboard-jobs-by-day", "query": { "kind": "HogQLQuery", "query": "SELECT ... WHERE distinct_id = {user_id}", "values": { "user_id": "..." } } }
// response: { "results": [[...], ...] }
```

**Rules:**

- Filter every query by `distinct_id = {user_id}` with the id from `getUser()`. The server captures each event with `distinctId: user.id`. Pass it in `values`, never into the SQL text
- Always bound the time: `timestamp >= toDateTime({since}, 'UTC')`. Group days with `toString(toDate(toTimeZone(timestamp, 'UTC')))`; the project timezone is UTC. `toDate()` takes one argument only
- `matchScore` is numeric on `job_found`: `toInt(round(toFloat(properties.matchScore)))`. Aggregate in the query (at most 101 score rows) and bucket in TypeScript so the bucketing is testable
- `runHogQL` returns `null` on any failure and logs the status and error code only, never the key or the response body. Parse the rows strictly (`parseDayCounts`, `parseScoreCounts`); a bad row means an error state, not a wrong number
- Each chart read is a `'use cache'` function keyed by `userId`: an answer is reused for 60 seconds (`{ stale: 30, revalidate: 60, expire: 300 }`) so a dashboard load is not three API calls; a failed read (null) calls `cacheLife("seconds")` so an error is retried almost at once and never held on screen. `cacheLife` takes a profile name or an object, not a union, so branch with `if` / `else`. With the default in-memory handler a serverless host may not reuse entries between requests
- The exported getters (`getJobsByDay` and the other two) never reject (`.catch` to null), so the dashboard page starts all three before its database queries finish and passes the promises to the chart sections
- The key must be a personal API key (`phx_`). `runHogQL` warns once if it starts with `phc_` (project token), `phs_` (project secret key) or anything else, still sends the request, and adds a hint to every 401 / 403 log line
- The PostHog MCP (`execute-sql`, `query-trends`) is for exploring and checking the data while building. The app cannot use it; it calls the REST endpoint above

---

## Recharts

**Check first:** No Recharts skill or MCP server is installed. Installed: v3.x. Used only for the three dashboard charts (`components/dashboard/*Chart.tsx`).

```tsx
"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

<ResponsiveContainer width="100%" height="100%">
  <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
    <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="4 4" />
    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--color-chart-axis)", fontSize: 12 }} />
    <YAxis ticks={[0, 3, 6, 9, 12]} domain={[0, 12]} axisLine={false} tickLine={false} />
    <Bar dataKey="value" fill="var(--color-info)" maxBarSize={40} />
  </BarChart>
</ResponsiveContainer>
```

**Rules:**

- Every chart file is a Client Component (`"use client"`); the page stays a Server Component and passes plain data arrays (`ChartPoint[]`) in.
- Recharts takes SVG props, not class names, so colours are CSS variables (`var(--color-info)`), never hex. Shared axis, grid and tooltip styles live in `components/dashboard/chartStyles.ts`. The gradient under the line uses `stopColor="var(--color-accent)"` with `stopOpacity`.
- `ResponsiveContainer` needs a parent with a definite size. `ChartCard` provides one: a `relative min-h-[280px] flex-1` box holding an `absolute inset-0` child. Do not put a chart in a plain auto-height div.
- Y-axis ticks are passed in as `yTicks`, derived from the data by `chartYTicks()` / `niceTicks()` (`lib/chartTicks.ts`): whole numbers from 0 to a round number at or above the highest value. The 30-day chart sets `interval="preserveStartEnd"` and `minTickGap` on the `XAxis` so the labels don't overlap.

---

## @react-pdf/renderer

**Check first:** Check AGENTS.md for an installed react-pdf skill. PDF generation APIs can differ from general training knowledge.

### Resume PDF Generation

```typescript
import { renderToBuffer } from '@react-pdf/renderer'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica' },
  section: { marginBottom: 10 },
  heading: { fontSize: 14, fontWeight: 'bold' },
  text: { fontSize: 10 },
})

const ResumePDF = ({ profile }: { profile: Profile }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.heading}>{profile.fullName}</Text>
        <Text style={styles.text}>{profile.email}</Text>
      </View>
    </Page>
  </Document>
)

// Generate buffer
const buffer = await renderToBuffer(<ResumePDF profile={profile} />)

// Upload directly to InsForge Storage
await insforge.storage
  .from('resumes')
  .upload(`${userId}/resume.pdf`, new Blob([buffer], { type: 'application/pdf' }))
```

**Supported CSS properties:**
Only use these — others are silently ignored:
`padding, margin, fontSize, color, fontFamily, flexDirection, alignItems, justifyContent, borderRadius, width, height, fontWeight, textAlign, lineHeight`

**Rules:**

- Server-side only — never import in client components
- Always use `renderToBuffer` — not `renderToStream` or `PDFDownloadLink`
- PDF generation only in `app/api/resume/` routes
- Generated buffer uploaded directly to InsForge Storage — never written to disk
- Always save the returned upload URL to `profiles.resume_pdf_url` after upload (a marker only — the bucket is private)

**As built (feature 08, v4.9):**

- The layout lives in `lib/resumeDocument.tsx` and the route calls `renderResumePdf(content)`. It calls the component as a plain function, because `renderToBuffer` is typed to take the `<Document>` element itself; passing `<ResumeDocument />` fails to type-check.
- The buffer is wrapped as `new Blob([new Uint8Array(buffer)], { type: "application/pdf" })` for the upload.
- No hex colors: a PDF has no CSS variables, so use named colors (`black`, `dimgray`).
- Built-in Helvetica only (Latin characters). `letterSpacing`, `textTransform`, `borderBottomWidth` and `lineHeight` all work, so the "supported properties" list above is a minimum, not a ceiling. Set a `lineHeight` on any large text, otherwise it overlaps the line below.
- To confirm one page, count `/Type /Page` objects in the buffer (`/Pages` is excluded by the `\b`); `pdf-parse`'s `getText().total` agrees.

---

## pdf-parse

**Check first:** Check AGENTS.md for an installed pdf-parse skill.

### Extract Text from Uploaded Resume

```typescript
import pdf from "pdf-parse";

// In API route handling resume upload
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("resume") as File;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const pdfData = await pdf(buffer);
  const extractedText = pdfData.text; // raw text content

  // Send to GPT-4o for structured extraction
}
```

**Rules:**

- Server-side only — never import in client components
- `pdfData.text` is raw unformatted text — GPT-4o handles the structure extraction
- Always handle parse errors — some PDFs are image-based and return empty text
- If `pdfData.text` is empty or very short — return error to user: "Could not extract text from this PDF. Please try a different file."

**Installed version is v2 (2.4.x), which has a different API from the snippet above:**

```typescript
import { PDFParse } from "pdf-parse";

const parser = new PDFParse({ data: buffer }); // Buffer or Uint8Array
try {
  const { text } = await parser.getText(); // includes "-- 1 of N --" page markers
} finally {
  await parser.destroy().catch(() => undefined);
}
```

- `next.config.ts` lists `serverExternalPackages: ["pdf-parse"]` so Next doesn't bundle its pdf.js worker.
- A corrupt or non-PDF buffer makes `getText()` throw — catch it and treat it as "no text".
- Used in `app/api/resume/extract/route.ts` (feature 07), which reads the user's stored PDF, not a file from the request.
