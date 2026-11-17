"use client";

import { CloudUpload, ExternalLink, FileText, LoaderCircle, Sparkles } from "lucide-react";
import { AsyncActionButton } from "@/components/shared/AsyncActionButton";
import { ProgressSteps } from "@/components/shared/ProgressSteps";
import { useProgressAction } from "@/components/shared/useProgressAction";
import { useRouter } from "next/navigation";
import { useRef, useState, type DragEvent } from "react";
import {
  MAX_RESUME_SIZE_BYTES,
  RESUME_EXTRACT_PATH,
  RESUME_EXTRACT_STAGES,
  RESUME_FILE_PATH,
  RESUME_GENERATE_PATH,
  RESUME_GENERATE_STAGES,
  RESUME_UPLOAD_PATH,
} from "@/lib/resume";
import type { ExtractedProfile } from "@/types";

const UPLOAD_FAILED = "We couldn't upload your resume. Please try again.";
const EXTRACT_FAILED = "We couldn't read your resume. Please try again.";
const GENERATE_FAILED = "We couldn't generate your resume. Please try again.";

const readError = (body: unknown): string | null =>
  typeof body === "object" && body !== null && "error" in body && typeof body.error === "string" ? body.error : null;

type Props = {
  hasResume: boolean;
  /** True when the form differs from what is saved. Generate reads the saved profile, so those edits would be left out. */
  hasUnsavedChanges: boolean;
  /** Puts extracted data into the form and returns how many fields it filled. */
  onExtracted: (extracted: ExtractedProfile) => number;
};

export function ResumeUpload({ hasResume, hasUnsavedChanges, onExtracted }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadingName, setUploadingName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [filledCount, setFilledCount] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [confirmingReplace, setConfirmingReplace] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);
  const { progress: extractProgress, run: runExtract } = useProgressAction<ExtractedProfile>(EXTRACT_FAILED);
  const { progress: generateProgress, run: runGenerate } = useProgressAction<null>(GENERATE_FAILED);
  const uploading = uploadingName !== null;
  const busy = uploading || extracting || generating;

  const upload = async (file: File) => {
    setError(null);
    setGenerated(false);
    setUploadingName(file.name);
    try {
      const body = new FormData();
      body.append("resume", file);
      const response = await fetch(RESUME_UPLOAD_PATH, { method: "POST", body });
      if (!response.ok) {
        const result: unknown = await response.json().catch(() => null);
        setError(readError(result) ?? UPLOAD_FAILED);
        return;
      }
      router.refresh();
    } catch (uploadError) {
      console.error("[ResumeUpload]", uploadError);
      setError(UPLOAD_FAILED);
    } finally {
      setUploadingName(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const extract = async () => {
    setExtractError(null);
    setFilledCount(null);
    setExtracting(true);
    try {
      const outcome = await runExtract(RESUME_EXTRACT_PATH);
      if (!outcome.ok) {
        setExtractError(outcome.error);
        return;
      }
      setFilledCount(onExtracted(outcome.data));
    } finally {
      setExtracting(false);
    }
  };

  const generate = async () => {
    setConfirmingReplace(false);
    setGenerateError(null);
    setGenerated(false);
    setGenerating(true);
    try {
      const outcome = await runGenerate(RESUME_GENERATE_PATH);
      if (!outcome.ok) {
        setGenerateError(outcome.error);
        // An interrupted stream may still have saved the resume, so show whatever is on file.
        if (outcome.interrupted) router.refresh();
        return;
      }
      setGenerated(true);
      router.refresh();
    } finally {
      setGenerating(false);
    }
  };

  // A resume already on file is replaced, so ask first. With none on file there is nothing to lose.
  const startGenerate = () => {
    setGenerated(false);
    setGenerateError(null);
    if (hasResume) setConfirmingReplace(true);
    else void generate();
  };

  const acceptFile = (candidate: File | undefined) => {
    if (!candidate || busy) return;
    if (candidate.type !== "application/pdf") {
      setError("Only PDF files are supported.");
      return;
    }
    if (candidate.size > MAX_RESUME_SIZE_BYTES) {
      setError("That file is larger than 5MB. Please choose a smaller PDF.");
      return;
    }
    void upload(candidate);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    acceptFile(event.dataTransfer.files[0]);
  };

  return (
    <section
      aria-labelledby="resume-heading"
      className="rounded-xl border border-border bg-surface p-8 shadow-card"
    >
      <h2 id="resume-heading" className="text-xl font-semibold text-text-primary">
        Resume
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        Upload an existing resume to auto-fill the profile, or generate a new tailored one from your details below.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        aria-label="Resume PDF"
        onChange={(event) => acceptFile(event.target.files?.[0])}
      />

      <div
        onClick={() => {
          if (!busy) inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        aria-busy={uploading}
        className={`mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center ${
          busy ? "cursor-progress" : "cursor-pointer"
        } ${dragging ? "border-accent bg-accent-muted" : "border-border-muted bg-surface-secondary"}`}
      >
        <span className="flex size-11 items-center justify-center rounded-full border border-border bg-surface shadow-card">
          {uploading ? (
            <LoaderCircle className="size-5 animate-spin text-accent" aria-hidden="true" />
          ) : (
            <CloudUpload className="size-5 text-accent" aria-hidden="true" />
          )}
        </span>
        <p className="mt-4 text-sm font-semibold text-text-primary">
          {uploading ? `Uploading ${uploadingName}…` : "Click to upload or drag and drop"}
        </p>
        <p className="mt-1 text-xs text-text-secondary">PDF formatting only. Maximum file size 5MB.</p>
        <button
          type="button"
          disabled={busy}
          className="mt-4 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary shadow-card hover:bg-surface-secondary disabled:opacity-60"
        >
          Select Resume
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-error">
          {error}
        </p>
      ) : null}

      {hasResume ? (
        <div className="mt-3 flex items-center gap-3 rounded-md border border-border bg-surface-secondary px-3.5 py-2.5">
          <FileText className="size-4 shrink-0 text-accent" aria-hidden="true" />
          <span className="min-w-0 flex-1 text-sm font-medium text-text-primary">
            Resume on file
            <span className="ml-2 text-xs font-normal text-text-secondary">Choose a new PDF to replace it.</span>
          </span>
          <a
            href={RESUME_FILE_PATH}
            target="_blank"
            rel="noreferrer"
            className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-dark"
          >
            View
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        </div>
      ) : null}

      {hasResume ? (
        <div className="mt-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-secondary">
              Fill the form below from this resume. Fields the resume covers are replaced; nothing is saved until you click Save Profile.
            </p>
            <AsyncActionButton
              busy={extracting}
              icon={Sparkles}
              idleLabel="Extract from Resume"
              busyLabel="Reading your resume…"
              spinnerClassName="text-accent"
              onClick={() => void extract()}
              disabled={busy}
              className="flex shrink-0 items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary shadow-card hover:bg-surface-secondary disabled:opacity-60"
            />
          </div>
          {extracting ? (
            <ProgressSteps stages={RESUME_EXTRACT_STAGES} progress={extractProgress} label="Progress reading your resume" variant="inline" />
          ) : null}
          {extractError ? (
            <p role="alert" className="mt-3 text-sm text-error">
              {extractError}
            </p>
          ) : null}
          {filledCount !== null ? (
            <p role="status" className="mt-3 rounded-md border border-success-light bg-success-lightest px-4 py-3 text-sm font-medium text-success-foreground">
              {filledCount === 0
                ? "We couldn't find any profile details in this resume."
                : `Filled ${filledCount} ${filledCount === 1 ? "field" : "fields"} from your resume. Look for the purple highlights, review them, then click Save Profile.`}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 border-t border-border pt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-secondary">Need a fresh document based on the fields below?</p>
          <AsyncActionButton
            busy={generating}
            icon={FileText}
            idleLabel="Generate Resume from Profile"
            busyLabel="Generating…"
            onClick={startGenerate}
            disabled={busy || confirmingReplace}
            className="flex shrink-0 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground shadow-card hover:bg-accent-dark disabled:opacity-60"
          />
        </div>

        {confirmingReplace ? (
          <div
            role="alertdialog"
            aria-label="Replace your current resume?"
            className="mt-3 flex flex-col gap-3 rounded-md border border-border bg-surface-secondary px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-sm text-text-primary">
              <span className="font-semibold">This replaces your current resume.</span> The file on record is swapped for a new one built from your saved profile.
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setConfirmingReplace(false)}
                className="rounded-md border border-border bg-surface px-3.5 py-2 text-sm font-medium text-text-primary shadow-card hover:bg-surface-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void generate()}
                className="rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-accent-foreground shadow-card hover:bg-accent-dark"
              >
                Replace and generate
              </button>
            </div>
          </div>
        ) : null}

        {generating ? (
          <ProgressSteps stages={RESUME_GENERATE_STAGES} progress={generateProgress} label="Progress generating your resume" variant="inline" />
        ) : null}
        {hasUnsavedChanges ? (
          <p role="note" className="mt-3 rounded-md border border-border bg-surface-secondary px-4 py-3 text-sm text-text-secondary">
            You have unsaved changes. The generated resume uses your saved profile, so click Save Profile first to include them.
          </p>
        ) : null}
        {generateError ? (
          <p role="alert" className="mt-3 text-sm text-error">
            {generateError}
          </p>
        ) : null}
        {generated ? (
          <p role="status" className="mt-3 rounded-md border border-success-light bg-success-lightest px-4 py-3 text-sm font-medium text-success-foreground">
            Your new resume is ready.{" "}
            <a href={RESUME_FILE_PATH} target="_blank" rel="noreferrer" className="underline">
              View it
            </a>
            .
          </p>
        ) : null}
      </div>
    </section>
  );
}
