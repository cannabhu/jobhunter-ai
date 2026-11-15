import { Briefcase, Calendar, DollarSign, MapPin, type LucideIcon } from "lucide-react";
import { jobTypeLabel } from "@/lib/jobDetails";
import type { JobDetail } from "@/types";

type Props = {
  job: Pick<JobDetail, "salary" | "location" | "jobType" | "foundLabel">;
};

type InfoCard = {
  label: string;
  value: string;
  icon: LucideIcon;
  tileClass: string;
};

export function JobInfo({ job }: Props) {
  const cards: InfoCard[] = [
    { label: "Salary Est.", value: job.salary ?? "—", icon: DollarSign, tileClass: "bg-success-lightest text-success-alt" },
    { label: "Location", value: job.location ?? "—", icon: MapPin, tileClass: "bg-info-lightest text-info-medium" },
    { label: "Job Type", value: jobTypeLabel(job.jobType), icon: Briefcase, tileClass: "bg-accent-muted text-accent" },
    { label: "Date Found", value: job.foundLabel, icon: Calendar, tileClass: "bg-surface-tertiary text-text-secondary" },
  ];

  return (
    <section aria-label="Job summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, tileClass }) => (
        <div key={label} className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-surface p-4 shadow-card">
          <span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${tileClass}`}>
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary" title={value}>
              {value}
            </p>
            <p className="mt-0.5 text-xs font-medium tracking-wide text-text-muted uppercase">{label}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
