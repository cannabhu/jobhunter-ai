import type { JobListItem, PaginationItem } from "@/types";

/** Placeholder data for feature 09. Feature 10 replaces the rows with saved jobs and feature 11 the paging. */
export const MOCK_SEARCH_MESSAGE = "Found 8 jobs and saved 4 strong matches.";

export const MOCK_JOBS: JobListItem[] = [
  { id: "1", company: "Vercel", title: "Senior Frontend Engineer", matchScore: 94, salary: "$160k - $200k", foundLabel: "2 hours ago" },
  { id: "2", company: "Stripe", title: "Staff UI Engineer", matchScore: 88, salary: "$180k - $240k", foundLabel: "Yesterday" },
  { id: "3", company: "Linear", title: "Product Engineer", matchScore: 96, salary: "$150k - $190k", foundLabel: "Yesterday" },
  { id: "4", company: "Notion", title: "Frontend Developer", matchScore: 72, salary: "$130k - $170k", foundLabel: "2 days ago" },
  { id: "5", company: "OpenAI", title: "Design Engineer", matchScore: 91, salary: "$200k - $280k", foundLabel: "3 days ago" },
  { id: "6", company: "Figma", title: "Software Engineer, Editor", matchScore: 85, salary: "$170k - $220k", foundLabel: "4 days ago" },
];

export const MOCK_PAGINATION = {
  currentPage: 1,
  pages: [1, 2, 3, "ellipsis", 8] satisfies PaginationItem[],
  from: 1,
  to: 6,
  total: 24,
};
