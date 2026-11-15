import type { createInsforgeServer } from "@/lib/insforge/server";

type InsforgeServer = Awaited<ReturnType<typeof createInsforgeServer>>;

export type AgentLogLevel = "info" | "success" | "warning" | "error";

/**
 * Writes one human readable line to agent_logs. Never throws: a logging failure must not fail the run,
 * so it only reaches the server console. Pass messages that carry no tokens, keys or raw error objects.
 * `runId` is null for work that has no agent_runs row, such as company research.
 */
export async function logAgent(
  insforge: InsforgeServer,
  runId: string | null,
  userId: string,
  level: AgentLogLevel,
  message: string,
  jobId?: string,
): Promise<void> {
  try {
    const { error } = await insforge.database
      .from("agent_logs")
      .insert([{ run_id: runId, user_id: userId, level, message, job_id: jobId ?? null }]);
    if (error) console.error("[lib/insforge/logAgent]", error.message);
  } catch (error) {
    console.error("[lib/insforge/logAgent]", error);
  }
}
