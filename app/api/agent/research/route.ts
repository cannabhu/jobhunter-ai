import { NextRequest, NextResponse } from "next/server";
import { researchCompany } from "@/agent/research";
import { RESEARCH_LIMIT, RESEARCH_WINDOW_MS, type ResearchStageId } from "@/lib/companyResearch";
import { getJobForResearch, saveCompanyResearch } from "@/lib/insforge/jobs";
import { getProfile } from "@/lib/insforge/profile";
import { createInsforgeServer, getUser } from "@/lib/insforge/server";
import { createPostHogServer } from "@/lib/posthog-server";
import { streamProgress } from "@/lib/progressStream";
import { checkRateLimit } from "@/lib/rateLimit";
import { researchSchema } from "@/lib/researchSchema";
import type { CompanyDossier, ResearchCompanyResponse } from "@/types";

// Up to four page reads in one Browserbase session (80s budget) plus the GPT-4o call.
export const maxDuration = 120;

const fail = (error: string, status: number) => NextResponse.json<ResearchCompanyResponse>({ success: false, error }, { status });

/**
 * Researches the company of one saved job and saves the dossier on the job. Running it again replaces the dossier.
 * Checks answer as JSON with a real status; once they pass, the work streams its stages (site, read, write, save) as NDJSON.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return fail("Your session has expired. Please sign in again.", 401);

    const body: unknown = await req.json().catch(() => null);
    const parsed = researchSchema.safeParse(body);
    if (!parsed.success) return fail("That job could not be found.", 400);
    const { jobId } = parsed.data;

    // Before any browser or model call, so a rejected request costs nothing.
    const limit = checkRateLimit(`research:${user.id}`, RESEARCH_LIMIT, RESEARCH_WINDOW_MS);
    if (!limit.allowed) {
      const minutes = Math.max(1, Math.ceil(limit.retryAfterMs / 60_000));
      return fail(`You've researched several companies recently. Please try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`, 429);
    }

    const insforge = await createInsforgeServer();
    const job = await getJobForResearch(insforge, user.id, jobId);
    if (!job) return fail("That job could not be found.", 404);

    // The saved profile, not the form on screen: unsaved edits are not part of the briefing.
    const profile = await getProfile();
    if (!profile) return fail("We couldn't load your profile. Please try again.", 500);

    // Every check has passed, so from here the status is 200 and a failure is an `error` event.
    return streamProgress<CompanyDossier, ResearchStageId>("agent/research", async (report) => {
      const result = await researchCompany(insforge, user.id, job, profile, report);
      if (!result.success) return { ok: false, error: result.error };

      report({ type: "stage", stage: "save" });
      try {
        await saveCompanyResearch(insforge, user.id, job.id, result.dossier);
      } catch (error) {
        console.error("[agent/research] save failed", error);
        return { ok: false, error: "We couldn't research this company. Please try again." };
      }

      const posthog = createPostHogServer();
      try {
        posthog.capture({
          distinctId: user.id,
          event: "company_researched",
          properties: { userId: user.id, jobId: job.id, company: job.company },
        });
      } finally {
        // Events are lost without this; a failed flush must not turn a finished briefing into an error.
        await posthog.shutdown().catch((error: unknown) => console.error("[agent/research] posthog shutdown failed", error));
      }

      return { ok: true, data: result.dossier };
    });
  } catch (error) {
    console.error("[agent/research]", error);
    return fail("We couldn't research this company. Please try again.", 500);
  }
}
