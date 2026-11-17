import { NextRequest, NextResponse } from "next/server";
import { CoverLetterUnavailableError, writeCoverLetter } from "@/agent/coverLetter";
import {
  COVER_LETTER_FAILED,
  COVER_LETTER_LIMIT,
  COVER_LETTER_UNAVAILABLE,
  COVER_LETTER_WINDOW_MS,
  PROFILE_NEEDS_DATA_FOR_LETTER,
  hasEnoughForCoverLetter,
} from "@/lib/coverLetter";
import { coverLetterSchema } from "@/lib/coverLetterSchema";
import { getJobForCoverLetter, saveCoverLetter } from "@/lib/insforge/jobs";
import { getProfile } from "@/lib/insforge/profile";
import { createInsforgeServer, getUser } from "@/lib/insforge/server";
import { createPostHogServer } from "@/lib/posthog-server";
import { rowToFormValues } from "@/lib/profileMapping";
import { checkRateLimit, releaseRateLimit } from "@/lib/rateLimit";
import type { CoverLetterResponse } from "@/types";

// One GPT-4o call (45s timeout, one retry) and a database write; no browser session.
export const maxDuration = 60;

const fail = (error: string, status: number) => NextResponse.json<CoverLetterResponse>({ success: false, error }, { status });

/** Writes a cover letter for one saved job and saves it on the job. Running it again replaces the letter. */
export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return fail("Your session has expired. Please sign in again.", 401);

    const body: unknown = await req.json().catch(() => null);
    const parsed = coverLetterSchema.safeParse(body);
    if (!parsed.success) return fail("That job could not be found.", 400);
    const { jobId, tone } = parsed.data;

    const insforge = await createInsforgeServer();
    const job = await getJobForCoverLetter(insforge, user.id, jobId);
    if (!job) return fail("That job could not be found.", 404);

    // The saved profile, not the form on screen: unsaved edits are not part of the letter.
    const profile = await getProfile();
    if (!profile) return fail("We couldn't load your profile. Please try again.", 500);
    // Checked before the rate limit, so a request that can't produce a letter doesn't use up one of the user's turns.
    if (!hasEnoughForCoverLetter(rowToFormValues(profile))) return fail(PROFILE_NEEDS_DATA_FOR_LETTER, 422);

    // Before any model call, so a rejected request costs nothing.
    const limitKey = `cover-letter:${user.id}`;
    const limit = checkRateLimit(limitKey, COVER_LETTER_LIMIT, COVER_LETTER_WINDOW_MS);
    if (!limit.allowed) {
      const minutes = Math.max(1, Math.ceil(limit.retryAfterMs / 60_000));
      return fail(`You've written several cover letters recently. Please try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`, 429);
    }

    let letter;
    try {
      letter = await writeCoverLetter(job, profile, tone);
    } catch (error) {
      if (error instanceof CoverLetterUnavailableError) {
        // OpenAI refused or timed out, so no letter and no real cost: the turn is given back. A letter that came back
        // unusable keeps its turn, because that call was paid for.
        releaseRateLimit(limitKey);
        return fail(COVER_LETTER_UNAVAILABLE, 503);
      }
      console.error("[agent/cover-letter]", error);
      return fail(COVER_LETTER_FAILED, 500);
    }

    await saveCoverLetter(insforge, user.id, job.id, letter.text, letter.tone);

    const posthog = createPostHogServer();
    try {
      posthog.capture({
        distinctId: user.id,
        event: "cover_letter_generated",
        properties: { userId: user.id, jobId: job.id, company: job.company },
      });
    } finally {
      // Events are lost without this; a failed flush must not turn a finished letter into an error.
      await posthog.shutdown().catch((error: unknown) => console.error("[agent/cover-letter] posthog shutdown failed", error));
    }

    return NextResponse.json<CoverLetterResponse>({ success: true });
  } catch (error) {
    console.error("[agent/cover-letter]", error);
    return fail(COVER_LETTER_FAILED, 500);
  }
}
