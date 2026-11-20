import { TrackedLink } from "@/components/analytics/TrackedLink";
import { SIGNED_IN_HOME } from "@/lib/routes";

export function CtaButtons({ isAuthed, location }: { isAuthed: boolean; location: string }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <TrackedLink
        location={location}
        href={isAuthed ? SIGNED_IN_HOME.href : "/login"}
        className="inline-flex items-center gap-2 rounded-md bg-overlay px-5 py-2.5 text-sm font-medium text-accent-foreground shadow-card hover:bg-overlay-dark"
      >
        {isAuthed ? SIGNED_IN_HOME.label : "Get Started"}
        <span aria-hidden className="text-[10px]">▶</span>
      </TrackedLink>
      <TrackedLink
        location={location}
        href={isAuthed ? "/find-jobs" : "/login"}
        className="rounded-md border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text-primary shadow-card hover:bg-surface-secondary"
      >
        Find Your First Match
      </TrackedLink>
    </div>
  );
}
