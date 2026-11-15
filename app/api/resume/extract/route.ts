import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { extractProfileFromResumeText, ResumeExtractionUnavailableError } from "@/agent/resumeExtractor";
import { downloadResume } from "@/lib/insforge/resumeStorage";
import { createInsforgeServer, getUser } from "@/lib/insforge/server";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  EXTRACT_LIMIT,
  EXTRACT_WINDOW_MS,
  MIN_RESUME_TEXT_LENGTH,
  RESUME_UNREADABLE_ERROR,
} from "@/lib/resume";
import type { ExtractResumeResponse } from "@/types";

// The OpenAI call can take ~45s on a slow response; give the route room on platforms that enforce a limit.
export const maxDuration = 60;

const fail = (error: string, status: number) =>
  NextResponse.json<ExtractResumeResponse>({ success: false, error }, { status });

/** Pulls plain text out of a PDF. Returns "" when the file can't be parsed (corrupt, encrypted, image-only). */
async function readPdfText(pdf: Buffer): Promise<string> {
  const parser = new PDFParse({ data: pdf });
  try {
    const result = await parser.getText();
    return result.text.trim();
  } catch (error) {
    console.error("[resume/extract] pdf parse failed", error);
    return "";
  } finally {
    // After a failed load there may be nothing to free, and that must not mask the real outcome.
    await parser.destroy().catch(() => undefined);
  }
}

/** Reads the signed-in user's stored resume and returns profile fields for the form. Writes nothing. */
export async function POST() {
  try {
    const user = await getUser();
    if (!user) return fail("Your session has expired. Please sign in again.", 401);

    // Before the download and the model call, so a rejected request costs nothing.
    const limit = checkRateLimit(`resume-extract:${user.id}`, EXTRACT_LIMIT, EXTRACT_WINDOW_MS);
    if (!limit.allowed) {
      const minutes = Math.max(1, Math.ceil(limit.retryAfterMs / 60_000));
      return fail(`You've extracted several times recently. Please try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`, 429);
    }

    const insforge = await createInsforgeServer();
    // The key comes from the session user, never from the request.
    const download = await downloadResume(insforge, user.id, "resume/extract");
    if (!download.ok) {
      return download.status === 404
        ? fail("Upload a resume first, then try again.", 404)
        : fail("We couldn't load your resume right now. Please try again in a moment.", 502);
    }

    const text = await readPdfText(Buffer.from(await download.file.arrayBuffer()));
    if (text.length < MIN_RESUME_TEXT_LENGTH) return fail(RESUME_UNREADABLE_ERROR, 422);

    const data = await extractProfileFromResumeText(text);
    return NextResponse.json<ExtractResumeResponse>({ success: true, data });
  } catch (error) {
    // Already logged by the extractor, in a form that leaves out the response headers.
    if (error instanceof ResumeExtractionUnavailableError) {
      return fail("Reading your resume is temporarily unavailable. Please try again later.", 503);
    }
    console.error("[resume/extract]", error);
    return fail("We couldn't read your resume. Please try again.", 500);
  }
}
