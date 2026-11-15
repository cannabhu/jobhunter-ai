import type { JobScore } from "@/types";

const MAX_REASON_LENGTH = 600;
const MAX_SKILLS = 15;
const MAX_SKILL_LENGTH = 60;

const toStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const items: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") continue;
    const skill = entry.trim().slice(0, MAX_SKILL_LENGTH);
    const key = skill.toLowerCase();
    if (skill === "" || seen.has(key)) continue;
    seen.add(key);
    items.push(skill);
    if (items.length === MAX_SKILLS) break;
  }
  return items;
};

const toScore = (value: unknown): number | null => {
  const number = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof number !== "number" || !Number.isFinite(number)) return null;
  return Math.min(100, Math.max(0, Math.round(number)));
};

/**
 * Turns the model's JSON (untrusted) into a safe score, or null when there is no usable score.
 * Never throws: a job with no score is skipped rather than saved with a made-up one.
 */
export function normalizeJobScore(content: string): JobScore | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;

  const raw = parsed as Record<string, unknown>;
  const matchScore = toScore(raw.matchScore);
  if (matchScore === null) return null;

  const reason = typeof raw.matchReason === "string" ? raw.matchReason.trim().slice(0, MAX_REASON_LENGTH) : "";
  return {
    matchScore,
    matchReason: reason,
    matchedSkills: toStringList(raw.matchedSkills),
    missingSkills: toStringList(raw.missingSkills),
  };
}
