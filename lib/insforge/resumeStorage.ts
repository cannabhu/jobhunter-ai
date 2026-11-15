import type { createInsforgeServer } from "@/lib/insforge/server";

type InsforgeServer = Awaited<ReturnType<typeof createInsforgeServer>>;

export type ResumeDownload = { ok: true; file: Blob } | { ok: false; status: number };

/**
 * Pauses between attempts. A download is two steps (a signed link, then a fetch of that link), and the fetch can
 * fail for a moment right after the object is replaced, then succeed. A short wait covers that.
 */
const DEFAULT_RETRY_DELAYS_MS = [500, 1500];

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Reads the user's resume from the private bucket. Server context only.
 *
 * The key is built from `userId` (the session user), never from request input. Every failed attempt logs one line
 * with the real status and code, so a failure is never reduced to a bare "not found". The final status is returned
 * so the caller can tell "no such file" (404) from a storage failure.
 */
export async function downloadResume(
  insforge: InsforgeServer,
  userId: string,
  tag: string,
  retryDelaysMs: readonly number[] = DEFAULT_RETRY_DELAYS_MS,
): Promise<ResumeDownload> {
  let status = 500;
  for (let attempt = 0; attempt <= retryDelaysMs.length; attempt++) {
    if (attempt > 0) await wait(retryDelaysMs[attempt - 1]);
    const { data, error } = await insforge.storage.from("resumes").download(`${userId}/resume.pdf`);
    if (!error && data) return { ok: true, file: data };

    status = error?.statusCode ?? 500;
    const outcome = attempt < retryDelaysMs.length ? "retrying" : "giving up";
    console.error(
      `[${tag}] resume download failed (attempt ${attempt + 1} of ${retryDelaysMs.length + 1}, ${outcome}): status=${status} code=${error?.error ?? "none"} ${error?.message ?? "no data returned"}`,
    );
  }
  return { ok: false, status };
}
