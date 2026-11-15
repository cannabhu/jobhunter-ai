/** Where a signed-in user lands after login and what the homepage CTAs link to. */
export const SIGNED_IN_HOME = { href: "/dashboard", label: "Go to Dashboard" } as const;

export const FIND_JOBS_PAGE_PATH = "/find-jobs";

export const jobDetailPath = (jobId: string): string => `${FIND_JOBS_PAGE_PATH}/${jobId}`;
