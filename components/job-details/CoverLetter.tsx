"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Check, Copy, FileText, RefreshCw } from "lucide-react";
import { saveCoverLetterEdits } from "@/actions/coverLetter";
import { LetterSkeleton } from "@/components/job-details/LetterSkeleton";
import { SectionIcon } from "@/components/job-details/SectionIcon";
import { AsyncActionButton } from "@/components/shared/AsyncActionButton";
import { FilterSelect } from "@/components/shared/FilterSelect";
import { ProgressSteps } from "@/components/shared/ProgressSteps";
import { useProgressAction } from "@/components/shared/useProgressAction";
import { COVER_LETTER_TONE_VALUES } from "@/lib/profileConstants";
import { COVER_LETTER_FAILED, COVER_LETTER_MAX_CHARS, COVER_LETTER_PATH, COVER_LETTER_STAGES, resolveTone } from "@/lib/coverLetter";
import type { CoverLetterTone, SavedCoverLetter } from "@/types";

type Props = {
  jobId: string;
  company: string;
  /** Null until a letter has been generated for this job. */
  letter: SavedCoverLetter | null;
  /** The tone the picker starts on: the letter's, else the profile's. */
  defaultTone: CoverLetterTone;
};

const TONE_LABEL: Record<CoverLetterTone, string> = {
  formal: "Formal",
  casual: "Casual",
  enthusiastic: "Enthusiastic",
};

const TONE_OPTIONS = COVER_LETTER_TONE_VALUES.map((value) => ({ value, label: TONE_LABEL[value] }));

const COPIED_MS = 2000;

const buttonClass =
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-card disabled:cursor-not-allowed disabled:opacity-70";
const primaryButtonClass = "bg-accent text-accent-foreground hover:bg-accent-dark";
const secondaryButtonClass = "border border-border bg-surface text-text-primary hover:bg-surface-secondary";

const countWords = (text: string): number => text.trim().split(/\s+/).filter(Boolean).length;

/**
 * The Cover Letter card on the job details page. The page keys it on the letter's `generatedAt`, so a newly written
 * letter remounts it and the textarea starts from the new text; a saved edit keeps it mounted, so "Saved" stays.
 */
export function CoverLetter({ jobId, company, letter, defaultTone }: Props) {
  const router = useRouter();
  const [text, setText] = useState(letter?.text ?? "");
  const [tone, setTone] = useState<CoverLetterTone>(defaultTone);
  const [copied, setCopied] = useState(false);
  const [confirmingReplace, setConfirmingReplace] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [saved, setSaved] = useState(false);
  const { progress, run } = useProgressAction<null>(COVER_LETTER_FAILED);
  // Held until the refreshed page has the saved letter, so the card never flashes back to its old state.
  const busy = generating || saving || refreshing;

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

  async function generate() {
    if (busy) return;
    setConfirmingReplace(false);
    setGenerating(true);
    setError(null);
    setNeedsProfile(false);
    setSaved(false);
    try {
      const outcome = await run(COVER_LETTER_PATH, { jobId, tone });
      if (!outcome.ok) {
        setError(outcome.error);
        setNeedsProfile(outcome.status === 422);
        // An interrupted stream may still have saved the letter, so show whatever is there.
        if (outcome.interrupted) startRefresh(() => router.refresh());
        return;
      }
      startRefresh(() => router.refresh());
    } finally {
      setGenerating(false);
    }
  }

  function handleHeaderClick() {
    if (hasEdits) {
      setConfirmingReplace(true);
      return;
    }
    void generate();
  }

  async function handleSave() {
    if (busy || !dirty) return;
    setSaving(true);
    setError(null);
    setNeedsProfile(false);
    try {
      const result = await saveCoverLetterEdits(jobId, text);
      if (!result.success) {
        setError(result.error);
        return;
      }
      // The server tidies the text (trailing spaces, extra blank lines) before storing it. Show what was stored, or the
      // textarea would still differ from the saved letter and Save changes would stay enabled.
      setText(result.text);
      setSaved(true);
    } catch (saveError) {
      console.error("[CoverLetter]", saveError);
      setError("We couldn't save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch (copyError) {
      console.error("[CoverLetter] copy failed", copyError);
    }
  }

  const writing = generating || refreshing;
  const CopyIcon = copied ? Check : Copy;

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-border px-6 py-4">
        <div className="flex items-center gap-2.5">
          <SectionIcon tone="accent">
            <FileText />
          </SectionIcon>
          <h2 className="text-base font-semibold text-text-primary">Cover Letter</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            label="Cover letter tone"
            name="tone"
            options={TONE_OPTIONS}
            value={tone}
            onChange={(value) => setTone(resolveTone(value))}
            disabled={busy || confirmingReplace}
          />
          <AsyncActionButton
            busy={writing}
            icon={hasLetter ? RefreshCw : FileText}
            idleLabel={hasLetter ? "Regenerate" : "Generate Cover Letter"}
            busyLabel="Writing..."
            onClick={handleHeaderClick}
            disabled={busy || confirmingReplace}
            className={`${buttonClass} ${hasLetter ? secondaryButtonClass : primaryButtonClass}`}
          />
        </div>
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
            <button type="button" onClick={() => void generate()} className={`${buttonClass} ${primaryButtonClass}`}>
              Replace and regenerate
            </button>
          </div>
        </div>
      ) : null}
      {writing ? <ProgressSteps stages={COVER_LETTER_STAGES} progress={progress} label={`Progress writing your cover letter for ${company}`} /> : null}
      {error ? (
        <p role="alert" className="border-b border-border px-6 py-3 text-sm text-error">
          {error}
          {needsProfile ? (
            <>
              {" "}
              <Link href="/profile" className="font-medium underline underline-offset-2">
                Go to your profile
              </Link>
            </>
          ) : null}
        </p>
      ) : null}

      {writing ? (
        <LetterSkeleton />
      ) : hasLetter ? (
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
            onChange={(event) => {
              setText(event.target.value);
              setSaved(false);
            }}
            maxLength={COVER_LETTER_MAX_CHARS}
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
              <button type="button" onClick={() => void handleSave()} disabled={!dirty || busy} className={`${buttonClass} ${primaryButtonClass}`}>
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
