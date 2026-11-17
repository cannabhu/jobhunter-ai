import { Skeleton, SkeletonText } from "@/components/shared/Skeleton";

/** Placeholder for the company dossier while research runs. Takes the dossier card's place. */
export function DossierSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-6 px-6 py-6">
      <SkeletonText lines={3} />
      <div className="grid gap-6 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index}>
            <Skeleton className="h-3.5 w-28" />
            <SkeletonText lines={2} className="mt-3" />
          </div>
        ))}
      </div>
    </div>
  );
}
