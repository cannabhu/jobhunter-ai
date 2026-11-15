import { Building2, Search } from "lucide-react";
import { SectionIcon } from "@/components/job-details/SectionIcon";

type Props = {
  company: string;
};

// Empty state only: the research agent and the dossier view arrive with feature 13, which also wires the button.
export function CompanyResearch({ company }: Props) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div className="flex items-center gap-2.5">
          <SectionIcon tone="accent">
            <Building2 />
          </SectionIcon>
          <h2 className="text-base font-semibold text-text-primary">Company Research</h2>
        </div>
        <button
          type="button"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-card hover:bg-accent-dark"
        >
          <Search className="size-4" aria-hidden="true" />
          Research Company
        </button>
      </div>
      <div className="flex flex-col items-center px-6 py-12 text-center">
        <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-xl bg-surface-tertiary">
          <Building2 className="size-6 text-text-muted" />
        </span>
        <p className="mt-3 text-sm font-medium text-text-primary">No research yet</p>
        <p className="mt-1 max-w-xs text-sm text-text-muted">
          Click “Research Company” to let the AI browse {company}&apos;s public pages and build a dossier.
        </p>
      </div>
    </section>
  );
}
