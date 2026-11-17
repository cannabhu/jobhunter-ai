import { PROGRESS_CONTENT_TYPE, PROGRESS_INTERRUPTED, type ProgressEvent, type ProgressUpdate } from "@/lib/progress";

/**
 * How a streamed action ended.
 * - `status` is the HTTP status: a failed check (401, 404, 422, 429...) keeps its own, anything that fails after the
 *   stream opened reports 200. `null` means no response at all (network down).
 * - `interrupted` means the stream opened but ended without a result. The work may still have saved, so refresh.
 */
export type ProgressOutcome<T> = { ok: true; data: T } | { ok: false; error: string; status: number | null; interrupted: boolean };

/** Reads `{ success: false, error }` from a JSON body without trusting its shape. */
function readErrorMessage(value: unknown): string | null {
  if (typeof value !== "object" || value === null || !("error" in value)) return null;
  return typeof value.error === "string" ? value.error : null;
}

/**
 * Reads one line of the stream. The server is ours, so `done.data` is trusted the way the other clients trust their
 * JSON answers; only the envelope is checked, so a garbled line is skipped instead of breaking the run.
 */
function parseLine<T>(line: string): ProgressEvent<T> | null {
  try {
    const event: ProgressEvent<T> | null = JSON.parse(line);
    if (typeof event !== "object" || event === null) return null;
    switch (event.type) {
      case "stage":
        return typeof event.stage === "string" ? event : null;
      case "count":
        return typeof event.stage === "string" && Number.isFinite(event.done) && Number.isFinite(event.total) ? event : null;
      case "done":
        return event;
      case "error":
        return typeof event.error === "string" ? event : null;
      default:
        return null;
    }
  } catch (error) {
    console.error("[progressClient] skipped an unreadable line", error);
    return null;
  }
}

/** Splits a byte stream into lines, yielding each complete line and keeping a partial one until the rest arrives. */
async function* readLines(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) if (line.trim() !== "") yield line;
  }
  buffer += decoder.decode();
  if (buffer.trim() !== "") yield buffer;
}

/**
 * POSTs to a streamed route and reports each stage or count to `onUpdate` as it arrives.
 * A request the server refused before streaming comes back as a plain JSON error with its real status.
 */
export async function runProgressAction<T>(
  url: string,
  body: unknown,
  onUpdate: (update: ProgressUpdate) => void,
  fallbackError: string,
): Promise<ProgressOutcome<T>> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    console.error("[progressClient] request failed", error);
    return { ok: false, error: fallbackError, status: null, interrupted: false };
  }

  const isStream = (response.headers.get("Content-Type") ?? "").includes(PROGRESS_CONTENT_TYPE);
  if (!isStream || !response.body) {
    const result: unknown = await response.json().catch(() => null);
    return { ok: false, error: readErrorMessage(result) ?? fallbackError, status: response.status, interrupted: false };
  }

  let outcome: ProgressOutcome<T> | null = null;
  try {
    for await (const line of readLines(response.body)) {
      const event = parseLine<T>(line);
      if (!event || outcome) continue;
      if (event.type === "done") outcome = { ok: true, data: event.data };
      else if (event.type === "error") outcome = { ok: false, error: event.error, status: response.status, interrupted: false };
      else onUpdate(event);
    }
  } catch (error) {
    console.error("[progressClient] stream broke", error);
  }
  return outcome ?? { ok: false, error: PROGRESS_INTERRUPTED, status: response.status, interrupted: true };
}
