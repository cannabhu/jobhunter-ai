import type { createInsforgeServer } from "@/lib/insforge/server";
import { parseDashboardStats } from "@/lib/dashboardStats";
import { type ActivityResearch, type ActivityRun, buildActivityEntries, RECENT_ACTIVITY_LIMIT } from "@/lib/recentActivity";
import type { ActivityEntry, DashboardStatsRow } from "@/types";

type InsforgeServer = Awaited<ReturnType<typeof createInsforgeServer>>;

/**
 * The user's dashboard numbers from the `dashboard_stats` database function (db/migrations/002_dashboard_stats.sql).
 * Null on a database error or an unexpected answer (logged), so the page still renders with dashes.
 */
export async function getDashboardStats(insforge: InsforgeServer, userId: string): Promise<DashboardStatsRow | null> {
  try {
    const { data, error } = await insforge.database.rpc("dashboard_stats", { p_user_id: userId });
    if (error) throw error;

    const stats = parseDashboardStats(data);
    if (!stats) throw new Error("dashboard_stats returned an unexpected shape.");
    return stats;
  } catch (error) {
    console.error("[lib/insforge/getDashboardStats]", error);
    return null;
  }
}

type RunRow = {
  id: string;
  job_title_searched: string | null;
  jobs_found: number | null;
  started_at: string | null;
  completed_at: string | null;
};

type ResearchRow = {
  id: string;
  company: string;
  researched_at: string | null;
};

/**
 * The user's latest activity: finished search runs plus researched companies, merged newest first.
 * Each source is limited to the feed size, since the merged feed can never need more than that from either one.
 * An empty list on a database error (logged), so the page still renders.
 */
export async function getRecentActivity(insforge: InsforgeServer, userId: string): Promise<ActivityEntry[]> {
  try {
    const [runs, research] = await Promise.all([
      insforge.database
        .from("agent_runs")
        .select("id, job_title_searched, jobs_found, started_at, completed_at")
        .eq("user_id", userId)
        .eq("status", "completed")
        .order("completed_at", { ascending: false, nullsFirst: false })
        .limit(RECENT_ACTIVITY_LIMIT),
      insforge.database
        .from("jobs")
        .select("id, company, researched_at")
        .eq("user_id", userId)
        .not("researched_at", "is", null)
        .order("researched_at", { ascending: false })
        .limit(RECENT_ACTIVITY_LIMIT),
    ]);
    if (runs.error) throw runs.error;
    if (research.error) throw research.error;

    // The selects above list exactly these columns, so the rows have these shapes.
    const runItems: ActivityRun[] = ((runs.data ?? []) as RunRow[]).map((row) => ({
      id: row.id,
      jobTitleSearched: row.job_title_searched,
      jobsFound: row.jobs_found,
      at: row.completed_at ?? row.started_at,
    }));
    const researchItems: ActivityResearch[] = ((research.data ?? []) as ResearchRow[]).map((row) => ({
      id: row.id,
      company: row.company,
      researchedAt: row.researched_at,
    }));

    return buildActivityEntries(runItems, researchItems);
  } catch (error) {
    console.error("[lib/insforge/getRecentActivity]", error);
    return [];
  }
}
