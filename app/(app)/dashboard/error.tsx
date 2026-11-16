"use client";

import { TriangleAlert, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import posthog from "posthog-js";

/**
 * Route-level fallback for the dashboard. The chart readers never reject, so this only catches something unexpected
 * (a database helper throwing, a bad render). It sits inside the (app) layout, so the navbar stays usable.
 * The raw error is reported, never shown.
 */
export default function DashboardError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    posthog.captureException(error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-14">
      <section
        role="alert"
        aria-labelledby="dashboard-error-heading"
        className="flex flex-col items-center rounded-xl border border-border bg-surface px-6 py-16 text-center shadow-card"
      >
        <span className="flex size-12 items-center justify-center rounded-xl bg-surface-tertiary">
          <TriangleAlert className="size-6 text-error" aria-hidden="true" />
        </span>
        <h1 id="dashboard-error-heading" className="mt-3 text-base font-semibold text-text-primary">
          Couldn&apos;t load your dashboard
        </h1>
        <p className="mt-1 max-w-xs text-sm text-text-muted">
          Something went wrong on our side. Your jobs and profile are safe. Try again in a moment.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-card hover:bg-accent-dark"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Try again
        </button>
      </section>
    </div>
  );
}
