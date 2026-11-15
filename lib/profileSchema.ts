import { z } from "zod";
import {
  DEGREE_VALUES,
  EXPERIENCE_LEVEL_VALUES,
  FIELD_LIMITS,
  FIRST_GRADUATION_YEAR,
  GRADUATION_YEARS_AHEAD,
  MAX_ROLES,
  MAX_TAGS,
  MAX_TAG_LENGTH,
  MAX_YEARS_EXPERIENCE,
  MONTH_PATTERN,
  REMOTE_PREFERENCE_VALUES,
  WORK_AUTHORIZATION_VALUES,
} from "@/lib/profileConstants";
import { joinList, readList, readRoles, readText, splitList, uniqueIgnoringCase } from "@/lib/profileFormData";
import type { ProfileInput } from "@/types";

const text = (label: string, max: number) =>
  z.string().trim().max(max, `${label} must be ${max} characters or fewer.`);

const url = (label: string) =>
  text(label, FIELD_LIMITS.url).refine(
    (value) => value === "" || (URL.canParse(value) && /^https?:/i.test(value)),
    `${label} must be a full link starting with http:// or https://.`,
  );

const month = (label: string) =>
  z.string().trim().refine((value) => value === "" || MONTH_PATTERN.test(value), `${label} must be a valid month.`);

const tags = (label: string) =>
  z
    .array(z.string().trim().max(MAX_TAG_LENGTH, `Each ${label.toLowerCase()} entry must be ${MAX_TAG_LENGTH} characters or fewer.`))
    .max(MAX_TAGS, `Add at most ${MAX_TAGS} ${label.toLowerCase()}.`)
    .transform((items) => uniqueIgnoringCase(items.filter(Boolean)));

const commaList = (label: string) =>
  text(label, 300).transform((value) => joinList(splitList(value)));

const roleSchema = z.object({
  company: text("Company name", FIELD_LIMITS.company),
  title: text("Job title", FIELD_LIMITS.roleTitle),
  startDate: month("Start date"),
  endDate: month("End date"),
  current: z.boolean(),
  responsibilities: text("Key responsibilities", FIELD_LIMITS.responsibilities),
});

const educationSchema = z.object({
  degree: z.enum(["", ...DEGREE_VALUES], {
    error: "Choose a valid degree.",
  }),
  field: text("Field of study", FIELD_LIMITS.fieldOfStudy),
  institution: text("Institution name", FIELD_LIMITS.institution),
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
    fullName: text("Full name", FIELD_LIMITS.fullName),
    phone: text("Phone number", FIELD_LIMITS.phone),
    location: text("Location", FIELD_LIMITS.location),
    linkedinUrl: url("LinkedIn URL"),
    portfolioUrl: url("Portfolio / GitHub link"),
    workAuthorization: z.enum(["", ...WORK_AUTHORIZATION_VALUES], {
      error: "Choose a valid work authorization.",
    }),
    currentTitle: text("Current job title", FIELD_LIMITS.currentTitle),
    experienceLevel: z.enum(["", ...EXPERIENCE_LEVEL_VALUES], { error: "Choose a valid experience level." }),
    yearsExperience: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || (/^\d+$/.test(value) && Number(value) <= MAX_YEARS_EXPERIENCE),
        `Years of experience must be a whole number between 0 and ${MAX_YEARS_EXPERIENCE}.`,
      ),
    skills: tags("Skills"),
    industries: tags("Industries"),
    workExperience: z.array(roleSchema).max(MAX_ROLES, `You can add up to ${MAX_ROLES} work roles.`),
    education: educationSchema,
    jobTitlesSeeking: commaList("Job titles seeking"),
    remotePreference: z.enum(["", ...REMOTE_PREFERENCE_VALUES], { error: "Choose a valid remote preference." }),
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
