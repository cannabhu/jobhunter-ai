import { niceTicks } from "@/lib/chartTicks";
import type { ChartPoint } from "@/types";

/** Days shown by Jobs Found Over Time and by Company Research Activity (today included). */
export const JOBS_CHART_DAYS = 30;
export const RESEARCH_CHART_DAYS = 7;

export type DayLabelStyle = "weekday" | "date";

export type ScoreCount = { score: number; total: number };

const DAY_MS = 86_400_000;
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** Scores below 50 get their own bucket so the bars add up to every job found; the rest are 10 points wide. */
const SCORE_BUCKET_LABELS = ["<50%", "50-60%", "60-70%", "70-80%", "80-90%", "90-100%"] as const;
const FIRST_BUCKET_EDGE = 50;
const BUCKET_WIDTH = 10;

/** The calendar day of a date in UTC, as YYYY-MM-DD. The PostHog project runs in UTC, so its day buckets match. */
export const toDayKey = (date: Date): string => date.toISOString().slice(0, 10);

/** The last `count` UTC days as YYYY-MM-DD keys, oldest first, ending with today. */
export function recentDayKeys(count: number, now: Date = new Date()): string[] {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Array.from({ length: count }, (_, index) => toDayKey(new Date(today - (count - 1 - index) * DAY_MS)));
}

/** Where the oldest day in the window begins, formatted for HogQL's `toDateTime(value, 'UTC')`. */
export const windowStart = (count: number, now: Date = new Date()): string => `${recentDayKeys(count, now)[0]} 00:00:00`;

const LABEL_FORMAT: Record<DayLabelStyle, Intl.DateTimeFormatOptions> = {
  weekday: { weekday: "short" },
  date: { month: "short", day: "numeric" },
};

/** "Mon" or "Oct 18" for a YYYY-MM-DD key, always read in UTC. */
export function formatDayLabel(key: string, style: DayLabelStyle): string {
  return new Date(`${key}T00:00:00Z`).toLocaleDateString("en-US", { ...LABEL_FORMAT[style], timeZone: "UTC" });
}

const isCount = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0;

/**
 * Reads the per-day query answer, rows of `[day, total]`, into a day → count map.
 * Returns null when any row has the wrong shape, so a bad answer shows an error instead of wrong numbers.
 */
export function parseDayCounts(rows: unknown): Map<string, number> | null {
  if (!Array.isArray(rows)) return null;

  const counts = new Map<string, number>();
  for (const row of rows as unknown[]) {
    if (!Array.isArray(row)) return null;
    const [day, total] = row as unknown[];
    if (typeof day !== "string" || !DAY_KEY.test(day) || !isCount(total)) return null;
    counts.set(day, (counts.get(day) ?? 0) + total);
  }
  return counts;
}

/** One point per day in the window, oldest first, with 0 for days that had no events. Days outside the window are ignored. */
export function buildDailySeries(counts: Map<string, number>, dayKeys: string[], style: DayLabelStyle): ChartPoint[] {
  return dayKeys.map((key) => ({ label: formatDayLabel(key, style), value: counts.get(key) ?? 0 }));
}

/**
 * Reads the score query answer, rows of `[score, total]`, into typed rows.
 * Returns null when any row has the wrong shape.
 */
export function parseScoreCounts(rows: unknown): ScoreCount[] | null {
  if (!Array.isArray(rows)) return null;

  const parsed: ScoreCount[] = [];
  for (const row of rows as unknown[]) {
    if (!Array.isArray(row)) return null;
    const [score, total] = row as unknown[];
    if (typeof score !== "number" || !Number.isFinite(score) || !isCount(total)) return null;
    parsed.push({ score, total });
  }
  return parsed;
}

/** Which bucket a whole-number score falls in: "<50%" is 0, "50-60%" is 1 … "90-100%" is 5 (100 counts as 90-100). */
export function scoreBucketIndex(score: number): number {
  if (score < FIRST_BUCKET_EDGE) return 0;
  return Math.min(SCORE_BUCKET_LABELS.length - 1, 1 + Math.floor((score - FIRST_BUCKET_EDGE) / BUCKET_WIDTH));
}

/** The six score buckets with how many jobs fall in each. Scores outside 0-100 are not valid scores and are skipped. */
export function buildScoreDistribution(rows: ScoreCount[]): ChartPoint[] {
  const totals = SCORE_BUCKET_LABELS.map(() => 0);
  for (const { score, total } of rows) {
    if (score < 0 || score > 100) continue;
    totals[scoreBucketIndex(score)] += total;
  }
  return SCORE_BUCKET_LABELS.map((label, index) => ({ label, value: totals[index] }));
}

/** False when every point is zero, which is the chart's empty state. */
export const hasChartData = (points: ChartPoint[]): boolean => points.some((point) => point.value > 0);

/** Y-axis ticks that fit the highest value in the series. */
export const chartYTicks = (points: ChartPoint[]): number[] => niceTicks(Math.max(0, ...points.map((point) => point.value)));
