import type { StageDef } from "@/lib/progress";

export const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;

export const RESUME_UPLOAD_PATH = "/api/resume/upload";

export const RESUME_FILE_PATH = "/api/resume/file";

export const RESUME_EXTRACT_PATH = "/api/resume/extract";

/** The steps of one extraction, in order. "prepare" runs in the browser until the route's checks pass; the route reports the rest. */
export const RESUME_EXTRACT_STAGES = [
  { id: "prepare", label: "Getting started" },
  { id: "read", label: "Reading your resume" },
  { id: "extract", label: "Extracting your details" },
] as const satisfies readonly StageDef[];

export type ResumeExtractStageId = (typeof RESUME_EXTRACT_STAGES)[number]["id"];

/** Below this many characters the PDF is treated as image-only (scanned), so there is nothing to read. */
export const MIN_RESUME_TEXT_LENGTH = 100;

/** Caps what is sent to the model. A normal resume is a few thousand characters. */
export const MAX_RESUME_TEXT_LENGTH = 30_000;

export const RESUME_UNREADABLE_ERROR = "Could not extract text from this PDF. Please try a different file.";

/** Each extraction is a paid GPT-4o call, so one user gets this many per window. */
export const EXTRACT_LIMIT = 5;
export const EXTRACT_WINDOW_MS = 10 * 60 * 1000;

export const RESUME_GENERATE_PATH = "/api/resume/generate";

/** The steps of one generation, in order. "save" covers the upload, the read-back and the profile update. */
export const RESUME_GENERATE_STAGES = [
  { id: "prepare", label: "Checking your saved profile" },
  { id: "write", label: "Writing your summary and bullets" },
  { id: "render", label: "Building the PDF" },
  { id: "save", label: "Saving your resume" },
] as const satisfies readonly StageDef[];

export type ResumeGenerateStageId = (typeof RESUME_GENERATE_STAGES)[number]["id"];

/** Each generation is a paid GPT-4o call, so one user gets this many per window. */
export const GENERATE_LIMIT = 5;
export const GENERATE_WINDOW_MS = 10 * 60 * 1000;

export const RESUME_NEEDS_DATA_ERROR = "Add your name and at least one work role, save, then try again.";

/** Caps that keep the generated resume on one page. Content is trimmed to these, never shrunk to fit. */
export const RESUME_LIMITS = {
  summary: 450,
  bulletsPerRole: 4,
  bullet: 220,
  skills: 35,
} as const;
