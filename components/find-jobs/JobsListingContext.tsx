"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/**
 * Who is changing the jobs list right now. "search" is the Find Jobs run (new jobs are on the way, the old rows are still
 * good); "filters" and "page" mean the rows on screen are about to be replaced, so the table shows placeholders instead.
 */
export type ListingSource = "search" | "filters" | "page";

type ListingState = {
  /** A Find Jobs search is running. */
  searching: boolean;
  /** The filters, sort or page changed and the new rows have not arrived. */
  loading: boolean;
  setPending: (source: ListingSource, pending: boolean) => void;
};

const ListingContext = createContext<ListingState | null>(null);

/**
 * Shares the jobs list's pending state between the search card, the filter bar, the pagination links and the results
 * card, which sit apart in the tree. Server-rendered content passes through as `children`.
 */
export function JobsListingProvider({ children }: { children: ReactNode }) {
  const [pending, setPendingSources] = useState<ReadonlySet<ListingSource>>(() => new Set());

  // Stable, so a reporter's effect does not re-run (and flip its own flag) every time any source changes.
  const setPending = useCallback((source: ListingSource, isPending: boolean) => {
    setPendingSources((current) => {
      if (current.has(source) === isPending) return current;
      const next = new Set(current);
      if (isPending) next.add(source);
      else next.delete(source);
      return next;
    });
  }, []);

  const value = useMemo<ListingState>(
    () => ({ searching: pending.has("search"), loading: pending.has("filters") || pending.has("page"), setPending }),
    [pending, setPending],
  );

  return <ListingContext.Provider value={value}>{children}</ListingContext.Provider>;
}

export function useJobsListing(): ListingState {
  const state = useContext(ListingContext);
  if (!state) throw new Error("useJobsListing must be used inside JobsListingProvider");
  return state;
}

/** Reports `pending` for `source` while the component is mounted, and clears it on unmount. */
export function useReportListingPending(source: ListingSource, pending: boolean): void {
  const { setPending } = useJobsListing();
  useEffect(() => {
    setPending(source, pending);
    return () => setPending(source, false);
  }, [setPending, source, pending]);
}
