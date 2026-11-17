import { Skeleton, SkeletonRegion } from "@/components/shared/Skeleton";

const cardClass = "rounded-xl border border-border bg-surface shadow-card";

/** Dashboard layout with placeholders: four stat cards, the activity feed and three chart cards. Shown while the page's data loads. */
export function DashboardSkeleton() {
  return (
    <SkeletonRegion label="Loading your dashboard" className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className={`${cardClass} p-6`}>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-8 w-20" />
            <Skeleton className="mt-4 h-4 w-36" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`${cardClass} flex flex-col`}>
          <div className="border-b border-border px-6 py-5">
            <Skeleton className="h-5 w-36" />
          </div>
          <ul className="flex flex-col gap-6 px-6 py-6">
            {Array.from({ length: 5 }, (_, index) => (
              <li key={index} className="flex gap-4">
                <Skeleton className="mt-0.5 size-4 shrink-0 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="mt-2 h-3 w-20" />
                </div>
              </li>
            ))}
          </ul>
        </div>
        <ChartCardSkeleton />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCardSkeleton className="lg:col-span-2" />
        <ChartCardSkeleton />
      </div>
    </SkeletonRegion>
  );
}

function ChartCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`${cardClass} flex flex-col p-6 ${className}`}>
      <div className="flex items-baseline justify-between gap-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="mt-6 min-h-[280px] flex-1 rounded-lg" />
    </div>
  );
}
