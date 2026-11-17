"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Building2, RefreshCw, Search } from "lucide-react";
import { DossierSkeleton } from "@/components/job-details/DossierSkeleton";
import { DossierView } from "@/components/job-details/DossierView";
import { SectionIcon } from "@/components/job-details/SectionIcon";
import { AsyncActionButton } from "@/components/shared/AsyncActionButton";
import { ProgressSteps } from "@/components/shared/ProgressSteps";
import { useProgressAction } from "@/components/shared/useProgressAction";
import { RESEARCH_PATH, RESEARCH_STAGES } from "@/lib/companyResearch";
import type { CompanyDossier } from "@/types";

type Props = {
  jobId: string;
  company: string;
  dossier: CompanyDossier | null;
  researchedLabel: string | null;
};

const RESEARCH_FAILED = "We couldn't research this company. Please try again.";

const primaryButtonClass =
  "bg-accent text-accent-foreground hover:bg-accent-dark";
const secondaryButtonClass = "border border-border bg-surface text-text-primary hover:bg-surface-secondary";

export function CompanyResearch({ jobId, company, dossier, researchedLabel }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { progress, run } = useProgressAction<CompanyDossier>(RESEARCH_FAILED);
  // Held until the refreshed page has the saved dossier, so the card never flashes back to its old state.
  const busy = pending || refreshing;

  async function handleResearch() {
    if (busy) return;
    setPending(true);
    setError(null);
    try {
      const outcome = await run(RESEARCH_PATH, { jobId });
      if (!outcome.ok) {
        setError(outcome.error);
        // An interrupted stream may still have saved the dossier, so show whatever is there.
        if (outcome.interrupted) startRefresh(() => router.refresh());
        return;
      }
      startRefresh(() => router.refresh());
    } finally {
      setPending(false);
    }
  }

  const hasDossier = dossier !== null;

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div className="flex items-center gap-2.5">
          <SectionIcon tone="accent">
            <Building2 />
          </SectionIcon>
          <h2 className="text-base font-semibold text-text-primary">Company Research</h2>
        </div>
        <AsyncActionButton
          busy={busy}
          icon={hasDossier ? RefreshCw : Search}
          idleLabel={hasDossier ? "Refresh research" : "Research Company"}
          busyLabel="Researching..."
          onClick={handleResearch}
          className={`inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-card disabled:cursor-not-allowed disabled:opacity-70 ${hasDossier ? secondaryButtonClass : primaryButtonClass}`}
        />
      </div>

      {busy ? <ProgressSteps stages={RESEARCH_STAGES} progress={progress} label={`Progress researching ${company}`} /> : null}
      {error ? (
        <p role="alert" className="border-b border-border px-6 py-3 text-sm text-error">
          {error}
        </p>
      ) : null}

      {busy ? (
        <DossierSkeleton />
      ) : dossier ? (
        <DossierView dossier={dossier} researchedLabel={researchedLabel} />
      ) : (
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-xl bg-surface-tertiary">
            <Building2 className="size-6 text-text-muted" />
          </span>
          <p className="mt-3 text-sm font-medium text-text-primary">No research yet</p>
          <p className="mt-1 max-w-xs text-sm text-text-muted">
            Click “Research Company” to let the AI browse {company}&apos;s public pages and build a dossier.
          </p>
        </div>
      )}
    </section>
  );
}
