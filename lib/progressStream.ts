import { PROGRESS_CONTENT_TYPE, encodeEvent, type ProgressEvent, type ProgressListener } from "@/lib/progress";

/** What a streamed route's work ends with. The stream turns it into the one terminal event. */
export type StreamOutcome<T> = { ok: true; data: T } | { ok: false; error: string };

const UNEXPECTED_ERROR = "Something went wrong. Please try again.";

/**
 * Turns a route's work into a streamed response of newline-delimited JSON events. Call it only after the route's own
 * checks (session, body, lookups, rate limit) have passed: once the first byte is out the status is 200, so those
 * checks must still answer with a real status and a JSON body.
 *
 * The work always runs to its end, even if the client goes away: a letter or dossier that was paid for is still saved,
 * and browser sessions still close. Writes to a closed stream are skipped, never thrown.
 */
export function streamProgress<T, S extends string = string>(
  route: string,
  run: (report: ProgressListener<S>) => Promise<StreamOutcome<T>>,
): Response {
  const encoder = new TextEncoder();
  let clientGone = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: ProgressEvent<T, S>) => {
        if (clientGone) return;
        try {
          controller.enqueue(encoder.encode(encodeEvent(event)));
        } catch {
          // enqueue throws once the stream is closed or cancelled, which only means nobody is listening any more.
          clientGone = true;
        }
      };

      void (async () => {
        let outcome: StreamOutcome<T>;
        try {
          outcome = await run((update) => send(update));
        } catch (error) {
          console.error(`[${route}]`, error);
          outcome = { ok: false, error: UNEXPECTED_ERROR };
        }
        send(outcome.ok ? { type: "done", data: outcome.data } : { type: "error", error: outcome.error });
        if (clientGone) return;
        try {
          controller.close();
        } catch {
          clientGone = true;
        }
      })();
    },
    cancel() {
      clientGone = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": `${PROGRESS_CONTENT_TYPE}; charset=utf-8`,
      // no-transform keeps a compression layer from holding chunks back; the header is for nginx-style proxies.
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
