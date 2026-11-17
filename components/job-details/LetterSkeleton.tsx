import { Skeleton, SkeletonText } from "@/components/shared/Skeleton";

/** Placeholder for the cover letter while one is written. Takes the textarea's place at about its height. */
export function LetterSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-4 px-6 py-6">
      <Skeleton className="h-3.5 w-52" />
      <div className="flex flex-col gap-6 rounded-lg border border-border px-4 py-4">
        <SkeletonText lines={4} />
        <SkeletonText lines={5} />
        <SkeletonText lines={3} />
      </div>
    </div>
  );
}
