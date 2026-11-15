import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { JobFilters } from "@/components/find-jobs/JobFilters";
import { JobsPagination } from "@/components/find-jobs/JobsPagination";
import { JobsTable } from "@/components/find-jobs/JobsTable";
import { SearchControls } from "@/components/find-jobs/SearchControls";
import { JOBS_PAGE_SIZE, listJobs } from "@/lib/insforge/jobs";
import { createInsforgeServer, getUser } from "@/lib/insforge/server";
import { buildPageItems } from "@/lib/pagination";

export const metadata: Metadata = {
  title: "Find Jobs — JobPilot",
};

async function FindJobsContent() {
  const user = await getUser();
  if (!user) redirect("/login?error=session");

  const insforge = await createInsforgeServer();
  const { jobs, total } = await listJobs(insforge, user.id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="sr-only">Find Jobs</h1>
      <SearchControls />
      <JobFilters />
      <section aria-label="Jobs" className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        <JobsTable jobs={jobs} />
        {jobs.length > 0 ? (
          <>
            <JobsPagination
              currentPage={1}
              pages={buildPageItems(Math.ceil(total / JOBS_PAGE_SIZE))}
              from={1}
              to={jobs.length}
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

export default function FindJobsPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-14">
      <Suspense fallback={null}>
        <FindJobsContent />
      </Suspense>
    </div>
  );
}
