import { ChartEmptyState } from "@/components/dashboard/ChartEmptyState";
import { ChartErrorState } from "@/components/dashboard/ChartErrorState";
import { ResearchActivityChart } from "@/components/dashboard/ResearchActivityChart";
import { chartYTicks, hasChartData } from "@/lib/dashboardCharts";
import type { ChartPoint } from "@/types";

type Props = {
  /** Started by the page before its own queries finish. Resolves to null when PostHog could not be read. */
  data: Promise<ChartPoint[] | null>;
};

export async function ResearchActivitySection({ data }: Props) {
  const points = await data;
  if (!points) return <ChartErrorState />;
  if (!hasChartData(points)) return <ChartEmptyState title="No research yet" text="Research a company from a job's page and it will be counted here." />;
  return <ResearchActivityChart data={points} yTicks={chartYTicks(points)} />;
}
