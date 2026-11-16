const REQUEST_TIMEOUT_MS = 8_000;
const PERSONAL_KEY_PREFIX = "phx_";

type QueryValues = Record<string, string | number>;

let warnedAboutKey = false;

/**
 * PostHog has several keys that look alike and only a personal API key can read data. A project token (phc_) or a
 * project secret key (phs_) is rejected with a 403, which looks like an outage, so name the mistake once per process.
 * The request is still sent: a new key format should not be blocked by this check.
 */
function warnIfNotPersonalKey(apiKey: string): void {
  if (warnedAboutKey || apiKey.startsWith(PERSONAL_KEY_PREFIX)) return;
  warnedAboutKey = true;

  const kind = apiKey.startsWith("phc_") ? "a project token (phc_)" : apiKey.startsWith("phs_") ? "a project secret key (phs_)" : "not a personal API key";
  console.error(
    `[posthog-query] POSTHOG_PERSONAL_API_KEY looks like ${kind}, and only a personal API key (${PERSONAL_KEY_PREFIX}…) can read data. ` +
      "Create one under PostHog > Account settings > Personal API keys with the Query: Read scope.",
  );
}

/**
 * Runs one HogQL query through PostHog's query API and returns its `results` rows, or null on any failure.
 *
 * Reading events needs a personal API key with query-read scope. The project token in
 * NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN can only send events. Every failure is logged (status and error code only,
 * never the key, headers or the response body) so a chart shows an error state instead of breaking the page.
 *
 * Put user-controlled values in `values` and reference them as `{name}` in the query. Never build them into the SQL text.
 */
export async function runHogQL(name: string, query: string, values: QueryValues): Promise<unknown[] | null> {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  const host = process.env.POSTHOG_API_HOST;

  if (!apiKey || !projectId || !host) {
    const missing = [!apiKey && "POSTHOG_PERSONAL_API_KEY", !projectId && "POSTHOG_PROJECT_ID", !host && "POSTHOG_API_HOST"].filter(Boolean).join(", ");
    console.error(`[posthog-query] ${missing} is missing, so dashboard charts cannot be loaded. Check .env.local.`);
    return null;
  }

  warnIfNotPersonalKey(apiKey);

  try {
    const response = await fetch(`${host.replace(/\/$/, "")}/api/projects/${encodeURIComponent(projectId)}/query/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name, query: { kind: "HogQLQuery", query, values } }),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      const code = typeof body === "object" && body !== null && "code" in body ? String((body as { code: unknown }).code) : "unknown";
      const hint = response.status === 401 || response.status === 403 ? " (check that POSTHOG_PERSONAL_API_KEY is a personal API key with query read access)" : "";
      console.error(`[posthog-query] ${name} failed: status ${response.status}, code ${code}${hint}`);
      return null;
    }

    const body: unknown = await response.json();
    const results = typeof body === "object" && body !== null ? (body as { results?: unknown }).results : undefined;
    if (!Array.isArray(results)) {
      console.error(`[posthog-query] ${name} returned no results array`);
      return null;
    }
    return results as unknown[];
  } catch (error) {
    // Timeouts and network failures. Log the error name only: the message can echo the URL.
    console.error(`[posthog-query] ${name} request failed: ${error instanceof Error ? error.name : "unknown error"}`);
    return null;
  }
}
