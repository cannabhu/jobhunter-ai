import { z } from "zod";
import { COVER_LETTER_MAX_CHARS } from "@/lib/coverLetter";
import { isJobId } from "@/lib/jobDetails";

const jobId = z.string().refine(isJobId, "That job could not be found.");

/** Body of POST /api/agent/cover-letter. */
export const coverLetterSchema = z.object({ jobId });

/** Arguments of the `saveCoverLetterEdits` Server Action. */
export const saveCoverLetterSchema = z.object({
  jobId,
  text: z
    .string()
    .trim()
    .min(1, "The cover letter can't be empty.")
    .max(COVER_LETTER_MAX_CHARS, `The cover letter must be ${COVER_LETTER_MAX_CHARS} characters or fewer.`),
});
