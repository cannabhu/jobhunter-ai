import { ChartEmptyState } from "@/components/dashboard/ChartEmptyState";
import { ChartErrorState } from "@/components/dashboard/ChartErrorState";
import { JobsOverTimeChart } from "@/components/dashboard/JobsOverTimeChart";
import { chartYTicks, hasChartData } from "@/lib/dashboardCharts";
import type { ChartPoint } from "@/types";

type Props = {
  /** Started by the page before its own queries finish. Resolves to null when PostHog could not be read. */
  data: Promise<ChartPoint[] | null>;
};

export async function JobsOverTimeSection({ data }: Props) {
  const points = await data;
  if (!points) return <ChartErrorState />;
  if (!hasChartData(points)) return <ChartEmptyState title="No jobs found yet" text="Search for jobs and your results will show up here day by day." />;
  return <JobsOverTimeChart data={points} yTicks={chartYTicks(points)} />;
}
