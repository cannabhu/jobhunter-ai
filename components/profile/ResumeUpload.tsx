"use client";

import { CloudUpload, ExternalLink, FileText, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type DragEvent } from "react";
import { MAX_RESUME_SIZE_BYTES, RESUME_FILE_PATH, RESUME_UPLOAD_PATH } from "@/lib/resume";

const UPLOAD_FAILED = "We couldn't upload your resume. Please try again.";

const readError = (body: unknown): string | null =>
  typeof body === "object" && body !== null && "error" in body && typeof body.error === "string" ? body.error : null;

type Props = {
  hasResume: boolean;
};

export function ResumeUpload({ hasResume }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadingName, setUploadingName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const uploading = uploadingName !== null;

  const upload = async (file: File) => {
    setError(null);
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

  const acceptFile = (candidate: File | undefined) => {
    if (!candidate || uploading) return;
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
          if (!uploading) inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        aria-busy={uploading}
        className={`mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center ${
          uploading ? "cursor-progress" : "cursor-pointer"
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
          disabled={uploading}
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

      <div className="mt-6 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-secondary">Need a fresh document based on the fields below?</p>
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground shadow-card hover:bg-accent-dark"
        >
          <FileText className="size-4" aria-hidden="true" />
          Generate Resume from Profile
        </button>
      </div>
    </section>
  );
}
