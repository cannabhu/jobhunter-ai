"use client";

import { CloudUpload, FileText, X } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

const formatSize = (bytes: number): string =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export function ResumeUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const acceptFile = (candidate: File | undefined) => {
    if (!candidate) return;
    if (candidate.type !== "application/pdf") {
      setError("Only PDF files are supported.");
      return;
    }
    if (candidate.size > MAX_SIZE_BYTES) {
      setError("That file is larger than 5MB. Please choose a smaller PDF.");
      return;
    }
    setError(null);
    setFile(candidate);
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
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
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`mt-8 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center ${
          dragging ? "border-accent bg-accent-muted" : "border-border-muted bg-surface-secondary"
        }`}
      >
        <span className="flex size-11 items-center justify-center rounded-full border border-border bg-surface shadow-card">
          <CloudUpload className="size-5 text-accent" aria-hidden="true" />
        </span>
        <p className="mt-4 text-sm font-semibold text-text-primary">Click to upload or drag and drop</p>
        <p className="mt-1 text-xs text-text-secondary">PDF formatting only. Maximum file size 5MB.</p>
        <button
          type="button"
          className="mt-4 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary shadow-card hover:bg-surface-secondary"
        >
          Select Resume
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-error">
          {error}
        </p>
      ) : null}

      {file ? (
        <div className="mt-3 flex items-center gap-3 rounded-md border border-border bg-surface-secondary px-3.5 py-2.5">
          <FileText className="size-4 shrink-0 text-accent" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">{file.name}</span>
          <span className="shrink-0 text-xs text-text-secondary">{formatSize(file.size)}</span>
          <button
            type="button"
            onClick={clearFile}
            aria-label={`Remove ${file.name}`}
            className="shrink-0 text-text-secondary hover:text-text-primary"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
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
