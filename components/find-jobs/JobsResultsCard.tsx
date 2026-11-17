"use client";

import type { ReactNode } from "react";
import { useJobsListing } from "@/components/find-jobs/JobsListingContext";
import { JobRowsSkeleton, JobsTableSkeleton } from "@/components/find-jobs/JobsTableSkeleton";

type Props = {
  /** False for a user with no jobs (or no matches); a search then shows only placeholder rows, not the empty message. */
  hasJobs: boolean;
  /** The table, or its empty state. Swapped for placeholders while a filter or page change loads. */
  table: ReactNode;
  /** Pagination and the Adzuna credit. Stays mounted so the clicked pagination link can keep reporting its pending state. */
  footer: ReactNode;
};

/**
 * The Jobs card. Server-rendered content arrives as props; this client shell only decides what shows while the list is
 * changing: placeholders instead of the rows when a filter or page is loading, and placeholder rows above the old ones
 * while a Find Jobs search runs (the old rows stay useful until the new ones are saved).
 */
export function JobsResultsCard({ hasJobs, table, footer }: Props) {
  const { loading, searching } = useJobsListing();

  return (
    <section aria-label="Jobs" aria-busy={loading || searching} className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      {loading ? (
        <JobsTableSkeleton />
      ) : (
        <>
          {searching ? (
            <div className="overflow-x-auto">
              <JobRowsSkeleton rows={3} />
            </div>
          ) : null}
          {searching && !hasJobs ? null : table}
        </>
      )}
      <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>{footer}</div>
    </section>
  );
}
