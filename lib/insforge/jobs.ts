import type { createInsforgeServer } from "@/lib/insforge/server";
import { parseJobType, safeHttpUrl } from "@/lib/jobDetails";
import { buildTextSearchFilter } from "@/lib/jobsQuery";
import { formatFoundLabel } from "@/lib/relativeTime";
import { MATCH_THRESHOLD } from "@/lib/utils";
import type { JobDetail, JobListPage, JobsQuery } from "@/types";

type InsforgeServer = Awaited<ReturnType<typeof createInsforgeServer>>;

/** Rows per page on the Find Jobs table. */
export const JOBS_PAGE_SIZE = 20;

type SavedJobRow = {
  external_id: string | null;
  match_score: number | null;
};

/** Which of these Adzuna ids the user already saved, with the score each got. Throws on a database error. */
export async function getSavedJobScores(
  insforge: InsforgeServer,
  userId: string,
  externalIds: string[],
): Promise<Map<string, number>> {
  const scores = new Map<string, number>();
  if (externalIds.length === 0) return scores;

  const { data, error } = await insforge.database
    .from("jobs")
    .select("external_id, match_score")
    .eq("user_id", userId)
    .in("external_id", externalIds);
  if (error) throw error;

  for (const row of (data ?? []) as SavedJobRow[]) {
    if (row.external_id !== null) scores.set(row.external_id, row.match_score ?? 0);
  }
  return scores;
}

type ListedJobRow = {
  id: string;
  company: string;
  title: string;
  match_score: number | null;
  salary: string | null;
  found_at: string;
};

type FetchedPage = {
  rows: ListedJobRow[];
  /** Null when the page lies past the last row, which PostgREST answers with a 416 instead of an empty list. */
  total: number | null;
};

const PAGE_PAST_END_CODE = "PGRST103";

async function fetchPage(
  insforge: InsforgeServer,
  userId: string,
  query: JobsQuery,
  page: number,
): Promise<FetchedPage> {
  const from = (page - 1) * JOBS_PAGE_SIZE;

  let request = insforge.database
    .from("jobs")
    .select("id, company, title, match_score, salary, found_at", { count: "exact" })
    .eq("user_id", userId);

  // A second .or() call fails to parse on this backend, so Low Match is a plain .lt(). That skips rows with
  // a null score, which can't exist: the agent only inserts jobs it managed to score.
  if (query.query) request = request.or(buildTextSearchFilter(query.query));
  if (query.match === "high") request = request.gte("match_score", MATCH_THRESHOLD);
  if (query.match === "low") request = request.lt("match_score", MATCH_THRESHOLD);

  // The final id sort keeps page boundaries stable when scores or timestamps tie (one search saves many jobs at once).
  request =
    query.sort === "match"
      ? request.order("match_score", { ascending: false, nullsFirst: false }).order("found_at", { ascending: false })
      : request.order("found_at", { ascending: query.sort === "oldest" });

  const { data, error, count } = await request.order("id").range(from, from + JOBS_PAGE_SIZE - 1);
  if (error?.code === PAGE_PAST_END_CODE) return { rows: [], total: null };
  if (error) throw error;

  const rows = (data ?? []) as ListedJobRow[];
  return { rows, total: count ?? rows.length };
}

function toJobListPage(fetched: FetchedPage, page: number): JobListPage {
  return {
    jobs: fetched.rows.map((row) => ({
      id: row.id,
      company: row.company,
      title: row.title,
      matchScore: row.match_score ?? 0,
      salary: row.salary,
      foundLabel: formatFoundLabel(row.found_at),
    })),
    total: fetched.total ?? 0,
    page,
  };
}

/**
 * One page of the user's saved jobs for the given filter, sort and page, plus how many jobs match in all.
 * A page past the end (a stale link, or filters that now match fewer jobs) returns the last page instead.
 * An empty page on error, so the page still renders.
 */
export async function listJobs(insforge: InsforgeServer, userId: string, query: JobsQuery): Promise<JobListPage> {
  try {
    const requested = await fetchPage(insforge, userId, query, query.page);
    if (requested.total !== null) return toJobListPage(requested, query.page);

    const firstPage = await fetchPage(insforge, userId, query, 1);
    const lastPage = Math.max(1, Math.ceil((firstPage.total ?? 0) / JOBS_PAGE_SIZE));
    if (lastPage === 1) return toJobListPage(firstPage, 1);

    return toJobListPage(await fetchPage(insforge, userId, query, lastPage), lastPage);
  } catch (error) {
    console.error("[lib/insforge/listJobs]", error);
    return { jobs: [], total: 0, page: 1 };
  }
}

type JobDetailRow = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  salary: string | null;
  job_type: string | null;
  about_role: string | null;
  match_score: number | null;
  match_reason: string | null;
  matched_skills: string[] | null;
  missing_skills: string[] | null;
  source_url: string | null;
  found_at: string;
};

/**
 * One of the user's saved jobs, or null when it doesn't exist or belongs to someone else (the user filter and RLS
 * make both look the same). Throws on a database error, so a failed query is never shown as "not found".
 */
export async function getJobDetail(insforge: InsforgeServer, userId: string, jobId: string): Promise<JobDetail | null> {
  const { data, error } = await insforge.database
    .from("jobs")
    .select(
      "id, title, company, location, salary, job_type, about_role, match_score, match_reason, matched_skills, missing_skills, source_url, found_at",
    )
    .eq("id", jobId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  // The select above lists exactly these columns, so the row has this shape.
  const row = data as JobDetailRow;
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    location: row.location,
    salary: row.salary,
    jobType: parseJobType(row.job_type),
    aboutRole: row.about_role,
    matchScore: row.match_score ?? 0,
    matchReason: row.match_reason,
    matchedSkills: row.matched_skills ?? [],
    missingSkills: row.missing_skills ?? [],
    sourceUrl: safeHttpUrl(row.source_url),
    foundLabel: formatFoundLabel(row.found_at),
  };
}
