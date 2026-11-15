import { z } from "zod";
import type { ProfileInput } from "@/types";

const MAX_ROLES = 3;
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const FIRST_GRADUATION_YEAR = 1950;
const GRADUATION_YEARS_AHEAD = 10;
const ROLE_FIELD_PATTERN = /^workExperience\.(\d+)\./;

const uniqueIgnoringCase = (items: string[]): string[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/** Comma-separated free text ("React, Node") to a clean, de-duplicated array. */
export const splitList = (value: string): string[] =>
  uniqueIgnoringCase(
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );

export const joinList = (items: string[]): string => items.join(", ");

const text = (label: string, max: number) =>
  z.string().trim().max(max, `${label} must be ${max} characters or fewer.`);

const url = (label: string) =>
  text(label, 300).refine(
    (value) => value === "" || (URL.canParse(value) && /^https?:/i.test(value)),
    `${label} must be a full link starting with http:// or https://.`,
  );

const month = (label: string) =>
  z.string().trim().refine((value) => value === "" || MONTH_PATTERN.test(value), `${label} must be a valid month.`);

const tags = (label: string) =>
  z
    .array(z.string().trim().max(60, `Each ${label.toLowerCase()} entry must be 60 characters or fewer.`))
    .max(50, `Add at most 50 ${label.toLowerCase()}.`)
    .transform((items) => uniqueIgnoringCase(items.filter(Boolean)));

const commaList = (label: string) =>
  text(label, 300).transform((value) => joinList(splitList(value)));

const roleSchema = z.object({
  company: text("Company name", 120),
  title: text("Job title", 120),
  startDate: month("Start date"),
  endDate: month("End date"),
  current: z.boolean(),
  responsibilities: text("Key responsibilities", 2000),
});

const educationSchema = z.object({
  degree: z.enum(["", "high_school", "associate", "bachelor", "master", "doctorate", "other"], {
    error: "Choose a valid degree.",
  }),
  field: text("Field of study", 120),
  institution: text("Institution name", 120),
  graduationYear: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        (/^\d{4}$/.test(value) &&
          Number(value) >= FIRST_GRADUATION_YEAR &&
          Number(value) <= new Date().getFullYear() + GRADUATION_YEARS_AHEAD),
      "Graduation year must be a 4-digit year, for example 2024.",
    ),
});

const isBlankRole = (role: z.infer<typeof roleSchema>): boolean =>
  !role.company && !role.title && !role.startDate && !role.endDate && !role.responsibilities;

const profileInputSchema = z
  .object({
    fullName: text("Full name", 120),
    phone: text("Phone number", 40),
    location: text("Location", 120),
    linkedinUrl: url("LinkedIn URL"),
    portfolioUrl: url("Portfolio / GitHub link"),
    workAuthorization: z.enum(["", "citizen", "permanent_resident", "visa_required"], {
      error: "Choose a valid work authorization.",
    }),
    currentTitle: text("Current job title", 120),
    experienceLevel: z.enum(["", "junior", "mid", "senior", "lead"], { error: "Choose a valid experience level." }),
    yearsExperience: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || (/^\d+$/.test(value) && Number(value) <= 60),
        "Years of experience must be a whole number between 0 and 60.",
      ),
    skills: tags("Skills"),
    industries: tags("Industries"),
    workExperience: z.array(roleSchema).max(MAX_ROLES, `You can add up to ${MAX_ROLES} work roles.`),
    education: educationSchema,
    jobTitlesSeeking: commaList("Job titles seeking"),
    remotePreference: z.enum(["", "remote", "onsite", "hybrid", "any"], { error: "Choose a valid remote preference." }),
    salaryExpectation: text("Salary expectation", 60),
    preferredLocations: commaList("Preferred locations"),
  })
  .superRefine((value, ctx) => {
    value.workExperience.forEach((role, index) => {
      if (!role.current && role.startDate && role.endDate && role.endDate < role.startDate) {
        ctx.addIssue({
          code: "custom",
          message: `Role ${index + 1}: the end date can't be before the start date.`,
          path: ["workExperience", index, "endDate"],
        });
      }
    });
  })
  .transform((value) => ({
    ...value,
    workExperience: value.workExperience
      .filter((role) => !isBlankRole(role))
      .map((role) => (role.current ? { ...role, endDate: "" } : role)),
  }));

const readText = (formData: FormData, name: string): string => {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
};

const readList = (formData: FormData, name: string): string[] =>
  formData.getAll(name).filter((value): value is string => typeof value === "string");

const readRoles = (formData: FormData): unknown[] => {
  const indexes = new Set<number>();
  for (const key of formData.keys()) {
    const match = ROLE_FIELD_PATTERN.exec(key);
    if (match) indexes.add(Number(match[1]));
  }
  return [...indexes]
    .sort((a, b) => a - b)
    .map((index) => {
      const field = (name: string) => `workExperience.${index}.${name}`;
      return {
        company: readText(formData, field("company")),
        title: readText(formData, field("title")),
        startDate: readText(formData, field("startDate")),
        endDate: readText(formData, field("endDate")),
        current: formData.get(field("current")) === "on",
        responsibilities: readText(formData, field("responsibilities")),
      };
    });
};

export type ProfileParseResult =
  | { success: true; data: ProfileInput }
  | { success: false; fieldErrors: Record<string, string> };

/** Reads the profile form's FormData and validates it. Empty values are fine — only malformed ones fail. */
export function parseProfileFormData(formData: FormData): ProfileParseResult {
  const result = profileInputSchema.safeParse({
    fullName: readText(formData, "fullName"),
    phone: readText(formData, "phone"),
    location: readText(formData, "location"),
    linkedinUrl: readText(formData, "linkedinUrl"),
    portfolioUrl: readText(formData, "portfolioUrl"),
    workAuthorization: readText(formData, "workAuthorization"),
    currentTitle: readText(formData, "currentTitle"),
    experienceLevel: readText(formData, "experienceLevel"),
    yearsExperience: readText(formData, "yearsExperience"),
    skills: readList(formData, "skills"),
    industries: readList(formData, "industries"),
    workExperience: readRoles(formData),
    education: {
      degree: readText(formData, "education.degree"),
      field: readText(formData, "education.field"),
      institution: readText(formData, "education.institution"),
      graduationYear: readText(formData, "education.graduationYear"),
    },
    jobTitlesSeeking: readText(formData, "jobTitlesSeeking"),
    remotePreference: readText(formData, "remotePreference"),
    salaryExpectation: readText(formData, "salaryExpectation"),
    preferredLocations: readText(formData, "preferredLocations"),
  });

  if (result.success) return { success: true, data: result.data };

  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.map(String).join(".");
    if (!(key in fieldErrors)) fieldErrors[key] = issue.message;
  }
  return { success: false, fieldErrors };
}
