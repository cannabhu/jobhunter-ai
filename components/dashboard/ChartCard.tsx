import type { ReactNode } from "react";

type Props = {
  id: string;
  title: string;
  /** The period the chart covers, e.g. "Last 30 days". Shown beside the title so the chart can be compared with the stat cards. */
  window?: string;
  children: ReactNode;
  className?: string;
};

/** Card shell for a dashboard chart. The chart fills an absolutely positioned box so it always has a definite size. */
export function ChartCard({ id, title, window, children, className = "" }: Props) {
  return (
    <section aria-labelledby={id} className={`flex flex-col rounded-xl border border-border bg-surface p-6 shadow-card ${className}`}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 id={id} className="text-base font-semibold text-text-primary">
          {title}
        </h2>
        {window ? <span className="shrink-0 text-xs text-text-muted">{window}</span> : null}
      </div>
      <div className="relative mt-6 min-h-[280px] flex-1">
        <div className="absolute inset-0">{children}</div>
      </div>
    </section>
  );
}
