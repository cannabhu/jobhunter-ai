import { Skeleton } from "@/components/shared/Skeleton";

// The same column widths as JobsTable's colgroup, so rows line up with the real table when it arrives.
const GRID = "grid min-w-[860px] grid-cols-[22.4%_22.5%_22.5%_17.4%_15.2%] items-center";

const HEADERS = ["Company", "Role", "Match Score", "Salary Est.", "Date Found"] as const;

/** Placeholder table rows shaped like JobsTable's rows. */
export function JobRowsSkeleton({ rows }: { rows: number }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className={`${GRID} h-16 border-b border-border`}>
          <div className="flex items-center gap-3 pl-11">
            <Skeleton className="size-8 shrink-0" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="px-6">
            <Skeleton className="h-4 w-4/5" />
          </div>
          <div className="px-6">
            <Skeleton className="mx-auto h-2 w-3/4 rounded-full" />
          </div>
          <div className="px-6">
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="px-6">
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** The whole table while a filter, sort or page change loads: the real header row, then placeholder rows. */
export function JobsTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="overflow-x-auto" role="status" aria-busy="true">
      <span className="sr-only">Loading jobs</span>
      <div aria-hidden="true" className={`${GRID} h-12 border-b border-border bg-surface-secondary text-xs font-medium tracking-wider text-text-secondary uppercase`}>
        {HEADERS.map((label, index) => (
          <span key={label} className={index === 0 ? "pl-11" : index === 2 ? "px-6 text-center" : "px-6"}>
            {label}
          </span>
        ))}
      </div>
      <JobRowsSkeleton rows={rows} />
    </div>
  );
}
