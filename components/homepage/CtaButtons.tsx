import Link from "next/link";

export function CtaButtons() {
  return (
    <div className="flex items-center justify-center gap-3">
      <Link
        href="/login"
        className="inline-flex items-center gap-2 rounded-md bg-overlay px-5 py-2.5 text-sm font-medium text-accent-foreground shadow-card hover:bg-overlay-dark"
      >
        Get Started
        <span aria-hidden className="text-[10px]">▶</span>
      </Link>
      <Link
        href="/login"
        className="rounded-md border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text-primary shadow-card hover:bg-surface-secondary"
      >
        Find Your First Match
      </Link>
    </div>
  );
}
