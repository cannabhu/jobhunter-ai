import type { ReactNode } from "react";

type Props = {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
};

/** Card shell for a dashboard chart. The chart fills an absolutely positioned box so it always has a definite size. */
export function ChartCard({ id, title, children, className = "" }: Props) {
  return (
    <section aria-labelledby={id} className={`flex flex-col rounded-xl border border-border bg-surface p-6 shadow-card ${className}`}>
      <h2 id={id} className="text-base font-semibold text-text-primary">
        {title}
      </h2>
      <div className="relative mt-6 min-h-[280px] flex-1">
        <div className="absolute inset-0">{children}</div>
      </div>
    </section>
  );
}
