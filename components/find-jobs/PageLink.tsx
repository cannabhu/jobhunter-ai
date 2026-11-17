"use client";

import Link, { useLinkStatus } from "next/link";
import type { ReactNode } from "react";
import { useReportListingPending } from "@/components/find-jobs/JobsListingContext";

/** Sits inside the Link and tells the jobs list its page is loading, so the table shows placeholders at once. */
function PendingReporter() {
  const { pending } = useLinkStatus();
  useReportListingPending("page", pending);
  return null;
}

type Props = {
  href: string;
  className: string;
  children: ReactNode;
  "aria-label"?: string;
  "aria-current"?: "page";
};

/** A pagination link. Pages are never prefetched (one per page number), so the click waits for the server; this shows it. */
export function PageLink({ href, className, children, ...aria }: Props) {
  return (
    <Link href={href} prefetch={false} className={className} {...aria}>
      {children}
      <PendingReporter />
    </Link>
  );
}
