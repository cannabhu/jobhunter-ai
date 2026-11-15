import type { PaginationItem } from "@/types";

/**
 * Page buttons for the jobs pagination: every page when there are few, otherwise the first and last page
 * plus the current page and its neighbours, with an ellipsis for each gap. Near either end it keeps the
 * design's shape: 1 2 3 … last.
 */
export function buildPageItems(totalPages: number, currentPage: number): PaginationItem[] {
  if (totalPages <= 4) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (currentPage <= 3) return [1, 2, 3, "ellipsis", totalPages];
  if (currentPage >= totalPages - 2) return [1, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
  return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages];
}
