import type { createInsforgeServer } from "@/lib/insforge/server";
import { formatFoundLabel } from "@/lib/relativeTime";
import type { JobListPage } from "@/types";

type InsforgeServer = Awaited<ReturnType<typeof createInsforgeServer>>;

/** Rows on the Find Jobs page until feature 11 adds paging. */
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

/** The user's saved jobs, newest first, plus the total count. An empty page on error, so the page still renders. */
export async function listJobs(insforge: InsforgeServer, userId: string): Promise<JobListPage> {
  try {
    const { data, error, count } = await insforge.database
      .from("jobs")
      .select("id, company, title, match_score, salary, found_at", { count: "exact" })
      .eq("user_id", userId)
      .order("found_at", { ascending: false })
      .limit(JOBS_PAGE_SIZE);
    if (error) throw error;

    const rows = (data ?? []) as ListedJobRow[];
    return {
      jobs: rows.map((row) => ({
        id: row.id,
        company: row.company,
        title: row.title,
        matchScore: row.match_score ?? 0,
        salary: row.salary,
        foundLabel: formatFoundLabel(row.found_at),
      })),
      total: count ?? rows.length,
    };
  } catch (error) {
    console.error("[lib/insforge/listJobs]", error);
    return { jobs: [], total: 0 };
  }
}
