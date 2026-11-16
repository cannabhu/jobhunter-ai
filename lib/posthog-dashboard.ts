import { cacheLife } from "next/cache";
import {
  JOBS_CHART_DAYS,
  RESEARCH_CHART_DAYS,
  buildDailySeries,
  buildScoreDistribution,
  parseDayCounts,
  parseScoreCounts,
  recentDayKeys,
  windowStart,
  type DayLabelStyle,
} from "@/lib/dashboardCharts";
import { runHogQL } from "@/lib/posthog-query";
import type { ChartPoint } from "@/types";

// Day buckets are UTC, which is also the PostHog project's timezone. `distinct_id` is the app user id, because the
// server captures every event with `distinctId: user.id` (app/api/agent/find and app/api/agent/research).
const EVENTS_BY_DAY = `
  SELECT toString(toDate(toTimeZone(timestamp, 'UTC'))) AS day, count() AS total
  FROM events
  WHERE event = {event}
    AND distinct_id = {user_id}
    AND timestamp >= toDateTime({since}, 'UTC')
  GROUP BY day
  ORDER BY day
`;

// Whole-number scores, at most 101 rows. The bucketing happens in lib/dashboardCharts.ts.
const JOB_SCORES = `
  SELECT toInt(round(toFloat(properties.matchScore))) AS score, count() AS total
  FROM events
  WHERE event = 'job_found'
    AND distinct_id = {user_id}
    AND timestamp >= toDateTime({since}, 'UTC')
    AND properties.matchScore IS NOT NULL
  GROUP BY score
  ORDER BY score
`;

/**
 * How long a chart's answer is reused. Every dashboard load would otherwise make three calls to PostHog's query API,
 * which is rate limited per key. A good answer is reused for a minute; a failed one (null) is retried almost at once,
 * so an error is never held on screen. Entries are per user: `userId` is part of the cache key.
 */
const ANSWER_LIFETIME = { stale: 30, revalidate: 60, expire: 300 } as const;
const FAILURE_LIFETIME = "seconds";

async function fetchEventsByDay(
  name: string,
  event: "job_found" | "company_researched",
  userId: string,
  days: number,
  style: DayLabelStyle,
  now: Date,
): Promise<ChartPoint[] | null> {
  const rows = await runHogQL(name, EVENTS_BY_DAY, { event, user_id: userId, since: windowStart(days, now) });
  const counts = rows && parseDayCounts(rows);
  if (!counts) return null;
  return buildDailySeries(counts, recentDayKeys(days, now), style);
}

async function fetchScoreDistribution(userId: string, now: Date): Promise<ChartPoint[] | null> {
  const rows = await runHogQL("dashboard-score-distribution", JOB_SCORES, { user_id: userId, since: windowStart(JOBS_CHART_DAYS, now) });
  const scores = rows && parseScoreCounts(rows);
  if (!scores) return null;
  return buildScoreDistribution(scores);
}

async function readJobsByDay(userId: string): Promise<ChartPoint[] | null> {
  "use cache";
  const points = await fetchEventsByDay("dashboard-jobs-by-day", "job_found", userId, JOBS_CHART_DAYS, "date", new Date());
  if (points) cacheLife(ANSWER_LIFETIME);
  else cacheLife(FAILURE_LIFETIME);
  return points;
}

async function readResearchByDay(userId: string): Promise<ChartPoint[] | null> {
  "use cache";
  const points = await fetchEventsByDay("dashboard-research-by-day", "company_researched", userId, RESEARCH_CHART_DAYS, "weekday", new Date());
  if (points) cacheLife(ANSWER_LIFETIME);
  else cacheLife(FAILURE_LIFETIME);
  return points;
}

async function readScoreDistribution(userId: string): Promise<ChartPoint[] | null> {
  "use cache";
  const points = await fetchScoreDistribution(userId, new Date());
  if (points) cacheLife(ANSWER_LIFETIME);
  else cacheLife(FAILURE_LIFETIME);
  return points;
}

/** Turns anything unexpected (a cache failure, for example) into null, so the getters below never reject. */
function failedToNull(name: string) {
  return (error: unknown): null => {
    console.error(`[posthog-dashboard] ${name} failed: ${error instanceof Error ? error.name : "unknown error"}`);
    return null;
  };
}

/*
 * The getters never reject, so the dashboard page can start all three before its database queries finish and hand
 * the promises to the chart sections without risking an unhandled rejection.
 */

/** Jobs found per day over the last 30 days, zero-filled. Null when PostHog could not be read (logged). */
export const getJobsByDay = (userId: string): Promise<ChartPoint[] | null> => readJobsByDay(userId).catch(failedToNull("getJobsByDay"));

/** Companies researched per day over the last 7 days, zero-filled. Null when PostHog could not be read (logged). */
export const getResearchByDay = (userId: string): Promise<ChartPoint[] | null> => readResearchByDay(userId).catch(failedToNull("getResearchByDay"));

/** Jobs found in the last 30 days grouped into six score buckets. Null when PostHog could not be read (logged). */
export const getScoreDistribution = (userId: string): Promise<ChartPoint[] | null> =>
  readScoreDistribution(userId).catch(failedToNull("getScoreDistribution"));
