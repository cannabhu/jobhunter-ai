import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { JobsOverTimeChart } from "@/components/dashboard/JobsOverTimeChart";
import { MatchDistributionChart } from "@/components/dashboard/MatchDistributionChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { ResearchActivityChart } from "@/components/dashboard/ResearchActivityChart";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { CompletionIndicator } from "@/components/profile/CompletionIndicator";
import { getProfile } from "@/lib/insforge/profile";
import { getUser } from "@/lib/insforge/server";
import {
  MOCK_ACTIVITY,
  MOCK_JOBS_BY_DAY,
  MOCK_RESEARCH_BY_DAY,
  MOCK_SCORE_DISTRIBUTION,
  MOCK_STATS,
} from "./mockDashboard";

export const metadata: Metadata = {
  title: "Dashboard — JobPilot",
};

async function DashboardContent() {
  const user = await getUser();
  if (!user) redirect("/login?error=session");

  const profile = await getProfile();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="sr-only">Dashboard</h1>
      {profile && !profile.is_complete ? (
        <CompletionIndicator percentage={profile.completion_percentage} missingFields={profile.missing_fields} actionHref="/profile" />
      ) : null}
      <StatsBar stats={MOCK_STATS} />
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentActivity entries={MOCK_ACTIVITY} />
        <ChartCard id="research-activity-heading" title="Company Research Activity">
          <ResearchActivityChart data={MOCK_RESEARCH_BY_DAY} yTicks={[0, 3, 6, 9, 12]} />
        </ChartCard>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard id="jobs-over-time-heading" title="Jobs Found Over Time" className="lg:col-span-2">
          <JobsOverTimeChart data={MOCK_JOBS_BY_DAY} yTicks={[0, 25, 50, 75, 100]} />
        </ChartCard>
        <ChartCard id="match-distribution-heading" title="Match Score Distribution">
          <MatchDistributionChart data={MOCK_SCORE_DISTRIBUTION} yTicks={[0, 25, 50, 75, 100]} />
        </ChartCard>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-14">
      <Suspense fallback={null}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
