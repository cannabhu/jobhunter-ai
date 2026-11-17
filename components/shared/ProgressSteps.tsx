import { Check, LoaderCircle, Minus } from "lucide-react";
import type { ProgressState } from "@/components/shared/useProgressAction";
import type { StageDef } from "@/lib/progress";

type Props = {
  stages: readonly StageDef[];
  progress: ProgressState;
  /** Read out by screen readers when the checklist appears, e.g. "Progress writing your cover letter". */
  label: string;
  /** "card" sits under a card header with a bottom rule; "inline" is its own boxed note inside a form card. */
  variant?: "card" | "inline";
};

const WRAPPER_CLASS = {
  card: "border-b border-border px-6 py-4",
  inline: "mt-3 rounded-md border border-border bg-surface-secondary px-4 py-3",
} as const;

type StepState = "done" | "current" | "skipped" | "upcoming";

function stepState(stage: StageDef, index: number, currentIndex: number, progress: ProgressState): StepState {
  const reached = progress.reached.includes(stage.id);
  const passed = progress.complete || index < currentIndex;
  if (passed) return reached ? "done" : "skipped";
  if (index === currentIndex) return "current";
  return "upcoming";
}

const STATE_WORD: Record<StepState, string> = { done: "done", current: "in progress", skipped: "skipped", upcoming: "waiting" };

const LABEL_CLASS: Record<StepState, string> = {
  done: "text-text-secondary",
  current: "font-medium text-text-primary",
  skipped: "text-text-muted",
  upcoming: "text-text-muted",
};

function StepIcon({ state }: { state: StepState }) {
  if (state === "done") return <Check className="size-4 text-success-foreground" aria-hidden="true" />;
  if (state === "current") return <LoaderCircle className="size-4 text-accent motion-safe:animate-spin" aria-hidden="true" />;
  if (state === "skipped") return <Minus className="size-4 text-text-muted" aria-hidden="true" />;
  return <span className="size-1.5 rounded-full bg-border" aria-hidden="true" />;
}

/**
 * The checklist under a card header while an AI action runs. It shows only what the server really reported: a step is
 * "done" once it passed, "skipped" if the run never started it, and a count ("4 of 10") appears only when the server sent one.
 */
export function ProgressSteps({ stages, progress, label, variant = "card" }: Props) {
  const currentIndex = stages.findIndex((stage) => stage.id === progress.stageId);

  return (
    <div role="status" aria-label={label} className={WRAPPER_CLASS[variant]}>
      <ol className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
        {stages.map((stage, index) => {
          const state = stepState(stage, index, currentIndex, progress);
          const count = state === "current" || state === "done" ? progress.counts[stage.id] : undefined;
          return (
            <li key={stage.id} className="flex items-center gap-2 text-sm">
              <span className="flex size-4 shrink-0 items-center justify-center">
                <StepIcon state={state} />
              </span>
              <span className={LABEL_CLASS[state]}>
                {stage.label}
                <span className="sr-only"> ({STATE_WORD[state]})</span>
              </span>
              {count ? (
                <span className="tabular-nums text-text-secondary">
                  {count.done} of {count.total}
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
