import type { StageDef } from "@/lib/progress";

export const FIND_JOBS_PATH = "/api/agent/find";

/**
 * The steps of one search, in order. "prepare" runs in the browser until the route's checks pass; the agent reports the rest.
 * "score" is skipped when every job found was already saved, and "save" when nothing could be scored.
 */
export const FIND_JOBS_STAGES = [
  { id: "prepare", label: "Checking your profile" },
  { id: "search", label: "Searching Adzuna" },
  { id: "score", label: "Scoring new jobs" },
  { id: "save", label: "Saving jobs" },
] as const satisfies readonly StageDef[];

export type FindJobsStageId = (typeof FIND_JOBS_STAGES)[number]["id"];

export const MAX_SEARCH_TEXT_LENGTH = 100;

/** Each search can make up to 10 GPT-4o calls, so one user gets this many per window. */
export const FIND_LIMIT = 5;
export const FIND_WINDOW_MS = 10 * 60 * 1000;

export const PROFILE_NEEDS_DATA_ERROR =
  "Add your skills and current job title to your profile first, so we can score jobs against it.";
