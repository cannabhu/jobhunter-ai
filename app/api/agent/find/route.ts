import { NextRequest, NextResponse } from "next/server";
import { discoverJobs } from "@/agent/adzuna";
import { FIND_LIMIT, FIND_WINDOW_MS, PROFILE_NEEDS_DATA_ERROR } from "@/lib/findJobs";
import { buildFindMessage } from "@/lib/findJobsMessage";
import { findJobsSchema } from "@/lib/findJobsSchema";
import { getProfile } from "@/lib/insforge/profile";
import { createInsforgeServer, getUser } from "@/lib/insforge/server";
import { createPostHogServer } from "@/lib/posthog-server";
import { checkRateLimit } from "@/lib/rateLimit";
import type { FindJobsResponse } from "@/types";

// Up to 10 parallel GPT-4o calls plus Adzuna; give the route room on platforms that enforce a limit.
export const maxDuration = 60;

const fail = (error: string, status: number) => NextResponse.json<FindJobsResponse>({ success: false, error }, { status });

/** Searches Adzuna for the signed-in user, scores the new jobs against their saved profile and saves them. */
export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return fail("Your session has expired. Please sign in again.", 401);

    const body: unknown = await req.json().catch(() => null);
    const parsed = findJobsSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Enter a job title to search for.", 400);
    const { jobTitle, location } = parsed.data;

    // Before any Adzuna or model call, so a rejected request costs nothing.
    const limit = checkRateLimit(`find-jobs:${user.id}`, FIND_LIMIT, FIND_WINDOW_MS);
    if (!limit.allowed) {
      const minutes = Math.max(1, Math.ceil(limit.retryAfterMs / 60_000));
      return fail(`You've searched several times recently. Please try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`, 429);
    }

    // The saved profile, not the form on screen: unsaved edits are not part of the score.
    const profile = await getProfile();
    if (!profile) return fail("We couldn't load your profile. Please try again.", 500);
    if (profile.skills.length === 0 && !profile.current_title?.trim()) return fail(PROFILE_NEEDS_DATA_ERROR, 422);

    const insforge = await createInsforgeServer();
    const { data: runRows, error: runError } = await insforge.database
      .from("agent_runs")
      .insert([{ user_id: user.id, status: "running", job_title_searched: jobTitle, location_searched: location }])
      .select("id");
    const runId: unknown = runRows?.[0]?.id;
    if (runError || typeof runId !== "string") throw runError ?? new Error("agent_runs insert returned no id");

    const posthog = createPostHogServer();
    try {
      posthog.capture({ distinctId: user.id, event: "job_search_started", properties: { userId: user.id, jobTitle, location } });

      const result = await discoverJobs(insforge, user.id, runId, jobTitle, location, profile);

      const { error: closeError } = await insforge.database
        .from("agent_runs")
        .update({
          status: result.success ? "completed" : "failed",
          jobs_found: result.success ? result.found : 0,
          completed_at: new Date().toISOString(),
        })
        .eq("id", runId)
        .eq("user_id", user.id);
      if (closeError) console.error("[agent/find] could not close the run", closeError.message);

      if (!result.success) return fail(result.error, result.unavailable ? 503 : 500);

      for (const matchScore of result.newScores) {
        posthog.capture({
          distinctId: user.id,
          event: "job_found",
          properties: { userId: user.id, source: "search", matchScore },
        });
      }

      return NextResponse.json<FindJobsResponse>({
        success: true,
        data: {
          message: buildFindMessage(result, jobTitle, location),
          found: result.found,
          newCount: result.newCount,
          strongMatches: result.strongMatches,
        },
      });
    } finally {
      // Events are lost without this; a failed flush must not turn a finished search into an error.
      await posthog.shutdown().catch((error: unknown) => console.error("[agent/find] posthog shutdown failed", error));
    }
  } catch (error) {
    console.error("[agent/find]", error);
    return fail("We couldn't complete your search. Please try again.", 500);
  }
}
