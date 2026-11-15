import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { JobFilters } from "@/components/find-jobs/JobFilters";
import { JobsPagination } from "@/components/find-jobs/JobsPagination";
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
    <div className="flex flex-col gap-6">
      <h1 className="sr-only">Find Jobs</h1>
      <SearchControls />
      <JobFilters query={query} />
      <section aria-label="Jobs" className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        <JobsTable jobs={jobs} filtered={hasActiveFilters(query)} />
        {jobs.length > 0 ? (
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
        ) : null}
      </section>
    </div>
  );
}

export default function FindJobsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-14">
      <Suspense fallback={null}>
        <FindJobsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
