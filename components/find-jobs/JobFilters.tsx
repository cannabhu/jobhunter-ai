import { Search } from "lucide-react";
import { FilterSelect } from "@/components/find-jobs/FilterSelect";

const MATCH_OPTIONS = [
  { value: "all", label: "All Matches" },
  { value: "high", label: "High Match" },
  { value: "low", label: "Low Match" },
];

const SORT_OPTIONS = [
  { value: "match", label: "Match Score" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
];

export function JobFilters() {
  return (
    <section
      aria-label="Filter jobs"
      className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-border bg-surface px-4 py-2.5 shadow-card"
    >
      <div className="relative min-w-48 flex-1 rounded-md focus-within:ring-1 focus-within:ring-accent">
        <Search
          className="pointer-events-none absolute top-1/2 left-1 size-4 -translate-y-1/2 text-text-muted"
          aria-hidden="true"
        />
        <input
          type="text"
          name="query"
          aria-label="Filter by company or role"
          placeholder="Filter by company or role..."
          className="w-full bg-transparent py-1.5 pr-3 pl-7 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
      </div>
      <div className="flex h-8 items-center gap-2 sm:border-l sm:border-border sm:pl-4">
        <FilterSelect label="Filter by match" name="match" options={MATCH_OPTIONS} defaultValue="all" emphasized />
        <FilterSelect label="Sort jobs" name="sort" options={SORT_OPTIONS} defaultValue="match" />
      </div>
    </section>
  );
}
