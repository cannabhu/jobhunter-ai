import type { PaginationItem } from "@/types";

/** Page buttons for the jobs pagination: every page when there are few, else 1, 2, 3, an ellipsis and the last. */
export function buildPageItems(totalPages: number): PaginationItem[] {
  if (totalPages <= 4) return Array.from({ length: totalPages }, (_, index) => index + 1);
  return [1, 2, 3, "ellipsis", totalPages];
}
