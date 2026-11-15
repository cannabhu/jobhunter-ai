import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { ResumeGenerationUnavailableError, writeResumeCopy } from "@/agent/resumeWriter";
import { getProfile } from "@/lib/insforge/profile";
import { downloadResume } from "@/lib/insforge/resumeStorage";
import { createInsforgeServer, getUser } from "@/lib/insforge/server";
import { rowToFormValues } from "@/lib/profileMapping";
import { checkRateLimit } from "@/lib/rateLimit";
import { GENERATE_LIMIT, GENERATE_WINDOW_MS, RESUME_NEEDS_DATA_ERROR } from "@/lib/resume";
import { buildResumeContent, hasEnoughForResume } from "@/lib/resumeContent";
import { renderResumePdf } from "@/lib/resumeDocument";
import type { GenerateResumeResponse } from "@/types";

// Waits between read-back attempts after an upload (about 5s in total), longer than a normal View request would wait.
const VERIFY_RETRY_DELAYS_MS = [500, 1500, 3000];

// The OpenAI call can take ~45s on a slow response; give the route room on platforms that enforce a limit.
export const maxDuration = 60;

const fail = (error: string, status: number) =>
  NextResponse.json<GenerateResumeResponse>({ success: false, error }, { status });

/** Builds a one-page PDF from the signed-in user's saved profile and replaces their resume with it. */
export async function POST() {
  try {
    const user = await getUser();
    if (!user) return fail("Your session has expired. Please sign in again.", 401);

    // Before the model call, so a rejected request costs nothing.
    const limit = checkRateLimit(`resume-generate:${user.id}`, GENERATE_LIMIT, GENERATE_WINDOW_MS);
    if (!limit.allowed) {
      const minutes = Math.max(1, Math.ceil(limit.retryAfterMs / 60_000));
      return fail(`You've generated several resumes recently. Please try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`, 429);
    }

    const profile = await getProfile();
    if (!profile) return fail("We couldn't load your profile. Please try again.", 500);

    // The saved profile, not the form on screen: unsaved edits are not part of the resume.
    const values = rowToFormValues(profile);
    if (!hasEnoughForResume(values)) return fail(RESUME_NEEDS_DATA_ERROR, 422);

    const writing = await writeResumeCopy(values);
    const content = buildResumeContent(values, writing);
    const buffer = await renderResumePdf(content);

    const insforge = await createInsforgeServer();
    // The key comes from the session user, never from the request. Uploading to an existing key replaces it.
    const { data: uploaded, error: uploadError } = await insforge.storage
      .from("resumes")
      .upload(`${user.id}/resume.pdf`, new Blob([new Uint8Array(buffer)], { type: "application/pdf" }));
    if (uploadError || !uploaded) throw uploadError ?? new Error("Upload returned no data");

    // The page offers a "View" link the moment this returns, and a read can fail briefly right after a replace.
    // Wait until the new file is readable so that link works. If it still isn't, the file is saved anyway: the
    // failure is already logged and the View route retries on its own, so don't fail the generation over it.
    await downloadResume(insforge, user.id, "resume/generate", VERIFY_RETRY_DELAYS_MS);

    const { data: updated, error: updateError } = await insforge.database
      .from("profiles")
      .update({ resume_pdf_url: uploaded.url })
      .eq("id", user.id)
      .select("id");
    if (updateError) throw updateError;
    if (!updated || updated.length === 0) throw new Error("Profile update matched no rows");

    revalidatePath("/profile");
    return NextResponse.json<GenerateResumeResponse>({ success: true });
  } catch (error) {
    // Already logged by the writer, in a form that leaves out the response headers.
    if (error instanceof ResumeGenerationUnavailableError) {
      return fail("Generating your resume is temporarily unavailable. Please try again later.", 503);
    }
    console.error("[resume/generate]", error);
    return fail("We couldn't generate your resume. Please try again.", 500);
  }
}
