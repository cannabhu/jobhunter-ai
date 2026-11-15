export type AdzunaCountry = "us" | "gb" | "ca" | "au";

export type AdzunaJob = {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  description: string;
  redirect_url: string;
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted?: "0" | "1";
  contract_type?: string;
  contract_time?: string;
  created?: string;
  category?: { tag: string; label: string };
};

/** Adzuna could not be reached or refused the call (bad credentials, rate limit, outage). Not the user's fault. */
export class AdzunaUnavailableError extends Error {}

const RESULTS_PER_PAGE = "10";
const ADZUNA_TIMEOUT_MS = 15_000;

// Whole words and phrases only, so "ca" never matches inside "Chicago". Anything unlisted falls back to "us".
const COUNTRY_KEYWORDS: Record<Exclude<AdzunaCountry, "us">, string[]> = {
  gb: [
    "uk",
    "u.k.",
    "united kingdom",
    "great britain",
    "britain",
    "england",
    "scotland",
    "wales",
    "northern ireland",
    "london",
    "manchester",
    "birmingham",
    "edinburgh",
    "glasgow",
    "bristol",
    "leeds",
    "liverpool",
    "cardiff",
    "belfast",
    "cambridge uk",
  ],
  ca: [
    "canada",
    "toronto",
    "vancouver",
    "montreal",
    "montréal",
    "ottawa",
    "calgary",
    "edmonton",
    "winnipeg",
    "quebec",
    "ontario",
    "british columbia",
    "alberta",
  ],
  au: [
    "australia",
    "sydney",
    "melbourne",
    "brisbane",
    "perth",
    "adelaide",
    "canberra",
    "new south wales",
    "victoria australia",
    "queensland",
  ],
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const COUNTRY_PATTERNS = (Object.entries(COUNTRY_KEYWORDS) as [Exclude<AdzunaCountry, "us">, string[]][]).map(
  ([country, keywords]) => ({
    country,
    pattern: new RegExp(`(?:^|[^\\p{L}])(?:${keywords.map(escapeRegExp).join("|")})(?![\\p{L}])`, "iu"),
  }),
);

/** Guesses the Adzuna country from the free-text location. "Remote", empty and unknown places are "us". */
export function detectCountry(location: string): AdzunaCountry {
  const match = COUNTRY_PATTERNS.find(({ pattern }) => pattern.test(location));
  return match?.country ?? "us";
}

const CURRENCY_SYMBOL: Record<AdzunaCountry, string> = { us: "$", gb: "£", ca: "$", au: "$" };

const toThousands = (amount: number): number => Math.round(amount / 1000);

/** "$120k - $150k" when both ends exist, "$120k+" for a lone minimum, null when there is nothing usable. */
export function formatSalary(min: number | undefined, max: number | undefined, country: AdzunaCountry): string | null {
  const symbol = CURRENCY_SYMBOL[country];
  const low = typeof min === "number" && Number.isFinite(min) && min > 0 ? toThousands(min) : null;
  const high = typeof max === "number" && Number.isFinite(max) && max > 0 ? toThousands(max) : null;
  if (low !== null && high !== null && high > low) return `${symbol}${low}k - ${symbol}${high}k`;
  if (low !== null && high !== null) return `${symbol}${low}k`;
  if (low !== null) return `${symbol}${low}k+`;
  if (high !== null) return `${symbol}${high}k`;
  return null;
}

/** Maps Adzuna's contract fields to the jobs.job_type values: fulltime, parttime or contract. */
export function toJobType(job: Pick<AdzunaJob, "contract_type" | "contract_time">): "fulltime" | "parttime" | "contract" {
  if (job.contract_type === "contract") return "contract";
  if (job.contract_time === "part_time") return "parttime";
  return "fulltime";
}

type AdzunaResponse = { results?: unknown };

const isAdzunaJob = (value: unknown): value is AdzunaJob => {
  if (typeof value !== "object" || value === null) return false;
  // Narrowed to a non-null object above; the casts only let us read unknown fields before checking each one.
  const job = value as Record<string, unknown>;
  const company = job.company as { display_name?: unknown } | undefined;
  const location = job.location as { display_name?: unknown } | undefined;
  return (
    (typeof job.id === "string" || typeof job.id === "number") &&
    typeof job.title === "string" &&
    typeof job.description === "string" &&
    typeof job.redirect_url === "string" &&
    typeof company?.display_name === "string" &&
    typeof location?.display_name === "string"
  );
};

/** Searches Adzuna's IT jobs. `where` is left out when the location is empty. Server context only. */
export async function searchJobs(jobTitle: string, location: string, country: AdzunaCountry): Promise<AdzunaJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_API_KEY;
  if (!appId || !appKey) throw new AdzunaUnavailableError("Adzuna credentials are not configured");

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    what: jobTitle,
    category: "it-jobs",
    results_per_page: RESULTS_PER_PAGE,
    "content-type": "application/json",
  });
  if (location) params.set("where", location);

  let response: Response;
  try {
    response = await fetch(`https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(ADZUNA_TIMEOUT_MS),
    });
  } catch (error) {
    // The URL carries the credentials, so the fetch error itself is not passed on; only its network code
    // (ENOTFOUND, ETIMEDOUT, ...) is, so a DNS or timeout problem is not mistaken for a bad key.
    const cause = error instanceof Error ? error.cause : undefined;
    const code =
      typeof cause === "object" && cause !== null && "code" in cause
        ? String(cause.code)
        : error instanceof Error
          ? error.name
          : "unknown";
    throw new AdzunaUnavailableError(`Adzuna request failed (${code})`);
  }

  if (!response.ok) throw new AdzunaUnavailableError(`Adzuna API error: ${response.status}`);

  const data: AdzunaResponse = await response.json().catch(() => ({}));
  if (!Array.isArray(data.results)) return [];

  // Adzuna ids arrive as strings, but normalise so a numeric id can never break the external_id comparison.
  return data.results.filter(isAdzunaJob).map((job) => ({ ...job, id: String(job.id) }));
}
