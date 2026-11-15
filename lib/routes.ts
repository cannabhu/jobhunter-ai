/**
 * Where a signed-in user lands after login and what the homepage CTAs link to.
 * The dashboard (feature 14) doesn't exist yet, so this is the profile page until then.
 * When /dashboard ships, change both fields here and nothing else.
 */
export const SIGNED_IN_HOME = { href: "/profile", label: "Go to Profile" } as const;

export const FIND_JOBS_PAGE_PATH = "/find-jobs";

export const jobDetailPath = (jobId: string): string => `${FIND_JOBS_PAGE_PATH}/${jobId}`;
