import { JobsTableSkeleton } from "@/components/find-jobs/JobsTableSkeleton";
import { Skeleton } from "@/components/shared/Skeleton";

/** The filter bar and results card while the first page of jobs loads. A fragment, so the page's `gap-6` spaces it. */
export function FindJobsSkeleton() {
  return (
    <>
      <div aria-hidden="true" className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-border bg-surface px-4 py-2.5 shadow-card">
        <Skeleton className="h-8 min-w-48 flex-1" />
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        <JobsTableSkeleton />
        <div aria-hidden="true" className="flex items-center justify-between border-t border-border px-6 py-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-56" />
        </div>
      </div>
    </>
  );
}
