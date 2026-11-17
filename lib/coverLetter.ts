import type { StageDef } from "@/lib/progress";
import { COVER_LETTER_TONE_VALUES } from "@/lib/profileConstants";
import { selectRoles } from "@/lib/resumeContent";
import type { CoverLetterTone, ProfileFormValues } from "@/types";

export const COVER_LETTER_PATH = "/api/agent/cover-letter";

/** The steps of one run, in order. "prepare" runs in the browser until the route's checks pass; the route reports the rest. */
export const COVER_LETTER_STAGES = [
  { id: "prepare", label: "Checking your profile and this job" },
  { id: "write", label: "Writing your letter" },
  { id: "save", label: "Saving the letter" },
] as const satisfies readonly StageDef[];

export type CoverLetterStageId = (typeof COVER_LETTER_STAGES)[number]["id"];

/** At most this many letters per user in the window. Separate from the research limit. */
export const COVER_LETTER_LIMIT = 5;
export const COVER_LETTER_WINDOW_MS = 10 * 60 * 1000;

/** The longest letter that is stored, from the model or from the user's own edits (about twice a generated letter). */
export const COVER_LETTER_MAX_CHARS = 5000;
/** Anything shorter than this from the model is not a real letter (a generated one is about 2,500 characters). */
export const COVER_LETTER_MIN_CHARS = 400;

export const DEFAULT_TONE: CoverLetterTone = "formal";

export const COVER_LETTER_FAILED = "We couldn't write your cover letter. Please try again.";
export const COVER_LETTER_UNAVAILABLE = "The AI writer is unavailable right now. Please try again in a few minutes.";
export const COVER_LETTER_SAVE_FAILED = "We couldn't save your changes. Please try again.";
export const PROFILE_NEEDS_DATA_FOR_LETTER = "Complete your profile first: add your full name and your skills or work experience.";

/** The tone to write in: the profile's choice, or formal when it is empty or not one of the three. */
export function resolveTone(value: unknown): CoverLetterTone {
  return COVER_LETTER_TONE_VALUES.find((tone) => tone === value) ?? DEFAULT_TONE;
}

/**
 * The minimum a letter needs: a full name for the sign-off, and skills or a work role to ground the claims in.
 * Without these the model can only be generic or invent, which its prompt forbids.
 */
export function hasEnoughForCoverLetter(values: ProfileFormValues): boolean {
  if (values.fullName.trim() === "") return false;
  return values.skills.length > 0 || selectRoles(values).length > 0;
}
