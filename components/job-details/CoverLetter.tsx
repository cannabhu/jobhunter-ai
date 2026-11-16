"use client";

import { useEffect, useState } from "react";
import { Check, Copy, FileText, LoaderCircle, RefreshCw } from "lucide-react";
import { SectionIcon } from "@/components/job-details/SectionIcon";
import type { CoverLetterTone, SavedCoverLetter } from "@/types";

type Props = {
  company: string;
  /** Null until a letter has been generated for this job. */
  letter: SavedCoverLetter | null;
};

const TONE_LABEL: Record<CoverLetterTone, string> = {
  formal: "Formal",
  casual: "Casual",
  enthusiastic: "Enthusiastic",
};

const COPIED_MS = 2000;

const buttonClass =
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-card disabled:cursor-not-allowed disabled:opacity-70";
const primaryButtonClass = "bg-accent text-accent-foreground hover:bg-accent-dark";
const secondaryButtonClass = "border border-border bg-surface text-text-primary hover:bg-surface-secondary";

const countWords = (text: string): number => text.trim().split(/\s+/).filter(Boolean).length;

/**
 * The Cover Letter card on the job details page. Feature 18 is the UI only: Generate, Regenerate and Save changes
 * have no effect yet, and `busy`, `error` and `saved` are set by feature 19.
 */
export function CoverLetter({ company, letter }: Props) {
  const [text, setText] = useState(letter?.text ?? "");
  const [copied, setCopied] = useState(false);
  const [confirmingReplace, setConfirmingReplace] = useState(false);
  const [busy] = useState(false);
  const [error] = useState<string | null>(null);
  const [saved] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const hasLetter = letter !== null;
  const dirty = hasLetter && text !== letter.text;
  // Saved edits or unsaved typing: either way Regenerate would throw the user's own words away.
  const hasEdits = hasLetter && (letter.edited || dirty);
  const words = countWords(text);

  function generate() {
    // Feature 19 posts to the cover letter route here.
    setConfirmingReplace(false);
  }

  function handleHeaderClick() {
    if (hasEdits) {
      setConfirmingReplace(true);
      return;
    }
    generate();
  }

  function handleSave() {
    // Feature 19 calls the save action here.
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch (copyError) {
      console.error("[CoverLetter] copy failed", copyError);
    }
  }

  const HeaderIcon = busy ? LoaderCircle : hasLetter ? RefreshCw : FileText;
  const headerLabel = busy ? "Writing your cover letter..." : hasLetter ? "Regenerate" : "Generate Cover Letter";
  const CopyIcon = copied ? Check : Copy;

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div className="flex items-center gap-2.5">
          <SectionIcon tone="accent">
            <FileText />
          </SectionIcon>
          <h2 className="text-base font-semibold text-text-primary">Cover Letter</h2>
        </div>
        <button
          type="button"
          onClick={handleHeaderClick}
          disabled={busy || confirmingReplace}
          className={`${buttonClass} ${hasLetter ? secondaryButtonClass : primaryButtonClass}`}
        >
          <HeaderIcon className={`size-4 ${busy ? "animate-spin" : ""}`} aria-hidden="true" />
          {headerLabel}
        </button>
      </div>

      {confirmingReplace ? (
        <div
          role="alertdialog"
          aria-label="Replace your edited letter?"
          className="flex flex-col gap-3 border-b border-border bg-surface-secondary px-6 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-text-primary">
            <span className="font-semibold">This replaces your edited letter.</span> A new one is written from your profile and this job.
          </p>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={() => setConfirmingReplace(false)} className={`${buttonClass} ${secondaryButtonClass}`}>
              Cancel
            </button>
            <button type="button" onClick={generate} className={`${buttonClass} ${primaryButtonClass}`}>
              Replace and regenerate
            </button>
          </div>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="border-b border-border px-6 py-3 text-sm text-error">
          {error}
        </p>
      ) : null}

      {hasLetter ? (
        <div className="flex flex-col gap-4 px-6 py-6">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-muted">
            <span>
              {TONE_LABEL[letter.tone]} tone · Generated {letter.generatedLabel}
            </span>
            {letter.edited ? (
              <span className="rounded-full bg-surface-secondary px-2 py-0.5 font-medium text-text-secondary">Edited</span>
            ) : null}
          </p>
          <textarea
            aria-label={`Cover letter for ${company}`}
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={18}
            disabled={busy}
            className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm leading-6 text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none disabled:bg-surface-tertiary disabled:text-text-muted"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-text-muted">
              {words} {words === 1 ? "word" : "words"}
              {saved ? (
                <span role="status" className="ml-2 font-medium text-success-foreground">
                  Saved
                </span>
              ) : null}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => void handleCopy()} disabled={text.trim() === ""} className={`${buttonClass} ${secondaryButtonClass}`}>
                <CopyIcon className="size-4" aria-hidden="true" />
                {copied ? "Copied" : "Copy"}
              </button>
              <button type="button" onClick={handleSave} disabled={!dirty || busy} className={`${buttonClass} ${primaryButtonClass}`}>
                Save changes
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-xl bg-surface-tertiary">
            <FileText className="size-6 text-text-muted" />
          </span>
          <p className="mt-3 text-sm font-medium text-text-primary">No cover letter yet</p>
          <p className="mt-1 max-w-xs text-sm text-text-muted">
            Click “Generate Cover Letter” to write one for {company} from your profile, this job and the company research when it exists.
          </p>
        </div>
      )}
    </section>
  );
}
