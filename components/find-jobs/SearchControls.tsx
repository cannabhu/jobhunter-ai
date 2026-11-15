import { Search, Sparkles } from "lucide-react";
import { labelClass } from "@/components/profile/fieldStyles";

type Props = {
  resultMessage?: string;
};

const inputClass =
  "w-full rounded-md border border-border bg-surface py-2.5 text-sm text-text-primary shadow-card placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

export function SearchControls({ resultMessage }: Props) {
  return (
    <section aria-label="Search jobs" className="rounded-xl border border-border bg-surface p-6 shadow-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="job-title" className={`${labelClass} mb-1.5`}>
            Job title
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            />
            <input id="job-title" name="jobTitle" type="text" placeholder="Frontend Engineer" className={`${inputClass} pr-4 pl-9`} />
          </div>
        </div>
        <div className="flex-1">
          <label htmlFor="location" className={`${labelClass} mb-1.5`}>
            Location
          </label>
          <input id="location" name="location" type="text" placeholder="Remote, New York..." className={`${inputClass} px-4`} />
        </div>
        <button
          type="button"
          className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-accent px-5 text-sm font-medium text-accent-foreground shadow-card hover:bg-accent-dark"
        >
          <Search className="size-4" aria-hidden="true" />
          Find Jobs
        </button>
      </div>
      {resultMessage ? (
        <p
          role="status"
          className="mt-4 flex h-11 items-center gap-2 rounded-md border border-success-light bg-success-lightest px-3.5 text-sm font-medium text-success-foreground"
        >
          <Sparkles className="size-4 shrink-0 text-success-alt" aria-hidden="true" />
          {resultMessage}
        </p>
      ) : null}
    </section>
  );
}
