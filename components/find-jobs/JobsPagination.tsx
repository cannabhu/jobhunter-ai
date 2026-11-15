import type { PaginationItem } from "@/types";

type Props = {
  currentPage: number;
  pages: PaginationItem[];
  from: number;
  to: number;
  total: number;
};

const buttonClass =
  "h-8 min-w-8 cursor-pointer rounded-md border border-border bg-surface px-3 text-sm font-medium text-text-dark shadow-card hover:bg-surface-secondary disabled:cursor-not-allowed disabled:text-text-muted disabled:hover:bg-surface";

export function JobsPagination({ currentPage, pages, from, to, total }: Props) {
  const lastPage = pages.reduce<number>((max, item) => (typeof item === "number" ? Math.max(max, item) : max), 1);

  return (
    <div className="flex flex-col gap-3 border-t border-border bg-surface-secondary/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-text-secondary">
        Showing <span className="font-semibold text-text-primary">{from}</span> to{" "}
        <span className="font-semibold text-text-primary">{to}</span> of{" "}
        <span className="font-semibold text-text-primary">{total}</span> results
      </p>
      <nav aria-label="Pagination" className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={currentPage <= 1} className={buttonClass}>
          Previous
        </button>
        {pages.map((item, index) =>
          item === "ellipsis" ? (
            <span key={`ellipsis-${index}`} aria-hidden="true" className="px-2 text-sm text-text-muted">
              ...
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-label={`Page ${item}`}
              aria-current={item === currentPage ? "page" : undefined}
              className={
                item === currentPage
                  ? "h-8 min-w-8 cursor-pointer rounded-md border border-accent-light bg-accent-muted px-3 text-sm font-medium text-accent shadow-card"
                  : buttonClass
              }
            >
              {item}
            </button>
          ),
        )}
        <button type="button" disabled={currentPage >= lastPage} className={buttonClass}>
          Next
        </button>
      </nav>
    </div>
  );
}
