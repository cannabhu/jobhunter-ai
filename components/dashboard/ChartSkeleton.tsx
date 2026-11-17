import { Skeleton } from "@/components/shared/Skeleton";

/** Placeholder while a chart's data streams in. Fills the ChartCard's chart box. */
export function ChartSkeleton() {
  return <Skeleton className="h-full rounded-lg" />;
}
