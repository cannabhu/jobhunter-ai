import { Building2, ExternalLink } from "lucide-react";
import { MATCH_THRESHOLD } from "@/lib/utils";

type Props = {
  title: string;
  company: string;
  matchScore: number;
  /** Null when the job has no usable link, which hides the button. */
  postUrl: string | null;
};

export function JobHeader({ title, company, matchScore, postUrl }: Props) {
  const strong = matchScore >= MATCH_THRESHOLD;

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 shadow-card sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-tertiary">
          <Building2 className="size-6 text-text-secondary" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-text-primary">{title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-text-secondary">
            <span>{company}</span>
            <span aria-hidden="true" className="size-1 rounded-full bg-text-muted" />
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                strong ? "bg-success-lightest text-success-foreground" : "bg-surface-secondary text-text-secondary"
              }`}
            >
              {matchScore}% Match Score
            </span>
          </div>
        </div>
      </div>
      {postUrl ? (
        <a
          href={postUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary shadow-card hover:bg-surface-secondary"
        >
          <ExternalLink className="size-4" aria-hidden="true" />
          View Job Post
        </a>
      ) : null}
    </section>
  );
}
