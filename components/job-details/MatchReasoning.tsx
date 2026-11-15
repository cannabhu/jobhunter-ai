import { Sparkles } from "lucide-react";
import { SectionIcon } from "@/components/job-details/SectionIcon";

type Props = {
  reason: string | null;
};

export function MatchReasoning({ reason }: Props) {
  return (
    <section className="rounded-xl border border-border bg-surface p-6 shadow-card">
      <div className="flex items-center gap-2.5">
        <SectionIcon tone="success">
          <Sparkles />
        </SectionIcon>
        <h2 className="text-xs font-semibold tracking-wide text-text-secondary uppercase">AI Match Reasoning</h2>
      </div>
      {reason ? (
        <p className="mt-3 text-sm leading-relaxed text-text-primary">{reason}</p>
      ) : (
        <p className="mt-3 text-sm text-text-muted">No match reasoning was saved for this job.</p>
      )}
    </section>
  );
}
