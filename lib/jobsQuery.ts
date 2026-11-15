import { MAX_SEARCH_TEXT_LENGTH } from "@/lib/findJobs";
import { FIND_JOBS_PAGE_PATH } from "@/lib/routes";
import type { JobSort, JobsQuery, MatchFilter } from "@/types";

export const MATCH_FILTERS: readonly MatchFilter[] = ["all", "high", "low"];
export const JOB_SORTS: readonly JobSort[] = ["match", "newest", "oldest"];

export const DEFAULT_JOBS_QUERY: JobsQuery = { query: "", match: "all", sort: "match", page: 1 };

/** Stops a hand-typed `?page=99999999999` from becoming a huge offset. */
const MAX_PAGE = 100_000;

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function pickOption<T extends string>(value: string | undefined, options: readonly T[], fallback: T): T {
  return options.find((option) => option === value) ?? fallback;
}

function parsePage(value: string | undefined): number {
  if (value === undefined || !/^\d+$/.test(value)) return DEFAULT_JOBS_QUERY.page;
  return Math.min(Math.max(Number(value), 1), MAX_PAGE);
}

/** URL search params are user input: anything unknown or malformed falls back to the default. */
export function parseJobsQuery(raw: RawSearchParams): JobsQuery {
  return {
    query: (firstValue(raw.q) ?? "").trim().slice(0, MAX_SEARCH_TEXT_LENGTH),
    match: pickOption(firstValue(raw.match), MATCH_FILTERS, DEFAULT_JOBS_QUERY.match),
    sort: pickOption(firstValue(raw.sort), JOB_SORTS, DEFAULT_JOBS_QUERY.sort),
    page: parsePage(firstValue(raw.page)),
  };
}

/** The Find Jobs URL for a query. Defaults are left out, so the unfiltered page is a clean `/find-jobs`. */
export function buildJobsHref(query: JobsQuery): string {
  const params = new URLSearchParams();
  if (query.query) params.set("q", query.query);
  if (query.match !== DEFAULT_JOBS_QUERY.match) params.set("match", query.match);
  if (query.sort !== DEFAULT_JOBS_QUERY.sort) params.set("sort", query.sort);
  if (query.page > DEFAULT_JOBS_QUERY.page) params.set("page", String(query.page));

  const search = params.toString();
  return search ? `${FIND_JOBS_PAGE_PATH}?${search}` : FIND_JOBS_PAGE_PATH;
}

/**
 * The PostgREST `or` filter for "company or title contains this text, any case".
 * The text is user input, so `%`, `_` and `\` are escaped for LIKE, then the whole pattern is
 * double-quoted so commas and parentheses can't break the filter syntax (`"` and `\` escaped again).
 */
export function buildTextSearchFilter(text: string): string {
  const likePattern = `%${text.replace(/[\\%_]/g, "\\$&")}%`;
  const quoted = `"${likePattern.replace(/[\\"]/g, "\\$&")}"`;
  return `company.ilike.${quoted},title.ilike.${quoted}`;
}

/** True when any filter narrows the list (sort and page do not). */
export function hasActiveFilters(query: JobsQuery): boolean {
  return query.query !== "" || query.match !== DEFAULT_JOBS_QUERY.match;
}
