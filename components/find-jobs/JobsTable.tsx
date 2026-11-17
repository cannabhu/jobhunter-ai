import { Building2 } from "lucide-react";
import Link from "next/link";
import { MatchScoreBar } from "@/components/find-jobs/MatchScoreBar";
import { FIND_JOBS_PAGE_PATH, jobDetailPath } from "@/lib/routes";
import type { JobListItem } from "@/types";

type Props = {
  jobs: JobListItem[];
  /** True when a text or match filter is on, so an empty list means "nothing matches", not "no jobs yet". */
  filtered: boolean;
};

const headerClass = "h-12 px-6 text-xs font-medium tracking-wider text-text-secondary uppercase";
const cellClass = "h-16 px-6";

export function JobsTable({ jobs, filtered }: Props) {
  if (jobs.length === 0 && filtered) {
    return (
      <div className="px-6 py-16 text-center text-sm text-text-muted">
        <p>No jobs match your filters.</p>
        <Link href={FIND_JOBS_PAGE_PATH} className="mt-2 inline-block font-medium text-accent hover:text-accent-dark">
          Clear filters
        </Link>
      </div>
    );
  }

  if (jobs.length === 0) {
    return <p className="px-6 py-16 text-center text-sm text-text-muted">No jobs yet. Search above to find your first matches.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] table-fixed text-sm">
        <caption className="sr-only">Jobs found for you</caption>
        <colgroup>
          <col className="w-[22.4%]" />
          <col className="w-[22.5%]" />
          <col className="w-[22.5%]" />
          <col className="w-[17.4%]" />
          <col className="w-[15.2%]" />
        </colgroup>
        <thead className="border-b border-border bg-surface-secondary">
          <tr>
            <th scope="col" className={`${headerClass} pl-11 text-left`}>
              Company
            </th>
            <th scope="col" className={`${headerClass} text-left`}>
              Role
            </th>
            <th scope="col" className={`${headerClass} text-center`}>
              Match Score
            </th>
            <th scope="col" className={`${headerClass} text-left`}>
              Salary Est.
            </th>
            <th scope="col" className={`${headerClass} text-left`}>
              Date Found
            </th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="relative border-b border-border last:border-b-0 hover:bg-surface-secondary">
              <td className={`${cellClass} pl-11`}>
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface-tertiary">
                    <Building2 className="size-4 text-text-secondary" aria-hidden="true" />
                  </span>
                  <span className="truncate font-semibold text-text-primary">{job.company}</span>
                </div>
              </td>
              <td className={`${cellClass} font-medium text-text-dark`}>
                {/* The link's ::after covers the whole row (the <tr> is the positioned ancestor), so a click anywhere opens the job. */}
                <Link
                  href={jobDetailPath(job.id)}
                  className="block truncate after:absolute after:inset-0 focus-visible:after:rounded-md focus-visible:after:outline-2 focus-visible:after:outline-accent"
                >
                  {job.title}
                </Link>
              </td>
              <td className={cellClass}>
                <MatchScoreBar score={job.matchScore} />
              </td>
              <td className={`${cellClass} font-medium text-text-dark`}>{job.salary ?? "—"}</td>
              <td className={`${cellClass} text-text-secondary`}>{job.foundLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
