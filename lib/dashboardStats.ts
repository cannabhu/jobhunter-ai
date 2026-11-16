import type { DashboardStatsRow, StatCardData } from "@/types";

const NO_VALUE = "—";
const TREND_LABEL = "vs last week";

const isCount = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0;

/** A numeric column that may be null. PostgREST sends `numeric` as a number, but a string is accepted too. */
function readAverage(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const number = typeof value === "string" ? Number(value) : value;
  return typeof number === "number" && Number.isFinite(number) ? number : null;
}

/**
 * Turns the `dashboard_stats` rpc answer (one row, or an array holding it) into a safe row.
 * Returns null for anything that doesn't look right, so a bad answer shows dashes instead of wrong numbers.
 */
export function parseDashboardStats(data: unknown): DashboardStatsRow | null {
  const row: unknown = Array.isArray(data) ? data[0] : data;
  if (typeof row !== "object" || row === null) return null;

  const { total_jobs, jobs_week_ago, avg_match, avg_match_week_ago, researched, jobs_this_week } = row as Record<string, unknown>;
  if (!isCount(total_jobs) || !isCount(jobs_week_ago) || !isCount(researched) || !isCount(jobs_this_week)) return null;

  return {
    totalJobs: total_jobs,
    jobsWeekAgo: jobs_week_ago,
    avgMatch: readAverage(avg_match),
    avgMatchWeekAgo: readAverage(avg_match_week_ago),
    researched,
    jobsThisWeek: jobs_this_week,
  };
}

/** Whole-number percent change from `before` to `now`; null when there is nothing to compare with. */
export function percentChange(now: number, before: number | null): number | null {
  if (before === null || before <= 0) return null;
  return Math.round(((now - before) / before) * 100);
}

function trendFooter(change: number | null, fallbackNote: string): StatCardData["footer"] {
  if (change === null) return { kind: "note", text: fallbackNote };
  const tone = change > 0 ? "up" : change < 0 ? "down" : "flat";
  const text = `${change > 0 ? "+" : ""}${change}%`;
  return { kind: "trend", change: text, tone, label: TREND_LABEL };
}

/**
 * The four stat cards. A trend badge appears only when there was something a week ago to compare with;
 * otherwise the card shows a short note, like the two cards in the design that never have a trend.
 */
export function buildStatCards(stats: DashboardStatsRow | null): StatCardData[] {
  const empty = stats === null;
  const avg = stats?.avgMatch ?? null;

  return [
    {
      label: "Total Jobs Found",
      value: empty ? NO_VALUE : stats.totalJobs.toLocaleString("en-US"),
      footer: empty ? { kind: "note", text: "All time" } : trendFooter(percentChange(stats.totalJobs, stats.jobsWeekAgo), "All time"),
    },
    {
      label: "Avg. Match Rate",
      value: avg === null ? NO_VALUE : `${Math.round(avg)}%`,
      footer:
        empty || avg === null
          ? { kind: "note", text: "Across all jobs" }
          : trendFooter(percentChange(avg, stats.avgMatchWeekAgo), "Across all jobs"),
    },
    {
      label: "Companies Researched",
      value: empty ? NO_VALUE : stats.researched.toLocaleString("en-US"),
      footer: { kind: "note", text: "Total researched" },
    },
    {
      label: "Jobs This Week",
      value: empty ? NO_VALUE : stats.jobsThisWeek.toLocaleString("en-US"),
      footer: { kind: "note", text: "New this week" },
    },
  ];
}
