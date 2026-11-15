export const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;

export const RESUME_UPLOAD_PATH = "/api/resume/upload";

export const RESUME_FILE_PATH = "/api/resume/file";

export const RESUME_EXTRACT_PATH = "/api/resume/extract";

/** Below this many characters the PDF is treated as image-only (scanned), so there is nothing to read. */
export const MIN_RESUME_TEXT_LENGTH = 100;

/** Caps what is sent to the model. A normal resume is a few thousand characters. */
export const MAX_RESUME_TEXT_LENGTH = 30_000;

export const RESUME_UNREADABLE_ERROR = "Could not extract text from this PDF. Please try a different file.";

/** Each extraction is a paid GPT-4o call, so one user gets this many per window. */
export const EXTRACT_LIMIT = 5;
export const EXTRACT_WINDOW_MS = 10 * 60 * 1000;
