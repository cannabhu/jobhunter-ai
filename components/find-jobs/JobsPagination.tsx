import Link from "next/link";
import { buildJobsHref } from "@/lib/jobsQuery";
import type { JobsQuery, PaginationItem } from "@/types";

type Props = {
  /** The active filters and sort, kept in every page link. */
  query: JobsQuery;
  currentPage: number;
  pages: PaginationItem[];
  from: number;
  to: number;
  total: number;
};

const baseButtonClass = "inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-3 text-sm font-medium shadow-card";
const buttonClass = `${baseButtonClass} border-border bg-surface text-text-dark hover:bg-surface-secondary`;
const disabledButtonClass = `${baseButtonClass} cursor-not-allowed border-border bg-surface text-text-muted`;
const currentButtonClass = `${baseButtonClass} border-accent-light bg-accent-muted text-accent`;

export function JobsPagination({ query, currentPage, pages, from, to, total }: Props) {
  const lastPage = pages.reduce<number>((max, item) => (typeof item === "number" ? Math.max(max, item) : max), 1);
  const hrefFor = (page: number): string => buildJobsHref({ ...query, page });

  return (
    <div className="flex flex-col gap-3 border-t border-border bg-surface-secondary/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-text-secondary">
        Showing <span className="font-semibold text-text-primary">{from}</span> to{" "}
        <span className="font-semibold text-text-primary">{to}</span> of{" "}
        <span className="font-semibold text-text-primary">{total}</span> results
      </p>
      <nav aria-label="Pagination" className="flex flex-wrap items-center gap-2">
        {currentPage > 1 ? (
          <Link href={hrefFor(currentPage - 1)} prefetch={false} className={buttonClass}>
            Previous
          </Link>
        ) : (
          <span aria-disabled="true" className={disabledButtonClass}>
            Previous
          </span>
        )}
        {pages.map((item, index) =>
          item === "ellipsis" ? (
            <span key={`ellipsis-${index}`} aria-hidden="true" className="px-2 text-sm text-text-muted">
              ...
            </span>
          ) : (
            <Link
              key={item}
              href={hrefFor(item)}
              prefetch={false}
              aria-label={`Page ${item}`}
              aria-current={item === currentPage ? "page" : undefined}
              className={item === currentPage ? currentButtonClass : buttonClass}
            >
              {item}
            </Link>
          ),
        )}
        {currentPage < lastPage ? (
          <Link href={hrefFor(currentPage + 1)} prefetch={false} className={buttonClass}>
            Next
          </Link>
        ) : (
          <span aria-disabled="true" className={disabledButtonClass}>
            Next
          </span>
        )}
      </nav>
    </div>
  );
}
