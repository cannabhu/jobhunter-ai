import { ChartEmptyState } from "@/components/dashboard/ChartEmptyState";
import { ChartErrorState } from "@/components/dashboard/ChartErrorState";
import { MatchDistributionChart } from "@/components/dashboard/MatchDistributionChart";
import { chartYTicks, hasChartData } from "@/lib/dashboardCharts";
import type { ChartPoint } from "@/types";

type Props = {
  /** Started by the page before its own queries finish. Resolves to null when PostHog could not be read. */
  data: Promise<ChartPoint[] | null>;
};

export async function MatchDistributionSection({ data }: Props) {
  const points = await data;
  if (!points) return <ChartErrorState />;
  if (!hasChartData(points)) return <ChartEmptyState title="No match scores yet" text="Scores appear once a job search finds jobs for you." />;
  return <MatchDistributionChart data={points} yTicks={chartYTicks(points)} />;
}
