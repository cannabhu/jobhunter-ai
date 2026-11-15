"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { FilterSelect } from "@/components/find-jobs/FilterSelect";
import { MAX_SEARCH_TEXT_LENGTH } from "@/lib/findJobs";
import { JOB_SORTS, MATCH_FILTERS, buildJobsHref } from "@/lib/jobsQuery";
import type { JobSort, JobsQuery, MatchFilter } from "@/types";

type Props = {
  query: JobsQuery;
};

type Filters = Pick<JobsQuery, "query" | "match" | "sort">;

const MATCH_OPTIONS: { value: MatchFilter; label: string }[] = [
  { value: "all", label: "All Matches" },
  { value: "high", label: "High Match" },
  { value: "low", label: "Low Match" },
];

const SORT_OPTIONS: { value: JobSort; label: string }[] = [
  { value: "match", label: "Match Score" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
];

/** Wait for a pause in typing, so each keystroke doesn't query the database. */
const TYPING_PAUSE_MS = 300;

export function JobFilters({ query }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [match, setMatch] = useOptimistic(query.match);
  const [sort, setSort] = useOptimistic(query.sort);
  const [text, setText] = useState(query.query);
  const [isTyping, setIsTyping] = useState(false);
  const pauseTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(pauseTimer.current), []);

  // Follow the URL when it changes without the user typing (back/forward), but never overwrite text being typed.
  if (!isTyping && !isPending && text.trim() !== query.query) setText(query.query);

  // Any filter change goes back to page 1: the old page number may not exist in the new result.
  function apply(next: Filters) {
    clearTimeout(pauseTimer.current);
    setIsTyping(false);
    startTransition(() => {
      setMatch(next.match);
      setSort(next.sort);
      router.replace(buildJobsHref({ ...next, page: 1 }), { scroll: false });
    });
  }

  function handleTextChange(value: string) {
    setText(value);
    setIsTyping(true);
    clearTimeout(pauseTimer.current);
    pauseTimer.current = setTimeout(() => {
      const trimmed = value.trim();
      if (trimmed === query.query) {
        setIsTyping(false);
        return;
      }
      apply({ query: trimmed, match, sort });
    }, TYPING_PAUSE_MS);
  }

  function handleMatchChange(value: string) {
    const next = MATCH_FILTERS.find((option) => option === value);
    if (next) apply({ query: text.trim(), match: next, sort });
  }

  function handleSortChange(value: string) {
    const next = JOB_SORTS.find((option) => option === value);
    if (next) apply({ query: text.trim(), match, sort: next });
  }

  return (
    <section
      aria-label="Filter jobs"
      aria-busy={isPending}
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
          value={text}
          maxLength={MAX_SEARCH_TEXT_LENGTH}
          onChange={(event) => handleTextChange(event.target.value)}
          aria-label="Filter by company or role"
          placeholder="Filter by company or role..."
          className="w-full bg-transparent py-1.5 pr-3 pl-7 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
      </div>
      <div className="flex h-8 items-center gap-2 sm:border-l sm:border-border sm:pl-4">
        <FilterSelect
          label="Filter by match"
          name="match"
          options={MATCH_OPTIONS}
          value={match}
          onChange={handleMatchChange}
          emphasized
        />
        <FilterSelect label="Sort jobs" name="sort" options={SORT_OPTIONS} value={sort} onChange={handleSortChange} />
      </div>
    </section>
  );
}
