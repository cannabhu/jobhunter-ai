import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { JobFilters } from "@/components/find-jobs/JobFilters";
import { JobsPagination } from "@/components/find-jobs/JobsPagination";
import { JobsTable } from "@/components/find-jobs/JobsTable";
import { SearchControls } from "@/components/find-jobs/SearchControls";
import { getUser } from "@/lib/insforge/server";
import { MOCK_JOBS, MOCK_PAGINATION, MOCK_SEARCH_MESSAGE } from "./mockJobs";

export const metadata: Metadata = {
  title: "Find Jobs — JobPilot",
};

async function FindJobsContent() {
  const user = await getUser();
  if (!user) redirect("/login?error=session");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="sr-only">Find Jobs</h1>
      <SearchControls resultMessage={MOCK_SEARCH_MESSAGE} />
      <JobFilters />
      <section aria-label="Jobs" className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        <JobsTable jobs={MOCK_JOBS} />
        {MOCK_JOBS.length > 0 ? <JobsPagination {...MOCK_PAGINATION} /> : null}
      </section>
    </div>
  );
}

export default function FindJobsPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-14">
      <Suspense fallback={null}>
        <FindJobsContent />
      </Suspense>
    </div>
  );
}
