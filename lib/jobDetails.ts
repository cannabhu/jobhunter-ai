import type { JobDetail } from "@/types";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The `[id]` segment is untrusted; a non-UUID would make the database reject the query instead of finding nothing. */
export const isJobId = (value: string): boolean => UUID_PATTERN.test(value);

const JOB_TYPE_LABELS: Record<NonNullable<JobDetail["jobType"]>, string> = {
  fulltime: "Full-time",
  parttime: "Part-time",
  contract: "Contract",
};

/** The stored job type if it is one we know, otherwise null (the card shows a dash). */
export function parseJobType(value: string | null): JobDetail["jobType"] {
  if (value === "fulltime" || value === "parttime" || value === "contract") return value;
  return null;
}

export const jobTypeLabel = (jobType: JobDetail["jobType"]): string => (jobType ? JOB_TYPE_LABELS[jobType] : "—");

/** The URL if it is an http(s) link, otherwise null, so a stored value can never become a `javascript:` link. */
export function safeHttpUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}
