/** One step of a long AI action, as the progress checklist shows it. */
export type StageDef = {
  id: string;
  label: string;
};

/** A step the server has really reached, or a real count inside one (jobs scored, pages read). */
export type ProgressUpdate<S extends string = string> =
  | { type: "stage"; stage: S }
  | { type: "count"; stage: S; done: number; total: number };

/** Receives updates from agent code. Optional everywhere, so an agent still works without a listener. */
export type ProgressListener<S extends string = string> = (update: ProgressUpdate<S>) => void;

/**
 * What a streamed route writes, one JSON object per line. Exactly one terminal event ends the stream:
 * `done` carries what the route used to return as its `data`, `error` carries the user-facing message.
 */
export type ProgressEvent<T, S extends string = string> = ProgressUpdate<S> | { type: "done"; data: T } | { type: "error"; error: string };

/** The step that runs in the browser: from the click until the server has passed its checks and opened the stream. */
export const PREPARE_STAGE_ID = "prepare";

export const PROGRESS_CONTENT_TYPE = "application/x-ndjson";

/** Shown when the stream ends without a `done` or `error` event (host time limit, dropped connection). */
export const PROGRESS_INTERRUPTED = "The connection dropped. If your result doesn't appear, try again.";

export function encodeEvent<T, S extends string>(event: ProgressEvent<T, S>): string {
  return `${JSON.stringify(event)}\n`;
}
