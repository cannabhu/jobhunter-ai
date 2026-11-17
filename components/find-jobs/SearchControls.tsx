"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Search, Sparkles } from "lucide-react";
import { useReportListingPending } from "@/components/find-jobs/JobsListingContext";
import { labelClass } from "@/components/profile/fieldStyles";
import { AsyncActionButton } from "@/components/shared/AsyncActionButton";
import { FIND_JOBS_PATH, MAX_SEARCH_TEXT_LENGTH } from "@/lib/findJobs";
import type { FindJobsResponse } from "@/types";

const inputClass =
  "w-full rounded-md border border-border bg-surface py-2.5 text-sm text-text-primary shadow-card placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-70";

const SEARCH_FAILED = "We couldn't complete your search. Please try again.";

type SearchError = { message: string; needsProfile: boolean };

export function SearchControls() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<SearchError | null>(null);
  // Held until the refreshed page has the new rows, so the button and the table placeholders do not drop out early.
  const busy = pending || refreshing;
  useReportListingPending("search", busy);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const form = new FormData(event.currentTarget);
    const jobTitle = String(form.get("jobTitle") ?? "").trim();
    const location = String(form.get("location") ?? "").trim();
    if (jobTitle === "") {
      setMessage(null);
      setError({ message: "Enter a job title to search for.", needsProfile: false });
      return;
    }

    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(FIND_JOBS_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, location }),
      });
      const result: FindJobsResponse | null = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        setError({ message: result && !result.success ? result.error : SEARCH_FAILED, needsProfile: response.status === 422 });
        return;
      }
      setMessage(result.data.message);
      startRefresh(() => router.refresh());
    } catch (searchError) {
      console.error("[SearchControls]", searchError);
      setError({ message: SEARCH_FAILED, needsProfile: false });
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-label="Search jobs" className="rounded-xl border border-border bg-surface p-6 shadow-card">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="job-title" className={`${labelClass} mb-1.5`}>
            Job title
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            />
            <input
              id="job-title"
              name="jobTitle"
              type="text"
              maxLength={MAX_SEARCH_TEXT_LENGTH}
              placeholder="Frontend Engineer"
              disabled={busy}
              className={`${inputClass} pr-4 pl-9`}
            />
          </div>
        </div>
        <div className="flex-1">
          <label htmlFor="location" className={`${labelClass} mb-1.5`}>
            Location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            maxLength={MAX_SEARCH_TEXT_LENGTH}
            placeholder="Remote, New York..."
            disabled={busy}
            className={`${inputClass} px-4`}
          />
        </div>
        <AsyncActionButton
          type="submit"
          busy={busy}
          icon={Search}
          idleLabel="Find Jobs"
          busyLabel="Searching..."
          className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-accent px-5 text-sm font-medium text-accent-foreground shadow-card hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-70"
        />
      </form>
      {pending ? (
        <p role="status" className="mt-4 text-sm text-text-secondary">
          Searching and scoring jobs against your profile. This can take up to a minute.
        </p>
      ) : null}
      {message ? (
        <p
          role="status"
          className="mt-4 flex min-h-11 items-center gap-2 rounded-md border border-success-light bg-success-lightest px-3.5 py-2 text-sm font-medium text-success-foreground"
        >
          <Sparkles className="size-4 shrink-0 text-success-alt" aria-hidden="true" />
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-4 text-sm text-error">
          {error.message}
          {error.needsProfile ? (
            <>
              {" "}
              <Link href="/profile" className="font-medium underline underline-offset-2">
                Go to your profile
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
    </section>
  );
}
