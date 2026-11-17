"use server";

import { revalidatePath } from "next/cache";
import { COVER_LETTER_SAVE_FAILED } from "@/lib/coverLetter";
import { cleanLetterText } from "@/lib/coverLetterContent";
import { saveCoverLetterSchema } from "@/lib/coverLetterSchema";
import { saveEditedCoverLetter } from "@/lib/insforge/jobs";
import { createInsforgeServer, getUser } from "@/lib/insforge/server";
import type { SaveCoverLetterResult } from "@/types";

/** Saves the user's own changes to a job's cover letter. A plain database write: no model call, and it never creates a letter. */
export async function saveCoverLetterEdits(jobId: string, text: string): Promise<SaveCoverLetterResult> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Your session has expired. Please sign in again." };

    // A Server Action is a public endpoint, so its arguments are checked like any request body.
    const parsed = saveCoverLetterSchema.safeParse({ jobId, text: typeof text === "string" ? cleanLetterText(text) : text });
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? COVER_LETTER_SAVE_FAILED };

    const insforge = await createInsforgeServer();
    const saved = await saveEditedCoverLetter(insforge, user.id, parsed.data.jobId, parsed.data.text);
    if (!saved) return { success: false, error: "There is no cover letter to save changes to. Generate one first." };

    revalidatePath(`/find-jobs/${parsed.data.jobId}`);
    return { success: true, text: parsed.data.text };
  } catch (error) {
    console.error("[actions/coverLetter]", error);
    return { success: false, error: COVER_LETTER_SAVE_FAILED };
  }
}
