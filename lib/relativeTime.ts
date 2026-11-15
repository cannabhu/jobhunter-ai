const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const plural = (count: number, unit: string): string => `${count} ${unit}${count === 1 ? "" : "s"} ago`;

/** "Just now", "5 minutes ago", "2 hours ago", "Yesterday", "3 days ago", then a short date. */
export function formatFoundLabel(iso: string, now: number = Date.now()): string {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return "—";

  const elapsed = Math.max(0, now - time);
  if (elapsed < MINUTE_MS) return "Just now";
  if (elapsed < HOUR_MS) return plural(Math.floor(elapsed / MINUTE_MS), "minute");
  if (elapsed < DAY_MS) return plural(Math.floor(elapsed / HOUR_MS), "hour");

  const days = Math.floor(elapsed / DAY_MS);
  if (days === 1) return "Yesterday";
  if (days < 7) return plural(days, "day");
  return new Date(time).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
