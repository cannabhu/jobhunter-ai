import { z } from "zod";
import {
  DEGREE_VALUES,
  EXPERIENCE_LEVEL_VALUES,
  FIELD_LIMITS,
  FIRST_GRADUATION_YEAR,
  GRADUATION_YEARS_AHEAD,
  MAX_ROLES,
  MAX_TAG_LENGTH,
  MAX_TAGS,
  MAX_YEARS_EXPERIENCE,
  MONTH_PATTERN,
} from "@/lib/profileConstants";
import { uniqueIgnoringCase } from "@/lib/profileFormData";
import type { EducationEntry, ExtractedProfile, WorkExperienceEntry } from "@/types";

// Everything GPT-4o returns is untrusted. Each field is read on its own: a bad value is dropped to blank, never an error.

const clean = (max: number) =>
  z
    .unknown()
    .transform((value) => (typeof value === "string" ? value.trim().slice(0, max) : ""));

const oneOf = <T extends string>(allowed: readonly T[]) =>
  z.unknown().transform((value): T | "" => {
    const candidate = typeof value === "string" ? value.trim().toLowerCase() : "";
    return allowed.find((item) => item === candidate) ?? "";
  });

const link = z.unknown().transform((value) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed || /\s/.test(trimmed)) return "";
  // Resumes often print "linkedin.com/in/name" without the scheme.
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return URL.canParse(withScheme) && withScheme.length <= FIELD_LIMITS.url ? withScheme : "";
});

const month = z.unknown().transform((value) => {
  const candidate = typeof value === "string" ? value.trim() : "";
  return MONTH_PATTERN.test(candidate) ? candidate : "";
});

const years = z.unknown().transform((value) => {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value.trim()) : Number.NaN;
  return Number.isInteger(number) && number >= 0 && number <= MAX_YEARS_EXPERIENCE ? String(number) : "";
});

const graduationYear = z.unknown().transform((value) => {
  const candidate = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";
  const year = Number(candidate);
  const valid =
    /^\d{4}$/.test(candidate) && year >= FIRST_GRADUATION_YEAR && year <= new Date().getFullYear() + GRADUATION_YEARS_AHEAD;
  return valid ? candidate : "";
});

const tags = z.unknown().transform((value) => {
  if (!Array.isArray(value)) return [];
  const items = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item !== "" && item.length <= MAX_TAG_LENGTH);
  return uniqueIgnoringCase(items).slice(0, MAX_TAGS);
});

// Field by field on purpose: an object schema would reject a role or degree that is merely missing a key.
const parseRole = (source: Record<string, unknown>): WorkExperienceEntry => {
  const current = source.current === true;
  const startDate = month.parse(source.startDate);
  const endDate = month.parse(source.endDate);
  // Same rules Save enforces: a current role has no end date, and an end date can't precede the start.
  const endsBeforeStart = startDate !== "" && endDate !== "" && endDate < startDate;
  return {
    company: clean(FIELD_LIMITS.company).parse(source.company),
    title: clean(FIELD_LIMITS.roleTitle).parse(source.title),
    startDate,
    endDate: current || endsBeforeStart ? "" : endDate,
    current,
    responsibilities: clean(FIELD_LIMITS.responsibilities).parse(source.responsibilities),
  };
};

const parseEducation = (source: Record<string, unknown>): EducationEntry => ({
  degree: oneOf(DEGREE_VALUES).parse(source.degree),
  field: clean(FIELD_LIMITS.fieldOfStudy).parse(source.field),
  institution: clean(FIELD_LIMITS.institution).parse(source.institution),
  graduationYear: graduationYear.parse(source.graduationYear),
});

const isBlankRole = (role: WorkExperienceEntry): boolean =>
  !role.company && !role.title && !role.startDate && !role.endDate && !role.responsibilities;

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

/** Turns the model's JSON text into a safe, form-shaped object. Never throws. */
export function normalizeExtraction(rawJson: string): ExtractedProfile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    parsed = {};
  }
  const source = asRecord(parsed);

  const roles = Array.isArray(source.workExperience) ? source.workExperience : [];
  // The model sometimes returns a list of degrees; the form holds one, so take the first.
  const educationSource = Array.isArray(source.education) ? source.education[0] : source.education;

  return {
    fullName: clean(FIELD_LIMITS.fullName).parse(source.fullName),
    phone: clean(FIELD_LIMITS.phone).parse(source.phone),
    location: clean(FIELD_LIMITS.location).parse(source.location),
    linkedinUrl: link.parse(source.linkedinUrl),
    portfolioUrl: link.parse(source.portfolioUrl),
    currentTitle: clean(FIELD_LIMITS.currentTitle).parse(source.currentTitle),
    experienceLevel: oneOf(EXPERIENCE_LEVEL_VALUES).parse(source.experienceLevel),
    yearsExperience: years.parse(source.yearsExperience),
    skills: tags.parse(source.skills),
    industries: tags.parse(source.industries),
    workExperience: roles
      .map((role) => parseRole(asRecord(role)))
      .filter((role) => !isBlankRole(role))
      .slice(0, MAX_ROLES),
    education: parseEducation(asRecord(educationSource)),
  };
}
