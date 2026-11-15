"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import posthog from "posthog-js";

type TrackedLinkProps = ComponentProps<typeof Link> & {
  /** Where on the page the link lives, e.g. "hero", "bottom_cta", "navbar". */
  location: string;
};

/** A next/link that fires `cta_clicked` before navigating. */
export function TrackedLink({ location, href, children, onClick, ...props }: TrackedLinkProps) {
  return (
    <Link
      href={href}
      onClick={(event) => {
        posthog.capture("cta_clicked", {
          location,
          destination: typeof href === "string" ? href : (href.pathname ?? ""),
          label: typeof children === "string" ? children : undefined,
        });
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </Link>
  );
}
