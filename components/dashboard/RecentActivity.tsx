import Link from "next/link";
import type { ActivityEntry, ActivityTone } from "@/types";

type Props = {
  entries: ActivityEntry[];
};

const RING_CLASS: Record<ActivityTone, string> = {
  accent: "bg-accent-light",
  info: "bg-info-light",
  success: "bg-success-light",
};

const DOT_CLASS: Record<ActivityTone, string> = {
  accent: "bg-accent",
  info: "bg-info",
  success: "bg-success-alt",
};

export function RecentActivity({ entries }: Props) {
  return (
    <section aria-labelledby="recent-activity-heading" className="flex flex-col rounded-xl border border-border bg-surface shadow-card">
      <h2 id="recent-activity-heading" className="border-b border-border px-6 py-5 text-base font-semibold text-text-primary">
        Recent Activity
      </h2>
      {entries.length === 0 ? (
        <p className="px-6 py-16 text-center text-sm text-text-muted">No activity yet. Search for jobs to get started.</p>
      ) : (
        <ol className="px-6 pt-6 pb-6">
          {entries.map((entry, index) => (
            <li key={entry.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span aria-hidden="true" className={`flex size-4 shrink-0 items-center justify-center rounded-full ${RING_CLASS[entry.tone]}`}>
                  <span className={`size-2 rounded-full ${DOT_CLASS[entry.tone]}`} />
                </span>
                {index < entries.length - 1 ? <span aria-hidden="true" className="mt-1 w-px flex-1 bg-border" /> : null}
              </div>
              <div className={index < entries.length - 1 ? "pb-6.5" : ""}>
                <p className="text-sm leading-4 font-medium text-text-primary">
                  {entry.href ? (
                    <Link href={entry.href} className="hover:text-accent hover:underline hover:underline-offset-2 focus-visible:text-accent">
                      {entry.message}
                    </Link>
                  ) : (
                    entry.message
                  )}
                </p>
                <p className="mt-1.5 text-xs text-text-muted">{entry.timeLabel}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
