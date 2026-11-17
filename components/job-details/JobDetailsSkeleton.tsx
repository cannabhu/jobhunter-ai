import { Skeleton, SkeletonRegion, SkeletonText } from "@/components/shared/Skeleton";

const cardClass = "rounded-xl border border-border bg-surface shadow-card";

/** Job page layout with placeholders: header, summary tiles, reasoning, skills, description and the two AI cards. */
export function JobDetailsSkeleton() {
  return (
    <SkeletonRegion label="Loading this job" className="flex flex-col gap-6">
      <div className={`${cardClass} flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between`}>
        <div className="flex items-center gap-4">
          <Skeleton className="size-14 shrink-0 rounded-xl" />
          <div>
            <Skeleton className="h-7 w-56 max-w-full" />
            <Skeleton className="mt-2.5 h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className={`${cardClass} flex items-center gap-3 p-4`}>
            <Skeleton className="size-10 shrink-0 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="mt-2 h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
      <div className={`${cardClass} p-6`}>
        <Skeleton className="h-4 w-40" />
        <SkeletonText lines={3} className="mt-4" />
      </div>
      <div className={`${cardClass} p-6`}>
        <Skeleton className="h-4 w-60" />
        <Skeleton className="mt-5 h-3 w-16" />
        <div className="mt-3 flex flex-wrap gap-2">
          {["w-20", "w-28", "w-24", "w-16"].map((width) => (
            <Skeleton key={width} className={`h-7 rounded-full ${width}`} />
          ))}
        </div>
      </div>
      <div className={`${cardClass} p-6`}>
        <Skeleton className="h-5 w-36" />
        <SkeletonText lines={5} className="mt-5" />
      </div>
      <AiCardSkeleton />
      <AiCardSkeleton />
      <Skeleton className="h-12 w-full rounded-lg" />
    </SkeletonRegion>
  );
}

function AiCardSkeleton() {
  return (
    <div className={`${cardClass} overflow-hidden`}>
      <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-5 w-36" />
        </div>
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
      <div className="px-6 py-12">
        <Skeleton className="mx-auto h-12 w-12 rounded-xl" />
        <Skeleton className="mx-auto mt-3 h-4 w-32" />
      </div>
    </div>
  );
}
