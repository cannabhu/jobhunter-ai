import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { ChartSkeleton } from "@/components/dashboard/ChartSkeleton";
import { JobsOverTimeSection } from "@/components/dashboard/JobsOverTimeSection";
import { MatchDistributionSection } from "@/components/dashboard/MatchDistributionSection";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { ResearchActivitySection } from "@/components/dashboard/ResearchActivitySection";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { CompletionIndicator } from "@/components/profile/CompletionIndicator";
import { buildStatCards } from "@/lib/dashboardStats";
import { getDashboardStats, getRecentActivity } from "@/lib/insforge/dashboard";
import { getProfile } from "@/lib/insforge/profile";
import { createInsforgeServer, getUser } from "@/lib/insforge/server";
import { getJobsByDay, getResearchByDay, getScoreDistribution } from "@/lib/posthog-dashboard";

export const metadata: Metadata = {
  title: "Dashboard — JobPilot",
};

async function DashboardContent() {
  const user = await getUser();
  if (!user) redirect("/login?error=session");

  // Start the chart queries now, so PostHog is working while the database queries below finish. The getters never reject.
  const jobsByDay = getJobsByDay(user.id);
  const researchByDay = getResearchByDay(user.id);
  const scoreDistribution = getScoreDistribution(user.id);

  const insforge = await createInsforgeServer();
  const [profile, stats, activity] = await Promise.all([
    getProfile(),
    getDashboardStats(insforge, user.id),
    getRecentActivity(insforge, user.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="sr-only">Dashboard</h1>
      {profile && !profile.is_complete ? (
        <CompletionIndicator percentage={profile.completion_percentage} missingFields={profile.missing_fields} actionHref="/profile" />
      ) : null}
      <StatsBar stats={buildStatCards(stats)} />
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentActivity entries={activity} />
        <ChartCard id="research-activity-heading" title="Company Research Activity" window="Last 7 days">
          <Suspense fallback={<ChartSkeleton />}>
            <ResearchActivitySection data={researchByDay} />
          </Suspense>
        </ChartCard>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard id="jobs-over-time-heading" title="Jobs Found Over Time" window="Last 30 days" className="lg:col-span-2">
          <Suspense fallback={<ChartSkeleton />}>
            <JobsOverTimeSection data={jobsByDay} />
          </Suspense>
        </ChartCard>
        <ChartCard id="match-distribution-heading" title="Match Score Distribution" window="Last 30 days">
          <Suspense fallback={<ChartSkeleton />}>
            <MatchDistributionSection data={scoreDistribution} />
          </Suspense>
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
