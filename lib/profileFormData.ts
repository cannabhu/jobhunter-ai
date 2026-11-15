import type { ProfileFormValues } from "@/types";

// Reads the profile form's FormData without validating it. No zod, so client code can import it.

const ROLE_FIELD_PATTERN = /^workExperience\.(\d+)\./;

export const uniqueIgnoringCase = (items: string[]): string[] => {
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

export const readText = (formData: FormData, name: string): string => {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
};

export const readList = (formData: FormData, name: string): string[] =>
  formData.getAll(name).filter((value): value is string => typeof value === "string");

export const readRoles = (formData: FormData): ProfileFormValues["workExperience"] => {
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

/** Snapshot of whatever is currently typed in the profile form, valid or not. */
export function readFormValues(formData: FormData): ProfileFormValues {
  // The selects only ever hold their own option values, so the casts below match what the form can produce.
  return {
    fullName: readText(formData, "fullName"),
    email: readText(formData, "email"),
    phone: readText(formData, "phone"),
    location: readText(formData, "location"),
    linkedinUrl: readText(formData, "linkedinUrl"),
    portfolioUrl: readText(formData, "portfolioUrl"),
    workAuthorization: readText(formData, "workAuthorization") as ProfileFormValues["workAuthorization"],
    currentTitle: readText(formData, "currentTitle"),
    experienceLevel: readText(formData, "experienceLevel") as ProfileFormValues["experienceLevel"],
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
    remotePreference: readText(formData, "remotePreference") as ProfileFormValues["remotePreference"],
    salaryExpectation: readText(formData, "salaryExpectation"),
    preferredLocations: readText(formData, "preferredLocations"),
  };
}
