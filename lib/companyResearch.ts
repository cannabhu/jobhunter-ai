import { safeHttpUrl } from "@/lib/jobDetails";
import type { StageDef } from "@/lib/progress";
import type { CompanyDossier } from "@/types";

export const RESEARCH_PATH = "/api/agent/research";

/**
 * The steps of one research run, in order. "prepare" runs in the browser until the route's checks pass; the route and the
 * agent report the rest. "read" is skipped when no website was found or the browser was not available.
 */
export const RESEARCH_STAGES = [
  { id: "prepare", label: "Checking the job and your profile" },
  { id: "site", label: "Finding the company website" },
  { id: "read", label: "Reading company pages" },
  { id: "write", label: "Writing your briefing" },
  { id: "save", label: "Saving the briefing" },
] as const satisfies readonly StageDef[];

export type ResearchStageId = (typeof RESEARCH_STAGES)[number]["id"];

/** A run costs Browserbase minutes and several GPT-4o calls, so one user gets this many per window. */
export const RESEARCH_LIMIT = 3;
export const RESEARCH_WINDOW_MS = 10 * 60 * 1000;

export const MAX_SUB_PAGES = 3;

// Job boards and applicant-tracking systems: an Adzuna redirect often ends on one of these, and researching the
// board's own site instead of the employer's would produce a briefing about the wrong company.
const JOB_BOARD_DOMAINS = new Set([
  "adzuna.com",
  "adzuna.co.uk",
  "adzuna.ca",
  "adzuna.com.au",
  "indeed.com",
  "linkedin.com",
  "glassdoor.com",
  "ziprecruiter.com",
  "monster.com",
  "careerbuilder.com",
  "simplyhired.com",
  "jooble.org",
  "talent.com",
  "reed.co.uk",
  "totaljobs.com",
  "greenhouse.io",
  "lever.co",
  "workable.com",
  "ashbyhq.com",
  "smartrecruiters.com",
  "myworkdayjobs.com",
  "workday.com",
  "icims.com",
  "taleo.net",
  "jobvite.com",
  "bamboohr.com",
  "recruitee.com",
  "breezy.hr",
  "teamtailor.com",
  "personio.de",
  "personio.com",
  "jazzhr.com",
  "applytojob.com",
  "oraclecloud.com",
  "successfactors.com",
  "successfactors.eu",
  "dayforcehcm.com",
  "ultipro.com",
  "paylocity.com",
  "paycomonline.net",
  "rippling.com",
  "pinpointhq.com",
  "welcometothejungle.com",
  "wellfound.com",
  "angel.co",
  "dice.com",
  "builtin.com",
  "otta.com",
]);

// Public suffixes made of two labels, so "foo.co.uk" keeps three labels. Not the full Public Suffix List.
const TWO_PART_SUFFIXES = new Set([
  "co.uk",
  "org.uk",
  "ac.uk",
  "gov.uk",
  "com.au",
  "net.au",
  "org.au",
  "co.nz",
  "co.in",
  "co.za",
  "co.jp",
  "com.br",
  "com.mx",
  "com.sg",
  "com.hk",
  "com.tr",
  "com.ar",
]);

const PRIVATE_HOST_SUFFIXES = [".local", ".localhost", ".internal", ".lan", ".home", ".corp", ".home.arpa"];

const COMPANY_SUFFIX_PATTERN =
  /[\s,]+(inc|incorporated|llc|llp|ltd|limited|corp|corporation|co|company|gmbh|plc|ag|sa|bv|nv|pty|pvt|group|holdings)\.?$/i;

/** False for anything that is not an ordinary public hostname: IP literals, `localhost`, single-label and internal names. */
export function isSafePublicHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.$/, "");
  if (host === "" || host === "localhost") return false;
  if (host.includes(":") || host.startsWith("[")) return false;
  if (/^[\d.]+$/.test(host)) return false;
  if (!host.includes(".")) return false;
  return !PRIVATE_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

/** "jobs.stripe.com" becomes "stripe.com", "careers.foo.co.uk" becomes "foo.co.uk". */
export function registrableDomain(hostname: string): string {
  const labels = hostname.trim().toLowerCase().replace(/\.$/, "").split(".");
  if (labels.length <= 2) return labels.join(".");
  const lastTwo = labels.slice(-2).join(".");
  return TWO_PART_SUFFIXES.has(lastTwo) ? labels.slice(-3).join(".") : lastTwo;
}

export function isJobBoardDomain(domain: string): boolean {
  return JOB_BOARD_DOMAINS.has(domain.toLowerCase()) || domain.toLowerCase().startsWith("adzuna.");
}

/**
 * The employer's homepage (`https://{rootDomain}`) for the URL a job link finally landed on, or null when that URL is
 * not usable: not http(s), an unsafe host, or a job board / ATS / Adzuna page rather than the employer.
 */
export function homepageFromUrl(value: string): string | null {
  const href = safeHttpUrl(value);
  if (!href) return null;
  const { hostname } = new URL(href);
  if (!isSafePublicHost(hostname)) return null;
  const domain = registrableDomain(hostname);
  return isJobBoardDomain(domain) ? null : `https://${domain}`;
}

/** "Stripe, Inc." becomes "stripe"; letters and digits only. Empty when nothing usable is left. */
export function cleanCompanyName(name: string): string {
  let cleaned = name.replace(/\([^)]*\)/g, " ").trim();
  for (let pass = 0; pass < 3; pass += 1) {
    const next = cleaned.replace(COMPANY_SUFFIX_PATTERN, "").trim();
    if (next === cleaned) break;
    cleaned = next;
  }
  return cleaned.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Best-effort guess when the job link gives no employer site; null when the name is too short to guess from. */
export function fallbackHomepage(company: string): string | null {
  const name = cleanCompanyName(company);
  return name.length < 2 ? null : `https://www.${name}.com`;
}

/**
 * Reads the model's answer to "what is this company's website" (a JSON string with a `website` field) into a homepage.
 * Null for anything unusable: not JSON, no website, not http(s), an unsafe host, or a job board / ATS.
 */
export function parseWebsiteAnswer(content: string): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
  const website = (parsed as Record<string, unknown>).website;
  if (typeof website !== "string") return null;
  const text = website.trim();
  if (text === "") return null;
  return homepageFromUrl(/^https?:\/\//i.test(text) ? text : `https://${text}`);
}

type PageLink = { url: string; kind: string };

// Pages that say the most about the employer come first; careers pages mostly repeat the job post.
const KIND_PRIORITY = ["about", "product", "engineering", "blog", "team", "careers", "other"];

const pageKey = (url: URL): string => `${url.hostname}${url.pathname.replace(/\/+$/, "")}`;

/**
 * Up to `MAX_SUB_PAGES` links worth visiting, from the links the model found on the homepage (untrusted).
 * Keeps only http(s) links on the same site as the homepage, skips the homepage itself and duplicates, and takes
 * one page per kind in priority order before allowing a second of the same kind.
 */
export function pickSubPages(links: PageLink[], homepage: string): string[] {
  const home = new URL(homepage);
  const homeDomain = registrableDomain(home.hostname);
  const homeKey = pageKey(home);

  const seen = new Set<string>([homeKey]);
  const candidates: { href: string; kind: string }[] = [];
  for (const link of links) {
    // Stagehand writes "" for a link it could not map to a real address.
    if (link.url.trim() === "") continue;
    let url: URL;
    try {
      url = new URL(link.url, homepage);
    } catch {
      continue;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") continue;
    if (!isSafePublicHost(url.hostname) || registrableDomain(url.hostname) !== homeDomain) continue;
    const key = pageKey(url);
    if (seen.has(key)) continue;
    seen.add(key);
    url.hash = "";
    candidates.push({ href: url.href, kind: link.kind });
  }

  const rank = (kind: string): number => {
    const index = KIND_PRIORITY.indexOf(kind);
    return index === -1 ? KIND_PRIORITY.length : index;
  };
  const ordered = [...candidates].sort((a, b) => rank(a.kind) - rank(b.kind));

  const picked: string[] = [];
  const usedKinds = new Set<string>();
  for (const candidate of ordered) {
    if (usedKinds.has(candidate.kind)) continue;
    usedKinds.add(candidate.kind);
    picked.push(candidate.href);
    if (picked.length === MAX_SUB_PAGES) return picked;
  }
  for (const candidate of ordered) {
    if (picked.includes(candidate.href)) continue;
    picked.push(candidate.href);
    if (picked.length === MAX_SUB_PAGES) break;
  }
  return picked;
}

const MAX_PARAGRAPH_LENGTH = 700;
const MAX_ITEM_LENGTH = 300;
const MAX_TAG_LENGTH = 40;
const MAX_SOURCES = 6;

const toText = (value: unknown, maxLength: number): string =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

function toList(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const items: string[] = [];
  for (const entry of value) {
    const text = toText(entry, maxLength).replace(/^[-•*\s]+/, "");
    const key = text.toLowerCase();
    if (text === "" || seen.has(key)) continue;
    seen.add(key);
    items.push(text);
    if (items.length === maxItems) break;
  }
  return items;
}

function toSources(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const urls: string[] = [];
  for (const entry of value) {
    const href = typeof entry === "string" ? safeHttpUrl(entry.trim()) : null;
    if (href && !urls.includes(href)) urls.push(href);
    if (urls.length === MAX_SOURCES) break;
  }
  return urls;
}

/**
 * Turns an untrusted value (the model's JSON, or the stored `company_research` jsonb) into a safe dossier.
 * Returns null when there is no company overview, so a garbage answer is never saved or shown as a briefing.
 * Never throws.
 */
export function normalizeDossier(raw: unknown): CompanyDossier | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;

  const companyOverview = toText(record.companyOverview, MAX_PARAGRAPH_LENGTH);
  if (companyOverview === "") return null;

  return {
    companyOverview,
    techStack: toList(record.techStack, 12, MAX_TAG_LENGTH),
    culture: toList(record.culture, 6, MAX_ITEM_LENGTH),
    whyThisRole: toText(record.whyThisRole, MAX_PARAGRAPH_LENGTH),
    yourEdge: toList(record.yourEdge, 6, MAX_ITEM_LENGTH),
    gapsToAddress: toList(record.gapsToAddress, 5, MAX_ITEM_LENGTH),
    smartQuestions: toList(record.smartQuestions, 5, MAX_ITEM_LENGTH),
    interviewPrep: toList(record.interviewPrep, 6, MAX_ITEM_LENGTH),
    sources: toSources(record.sources),
  };
}

/**
 * Reads the model's answer (a JSON string) into a dossier. `sources` always comes from the pages the agent really
 * visited: whatever the model wrote there is ignored.
 */
export function parseModelDossier(content: string, visitedUrls: string[]): CompanyDossier | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
  return normalizeDossier({ ...parsed, sources: visitedUrls });
}
