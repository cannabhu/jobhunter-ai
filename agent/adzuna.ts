import { JobScoringUnavailableError, scoreJob } from "@/agent/matcher";
import {
  AdzunaUnavailableError,
  detectCountry,
  formatSalary,
  searchJobs,
  toJobType,
  type AdzunaJob,
} from "@/lib/adzuna";
import { logAgent } from "@/lib/insforge/agentLogs";
import { getSavedJobScores } from "@/lib/insforge/jobs";
import type { createInsforgeServer } from "@/lib/insforge/server";
import type { FindJobsStageId } from "@/lib/findJobs";
import type { ProgressListener } from "@/lib/progress";
import { MATCH_THRESHOLD } from "@/lib/utils";
import type { JobScore, ProfileRow } from "@/types";

type InsforgeServer = Awaited<ReturnType<typeof createInsforgeServer>>;

export type DiscoverySuccess = {
  success: true;
  /** Jobs that are now saved for this search: new ones plus ones the user already had. */
  found: number;
  newCount: number;
  strongMatches: number;
  /** Scores of the newly saved jobs only, for the job_found events. */
  newScores: number[];
};

export type DiscoveryFailure = {
  success: false;
  error: string;
  /** True when Adzuna or OpenAI failed, rather than anything about the user's request. */
  unavailable: boolean;
};

type ScoredJob = { job: AdzunaJob; score: JobScore };

/**
 * Searches Adzuna, skips jobs the user already saved, scores the rest with GPT-4o in parallel and saves them.
 * Every failure is written to agent_logs before returning.
 */
export async function discoverJobs(
  insforge: InsforgeServer,
  userId: string,
  runId: string,
  jobTitle: string,
  location: string,
  profile: ProfileRow,
  report?: ProgressListener<FindJobsStageId>,
): Promise<DiscoverySuccess | DiscoveryFailure> {
  try {
    const country = detectCountry(location);
    report?.({ type: "stage", stage: "search" });
    await logAgent(insforge, runId, userId, "info", `Searching Adzuna (${country}) for "${jobTitle}"${location ? ` in ${location}` : ""}.`);

    const results = await searchJobs(jobTitle, location, country);
    // Adzuna can repeat a listing; one external_id per user is enforced by the database.
    const jobs = [...new Map(results.map((job) => [job.id, job])).values()];
    if (jobs.length === 0) {
      await logAgent(insforge, runId, userId, "info", "Adzuna returned no jobs.");
      return { success: true, found: 0, newCount: 0, strongMatches: 0, newScores: [] };
    }

    const savedScores = await getSavedJobScores(insforge, userId, jobs.map((job) => job.id));
    const newJobs = jobs.filter((job) => !savedScores.has(job.id));
    const existingStrong = [...savedScores.values()].filter((score) => score >= MATCH_THRESHOLD).length;

    const scored: ScoredJob[] = [];
    let unavailableCount = 0;
    let settled = 0;
    if (newJobs.length > 0) {
      report?.({ type: "stage", stage: "score" });
      report?.({ type: "count", stage: "score", done: 0, total: newJobs.length });
    }
    // The calls run in parallel, so the count goes up as each one settles, whether it scored or failed.
    const outcomes = await Promise.allSettled(
      newJobs.map((job) =>
        scoreJob(job, profile).finally(() => {
          settled += 1;
          report?.({ type: "count", stage: "score", done: settled, total: newJobs.length });
        }),
      ),
    );
    outcomes.forEach((outcome, index) => {
      const job = newJobs[index];
      if (outcome.status === "fulfilled" && outcome.value) {
        scored.push({ job, score: outcome.value });
        return;
      }
      if (outcome.status === "rejected" && outcome.reason instanceof JobScoringUnavailableError) unavailableCount += 1;
      else if (outcome.status === "rejected") console.error("[agent/adzuna] scoring failed", outcome.reason);
    });

    const skipped = newJobs.length - scored.length;
    if (skipped > 0) {
      await logAgent(insforge, runId, userId, "warning", `Skipped ${skipped} ${skipped === 1 ? "job" : "jobs"} that could not be scored.`);
    }
    if (newJobs.length > 0 && scored.length === 0) {
      const unavailable = unavailableCount > 0;
      await logAgent(insforge, runId, userId, "error", unavailable ? "GPT-4o scoring was unavailable." : "No job could be scored.");
      return {
        success: false,
        unavailable,
        error: unavailable
          ? "Scoring jobs is temporarily unavailable. Please try again later."
          : "We couldn't score these jobs. Please try again.",
      };
    }

    if (scored.length > 0) {
      report?.({ type: "stage", stage: "save" });
      const { error } = await insforge.database.from("jobs").insert(
        scored.map(({ job, score }) => ({
          user_id: userId,
          run_id: runId,
          external_id: job.id,
          source: "search",
          source_url: job.redirect_url,
          title: job.title,
          company: job.company.display_name,
          location: job.location.display_name,
          salary: formatSalary(job.salary_min, job.salary_max, country),
          job_type: toJobType(job),
          about_role: job.description,
          match_score: score.matchScore,
          match_reason: score.matchReason,
          matched_skills: score.matchedSkills,
          missing_skills: score.missingSkills,
        })),
      );
      if (error) throw error;
    }

    const newScores = scored.map(({ score }) => score.matchScore);
    const found = savedScores.size + scored.length;
    const strongMatches = existingStrong + newScores.filter((score) => score >= MATCH_THRESHOLD).length;
    await logAgent(insforge, runId, userId, "success", `Saved ${scored.length} new ${scored.length === 1 ? "job" : "jobs"}; ${savedScores.size} already saved.`);
    return { success: true, found, newCount: scored.length, strongMatches, newScores };
  } catch (error) {
    if (error instanceof AdzunaUnavailableError) {
      console.error("[agent/adzuna]", error.message);
      await logAgent(insforge, runId, userId, "error", "Adzuna was unavailable.");
      return { success: false, unavailable: true, error: "Job search is temporarily unavailable. Please try again later." };
    }
    console.error("[agent/adzuna]", error);
    await logAgent(insforge, runId, userId, "error", "The job search failed unexpectedly.");
    return { success: false, unavailable: false, error: "We couldn't complete your search. Please try again." };
  }
}
