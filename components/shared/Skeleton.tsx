import type { ReactNode } from "react";

/**
 * One pulsing placeholder block. Size and shape come from `className`. The colour is fixed per `tone` so every skeleton
 * matches: "card" for blocks on a white card, "page" for blocks sitting straight on the page background, where the card
 * tone would nearly vanish.
 */
export function Skeleton({ className = "", tone = "card" }: { className?: string; tone?: "card" | "page" }) {
  return <div aria-hidden="true" className={`rounded-md motion-safe:animate-pulse ${tone === "page" ? "bg-border" : "bg-surface-tertiary"} ${className}`} />;
}

/** A paragraph of placeholder lines; the last one is shorter, like the end of real text. */
export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div aria-hidden="true" className={`flex flex-col gap-2.5 ${className}`}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={`h-3.5 ${index === lines - 1 && lines > 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}

/**
 * Wraps a whole-page or whole-card skeleton so assistive tech hears one "Loading" message instead of nothing. The blocks
 * inside are `aria-hidden`.
 */
export function SkeletonRegion({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
