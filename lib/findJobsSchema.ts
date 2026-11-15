import { z } from "zod";
import { MAX_SEARCH_TEXT_LENGTH } from "@/lib/findJobs";

/** Body of `POST /api/agent/find`. Location is optional; an empty one searches everywhere. */
export const findJobsSchema = z.object({
  jobTitle: z
    .string()
    .trim()
    .min(1, "Enter a job title to search for.")
    .max(MAX_SEARCH_TEXT_LENGTH, `Job title must be ${MAX_SEARCH_TEXT_LENGTH} characters or fewer.`),
  location: z
    .string()
    .trim()
    .max(MAX_SEARCH_TEXT_LENGTH, `Location must be ${MAX_SEARCH_TEXT_LENGTH} characters or fewer.`)
    .default(""),
});

export type FindJobsInput = z.infer<typeof findJobsSchema>;
