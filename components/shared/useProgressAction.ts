"use client";

import { useCallback, useState } from "react";
import { PREPARE_STAGE_ID } from "@/lib/progress";
import { runProgressAction, type ProgressOutcome } from "@/lib/progressClient";

export type ProgressCount = { done: number; total: number };

/** Where a streamed action is: the stage it is in, the stages it really passed through, and the counts it reported. */
export type ProgressState = {
  stageId: string | null;
  /** Every stage that really started. A stage the run jumped over (no website found, say) is not in here: it was skipped. */
  reached: readonly string[];
  counts: Readonly<Record<string, ProgressCount>>;
  complete: boolean;
};

const IDLE: ProgressState = { stageId: null, reached: [], counts: {}, complete: false };
const STARTED: ProgressState = { stageId: PREPARE_STAGE_ID, reached: [PREPARE_STAGE_ID], counts: {}, complete: false };

/**
 * Runs a streamed action and tracks its progress for `ProgressSteps`. `run` resolves with how it ended; the caller
 * keeps its own busy flag and error handling. The state resets on the next `run`, and stays on `complete` until then,
 * so the checklist can stay on screen while the page refreshes with the saved result.
 */
export function useProgressAction<T>(fallbackError: string) {
  const [progress, setProgress] = useState<ProgressState>(IDLE);

  const run = useCallback(
    async (url: string, body?: unknown): Promise<ProgressOutcome<T>> => {
      setProgress(STARTED);
      const outcome = await runProgressAction<T>(
        url,
        body,
        (update) => {
          if (update.type === "stage") {
            setProgress((current) => ({
              ...current,
              stageId: update.stage,
              reached: current.reached.includes(update.stage) ? current.reached : [...current.reached, update.stage],
            }));
          } else {
            setProgress((current) => ({ ...current, counts: { ...current.counts, [update.stage]: { done: update.done, total: update.total } } }));
          }
        },
        fallbackError,
      );
      if (outcome.ok) setProgress((current) => ({ ...current, complete: true }));
      return outcome;
    },
    [fallbackError],
  );

  return { progress, run };
}
