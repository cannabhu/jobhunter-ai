import { FileText } from "lucide-react";
import { SectionIcon } from "@/components/job-details/SectionIcon";

type Props = {
  description: string | null;
  /** The job post on Adzuna, which has the full text; null when the job has no usable link. */
  postUrl: string | null;
};

// Adzuna's search results carry a 500 character preview that ends in an ellipsis when the post is longer.
const isPreview = (text: string): boolean => /(…|\.\.\.)\s*$/.test(text);

export function JobDescription({ description, postUrl }: Props) {
  return (
    <section className="rounded-xl border border-border bg-surface p-6 shadow-card">
      <div className="flex items-center gap-2.5">
        <SectionIcon tone="neutral">
          <FileText />
        </SectionIcon>
        <h2 className="text-base font-semibold text-text-primary">Job Description</h2>
      </div>
      {description ? (
        <>
          <p className="mt-5 text-sm leading-relaxed text-text-primary">{description}</p>
          {isPreview(description) ? (
            <p className="mt-3 text-xs text-text-muted">
              Preview only.{" "}
              {postUrl ? (
                <a
                  href={postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-accent hover:text-accent-dark"
                >
                  Read the full description on the job post
                </a>
              ) : (
                "The full description is on the job post."
              )}
            </p>
          ) : null}
        </>
      ) : (
        <p className="mt-5 text-sm text-text-muted">No description was saved for this job.</p>
      )}
    </section>
  );
}
