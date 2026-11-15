import { z } from "zod";
import { isJobId } from "@/lib/jobDetails";

export const researchSchema = z.object({
  jobId: z.string().refine(isJobId, "That job could not be found."),
});
