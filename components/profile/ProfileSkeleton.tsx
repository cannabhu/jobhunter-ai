import { Skeleton, SkeletonRegion } from "@/components/shared/Skeleton";

function FieldSkeleton() {
  return (
    <div>
      <Skeleton tone="page" className="h-3.5 w-24" />
      <Skeleton tone="page" className="mt-2 h-11 w-full" />
    </div>
  );
}

function SectionSkeleton({ fields }: { fields: number }) {
  return (
    <div className="border-t border-border py-12">
      <Skeleton tone="page" className="mb-5 h-5 w-40" />
      <div className="grid gap-5 sm:grid-cols-2">
        {Array.from({ length: fields }, (_, index) => (
          <FieldSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

/** Profile page layout with placeholders: the resume card, then the form sections. Shown while the saved profile loads. */
export function ProfileSkeleton() {
  return (
    <SkeletonRegion label="Loading your profile" className="flex flex-col gap-8">
      <div className="rounded-xl border border-border bg-surface p-8 shadow-card">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="mt-3 h-4 w-3/4 max-w-lg" />
        <Skeleton className="mt-8 h-52 w-full rounded-xl" />
      </div>
      <div>
        <SectionSkeleton fields={4} />
        <SectionSkeleton fields={6} />
        <SectionSkeleton fields={4} />
      </div>
    </SkeletonRegion>
  );
}
