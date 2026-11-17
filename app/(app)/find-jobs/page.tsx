import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FindJobsSkeleton } from "@/components/find-jobs/FindJobsSkeleton";
import { JobFilters } from "@/components/find-jobs/JobFilters";
import { JobsListingProvider } from "@/components/find-jobs/JobsListingContext";
import { JobsPagination } from "@/components/find-jobs/JobsPagination";
import { JobsResultsCard } from "@/components/find-jobs/JobsResultsCard";
import { JobsTable } from "@/components/find-jobs/JobsTable";
import { SearchControls } from "@/components/find-jobs/SearchControls";
import { JOBS_PAGE_SIZE, listJobs } from "@/lib/insforge/jobs";
import { createInsforgeServer, getUser } from "@/lib/insforge/server";
import { hasActiveFilters, parseJobsQuery } from "@/lib/jobsQuery";
import { buildPageItems } from "@/lib/pagination";

export const metadata: Metadata = {
  title: "Find Jobs — JobPilot",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function FindJobsContent({ searchParams }: { searchParams: SearchParams }) {
  const user = await getUser();
  if (!user) redirect("/login?error=session");

  const query = parseJobsQuery(await searchParams);
  const insforge = await createInsforgeServer();
  const { jobs, total, page } = await listJobs(insforge, user.id, query);
  const firstRow = (page - 1) * JOBS_PAGE_SIZE + 1;

  return (
    <>
      <JobFilters query={query} />
      <JobsResultsCard
        hasJobs={jobs.length > 0}
        table={<JobsTable jobs={jobs} filtered={hasActiveFilters(query)} />}
        footer={
          jobs.length > 0 ? (
            <>
              <JobsPagination
                query={query}
                currentPage={page}
                pages={buildPageItems(Math.ceil(total / JOBS_PAGE_SIZE), page)}
                from={firstRow}
                to={firstRow + jobs.length - 1}
                total={total}
              />
              <p className="border-t border-border px-6 py-3 text-xs text-text-muted">
                Jobs by{" "}
                <a href="https://www.adzuna.com" target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-2 hover:text-text-secondary">
                  Adzuna
                </a>
              </p>
            </>
          ) : null
        }
      />
    </>
  );
}

export default function FindJobsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-14">
      <JobsListingProvider>
        <div className="flex flex-col gap-6">
          <h1 className="sr-only">Find Jobs</h1>
          {/* The search card has no data of its own, so it is usable at once; only the filters and rows wait. */}
          <SearchControls />
          <Suspense fallback={<FindJobsSkeleton />}>
            <FindJobsContent searchParams={searchParams} />
          </Suspense>
        </div>
      </JobsListingProvider>
    </div>
  );
}
