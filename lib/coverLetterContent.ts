import { COVER_LETTER_MAX_CHARS, COVER_LETTER_MIN_CHARS } from "@/lib/coverLetter";

// Turns GPT-4o's JSON answer into letter text that is safe to store and show. The answer is untrusted: it may be
// malformed, empty, a stub, or still contain template slots such as [Your Name].

/**
 * A template slot the model forgot to fill in: `[Your Name]`, `[Company Name]`, `[Date]`, `{{name}}`. Brackets are only
 * a slot when they start with a word that belongs in one, so a letter with "[1]" or "[Remote]" is not thrown away.
 */
const SLOT_WORDS =
  "your|my|name|company|hiring|date|today|position|role|job|title|address|phone|email|city|state|zip|insert|recipient|manager|salutation|signature|platform|source|website|link|employer|organization";
const PLACEHOLDER_PATTERN = new RegExp(`\\[\\s*(?:${SLOT_WORDS})\\b[^\\]\\n]{0,60}\\]|\\{\\{[^}\\n]*\\}\\}`, "i");

/** Cuts an over-long letter at the last sentence end that fits, so it never stops mid-sentence. Null when none does. */
function cutAtSentence(text: string): string | null {
  const head = text.slice(0, COVER_LETTER_MAX_CHARS);
  const end = Math.max(head.lastIndexOf(". "), head.lastIndexOf("! "), head.lastIndexOf("? "), head.lastIndexOf(".\n"));
  return end >= COVER_LETTER_MIN_CHARS ? head.slice(0, end + 1).trimEnd() : null;
}

/** Tidies line endings and blank lines while keeping the paragraph breaks. */
export function cleanLetterText(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** The letter in the model's JSON text, or null when it is unusable (not JSON, empty, too short, or has a placeholder). */
export function normalizeCoverLetter(rawJson: string): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;

  const value = (parsed as Record<string, unknown>).coverLetter;
  if (typeof value !== "string") return null;

  let text = cleanLetterText(value);
  if (text.length > COVER_LETTER_MAX_CHARS) {
    const cut = cutAtSentence(text);
    if (cut === null) return null;
    text = cut;
  }
  if (text.length < COVER_LETTER_MIN_CHARS) return null;
  if (PLACEHOLDER_PATTERN.test(text)) return null;
  return text;
}
