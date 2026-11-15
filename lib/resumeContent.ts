import { MAX_ROLES } from "@/lib/profileConstants";
import { RESUME_LIMITS } from "@/lib/resume";
import type { EducationEntry, ProfileFormValues, WorkExperienceEntry } from "@/types";

// What the generated resume says. Facts (names, dates, employers, schools, skills) come straight from the saved
// profile; GPT-4o only supplies the wording in `ResumeWriting`, and that wording is untrusted.

/** The wording GPT-4o writes. `roleBullets[i]` belongs to `selectRoles(values)[i]`. */
export type ResumeWriting = {
  summary: string;
  roleBullets: string[][];
};

export type ResumeContent = {
  name: string;
  title: string;
  contact: string[];
  summary: string;
  roles: { title: string; company: string; dates: string; bullets: string[] }[];
  education: { heading: string; detail: string } | null;
  skills: string[];
};

const DEGREE_LABELS: Record<string, string> = {
  high_school: "High School Diploma",
  associate: "Associate's Degree",
  bachelor: "Bachelor's Degree",
  master: "Master's Degree",
  doctorate: "Doctorate",
  other: "Degree",
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** The roles that appear on the resume, in order. The model is shown exactly this list, so indexes line up. */
export function selectRoles(values: ProfileFormValues): WorkExperienceEntry[] {
  return values.workExperience.filter((role) => role.company.trim() !== "" || role.title.trim() !== "").slice(0, MAX_ROLES);
}

/** The minimum a resume needs: a name and at least one role. */
export function hasEnoughForResume(values: ProfileFormValues): boolean {
  return values.fullName.trim() !== "" && selectRoles(values).length > 0;
}

/** `2022-03` to `Mar 2022`. Anything that is not a valid month comes back blank. */
function formatMonth(value: string): string {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
  return match ? `${MONTH_NAMES[Number(match[2]) - 1]} ${match[1]}` : "";
}

export function formatMonthRange(startDate: string, endDate: string, current: boolean): string {
  const start = formatMonth(startDate);
  const end = current ? "Present" : formatMonth(endDate);
  if (start && end) return `${start} – ${end}`;
  return start || end;
}

/** Cuts text to `max` characters at a word boundary, adding an ellipsis only when something was cut. */
function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

const cleanText = (value: unknown, max: number): string =>
  typeof value === "string" ? clip(value.replace(/\s+/g, " ").trim(), max) : "";

/** Models like to prefix bullets with a dash or dot even when told not to. */
const cleanBullet = (value: unknown): string =>
  cleanText(typeof value === "string" ? value.replace(/^\s*[-•*–·]+\s*/, "") : value, RESUME_LIMITS.bullet);

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

/** Turns the model's JSON text into safe wording for `roleCount` roles. Never throws. */
export function normalizeResumeWriting(rawJson: string, roleCount: number): ResumeWriting {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    parsed = {};
  }
  const source = asRecord(parsed);
  const roles = Array.isArray(source.roles) ? source.roles : [];

  return {
    summary: cleanText(source.summary, RESUME_LIMITS.summary),
    roleBullets: Array.from({ length: roleCount }, (_, index) => {
      const bullets = asRecord(roles[index]).bullets;
      if (!Array.isArray(bullets)) return [];
      return bullets.map(cleanBullet).filter((bullet) => bullet !== "").slice(0, RESUME_LIMITS.bulletsPerRole);
    }),
  };
}

const displayUrl = (url: string): string => url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");

function educationLines(education: EducationEntry): ResumeContent["education"] {
  const degree = DEGREE_LABELS[education.degree] ?? "";
  const heading = [degree, education.field].filter(Boolean).join(" in ");
  const detail = [education.institution, education.graduationYear].filter(Boolean).join(" · ");
  if (!heading && !detail) return null;
  // With only a school, show it as the heading rather than leaving the heading blank.
  return heading ? { heading, detail } : { heading: detail, detail: "" };
}

/** Combines the saved profile (facts) with the model's wording. A role with no responsibilities never gets bullets. */
export function buildResumeContent(values: ProfileFormValues, writing: ResumeWriting): ResumeContent {
  const roles = selectRoles(values);

  return {
    name: values.fullName.trim(),
    title: values.currentTitle.trim(),
    contact: [
      values.email,
      values.phone,
      values.location,
      values.linkedinUrl && displayUrl(values.linkedinUrl),
      values.portfolioUrl && displayUrl(values.portfolioUrl),
    ]
      .map((item) => item.trim())
      .filter(Boolean),
    summary: writing.summary,
    roles: roles.map((role, index) => ({
      title: role.title.trim(),
      company: role.company.trim(),
      dates: formatMonthRange(role.startDate, role.endDate, role.current),
      bullets: role.responsibilities.trim() === "" ? [] : (writing.roleBullets[index] ?? []),
    })),
    education: educationLines(values.education),
    skills: values.skills.slice(0, RESUME_LIMITS.skills),
  };
}

/** Steps tried, in order, when a resume overflows one page. Each trims more: fewer bullets, then fewer skills, then no summary. */
const TRIM_STEPS: { bullets: number; skills: number; summary: boolean }[] = [
  { bullets: 3, skills: 30, summary: true },
  { bullets: 2, skills: 20, summary: true },
  { bullets: 1, skills: 12, summary: true },
  { bullets: 0, skills: 8, summary: false },
];

export const TRIM_STEP_COUNT = TRIM_STEPS.length;

/** A shorter copy of the resume for trim step `step` (0-based). Only ever removes content. */
export function trimResumeContent(content: ResumeContent, step: number): ResumeContent {
  const { bullets, skills, summary } = TRIM_STEPS[Math.min(step, TRIM_STEPS.length - 1)];
  return {
    ...content,
    summary: summary ? content.summary : "",
    roles: content.roles.map((role) => ({ ...role, bullets: role.bullets.slice(0, bullets) })),
    skills: content.skills.slice(0, skills),
  };
}
