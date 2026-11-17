import { formatActivityLabel } from "@/lib/relativeTime";
import { jobDetailPath } from "@/lib/routes";
import type { ActivityEntry } from "@/types";

/** Entries shown in the Recent Activity card (the design shows five). */
export const RECENT_ACTIVITY_LIMIT = 5;

/** A finished search run, as read from `agent_runs`. */
export type ActivityRun = {
  id: string;
  jobTitleSearched: string | null;
  jobsFound: number | null;
  /** When the run finished; the start time stands in for a run that never recorded an end. */
  at: string | null;
};

/** A job whose company was researched, as read from `jobs`. */
export type ActivityResearch = {
  id: string;
  company: string;
  researchedAt: string | null;
};

type Dated = { entry: ActivityEntry; time: number };

const plural = (count: number, noun: string): string => `${count} ${noun}${count === 1 ? "" : "s"}`;

function runMessage(run: ActivityRun): string {
  const count = Number.isInteger(run.jobsFound) && (run.jobsFound ?? 0) >= 0 ? (run.jobsFound ?? 0) : 0;
  const title = run.jobTitleSearched?.trim();
  return title ? `Found ${plural(count, "job")} for ${title}` : `Found ${plural(count, "job")}`;
}

/**
 * Merges finished search runs and researched companies into one feed, newest first, at most `limit` entries.
 * Search runs are green (success) and research is blue (info), as in the build plan. A row with a missing or
 * unreadable timestamp, or an empty company name, is left out rather than shown with a wrong time.
 */
export function buildActivityEntries(
  runs: ActivityRun[],
  researched: ActivityResearch[],
  now: number = Date.now(),
  limit: number = RECENT_ACTIVITY_LIMIT,
): ActivityEntry[] {
  const dated: Dated[] = [];

  for (const run of runs) {
    const time = run.at ? Date.parse(run.at) : Number.NaN;
    if (Number.isNaN(time) || !run.at) continue;
    dated.push({
      time,
      entry: { id: `run-${run.id}`, message: runMessage(run), timeLabel: formatActivityLabel(run.at, now), tone: "success" },
    });
  }

  for (const job of researched) {
    const time = job.researchedAt ? Date.parse(job.researchedAt) : Number.NaN;
    const company = job.company.trim();
    if (Number.isNaN(time) || !job.researchedAt || !company) continue;
    dated.push({
      time,
      entry: {
        id: `research-${job.id}`,
        message: `Researched ${company}`,
        timeLabel: formatActivityLabel(job.researchedAt, now),
        tone: "info",
        href: jobDetailPath(job.id),
      },
    });
  }

  // Newest first; the id breaks a tie so the order never flips between renders.
  dated.sort((a, b) => b.time - a.time || a.entry.id.localeCompare(b.entry.id));
  return dated.slice(0, limit).map(({ entry }) => entry);
}
