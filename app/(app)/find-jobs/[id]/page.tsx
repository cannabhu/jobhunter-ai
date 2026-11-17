import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { CompanyResearch } from "@/components/job-details/CompanyResearch";
import { CoverLetter } from "@/components/job-details/CoverLetter";
import { JobActions } from "@/components/job-details/JobActions";
import { JobDetailsSkeleton } from "@/components/job-details/JobDetailsSkeleton";
import { JobDescription } from "@/components/job-details/JobDescription";
import { JobHeader } from "@/components/job-details/JobHeader";
import { JobInfo } from "@/components/job-details/JobInfo";
import { MatchReasoning } from "@/components/job-details/MatchReasoning";
import { SkillsComparison } from "@/components/job-details/SkillsComparison";
import { resolveTone } from "@/lib/coverLetter";
import { isJobId } from "@/lib/jobDetails";
import { getJobDetail } from "@/lib/insforge/jobs";
import { getProfile } from "@/lib/insforge/profile";
import { createInsforgeServer, getUser } from "@/lib/insforge/server";
import { FIND_JOBS_PAGE_PATH } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Job Details — JobPilot",
};

type Params = Promise<{ id: string }>;

async function JobDetailsContent({ params }: { params: Params }) {
  const user = await getUser();
  if (!user) redirect("/login?error=session");

  const { id } = await params;
  if (!isJobId(id)) notFound();

  const insforge = await createInsforgeServer();
  // The profile only supplies the tone the picker starts on, so it loads alongside the job instead of after it.
  const [job, profile] = await Promise.all([getJobDetail(insforge, user.id, id), getProfile()]);
  if (!job) notFound();

  // The saved letter's tone, else the profile's (formal when unset or the profile is unavailable).
  const defaultTone = resolveTone(job.coverLetter?.tone ?? profile?.cover_letter_tone);

  return (
    <div className="flex flex-col gap-6">
      <JobHeader title={job.title} company={job.company} matchScore={job.matchScore} postUrl={job.sourceUrl} />
      <JobInfo job={job} />
      <MatchReasoning reason={job.matchReason} />
      <SkillsComparison matched={job.matchedSkills} missing={job.missingSkills} />
      <JobDescription description={job.aboutRole} postUrl={job.sourceUrl} />
      <CompanyResearch
        jobId={job.id}
        company={job.company}
        dossier={job.companyResearch}
        researchedLabel={job.researchedLabel}
      />
      {/* Keyed on the generated time: a new letter remounts the card so its textarea starts from the new text. */}
      <CoverLetter
        key={job.coverLetter?.generatedAt ?? "none"}
        jobId={job.id}
        company={job.company}
        letter={job.coverLetter}
        defaultTone={defaultTone}
      />
      <JobActions company={job.company} applyUrl={job.sourceUrl} />
    </div>
  );
}

export default function JobDetailsPage({ params }: { params: Params }) {
  return (
    <div className="mx-auto flex w-full max-w-[844px] flex-col gap-6 px-4 pt-8 pb-12 sm:px-6">
      <Link
        href={FIND_JOBS_PAGE_PATH}
        className="mb-1 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-text-dark hover:text-text-primary"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Back to Jobs
      </Link>
      <Suspense fallback={<JobDetailsSkeleton />}>
        <JobDetailsContent params={params} />
      </Suspense>
    </div>
  );
}
