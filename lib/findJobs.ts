export const FIND_JOBS_PATH = "/api/agent/find";

export const MAX_SEARCH_TEXT_LENGTH = 100;

/** Each search can make up to 10 GPT-4o calls, so one user gets this many per window. */
export const FIND_LIMIT = 5;
export const FIND_WINDOW_MS = 10 * 60 * 1000;

export const PROFILE_NEEDS_DATA_ERROR =
  "Add your skills and current job title to your profile first, so we can score jobs against it.";
