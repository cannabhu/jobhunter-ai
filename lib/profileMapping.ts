import { z } from "zod";
import type { ProfileCompletion } from "@/lib/profileCompletion";
import { joinList, splitList } from "@/lib/profileFormData";
import type { ProfileFormValues, ProfileInput, ProfileRow } from "@/types";

// jsonb columns can hold anything, so read them leniently and fall back per field.
const storedRoleSchema = z.object({
  company: z.string().catch(""),
  title: z.string().catch(""),
  startDate: z.string().catch(""),
  endDate: z.string().catch(""),
  current: z.boolean().catch(false),
  responsibilities: z.string().catch(""),
});

const storedEducationSchema = z.object({
  degree: z.string().catch(""),
  field: z.string().catch(""),
  institution: z.string().catch(""),
  graduationYear: z.string().catch(""),
});

const BLANK_EDUCATION = { degree: "", field: "", institution: "", graduationYear: "" };

const BLANK_ROLE = {
  company: "",
  title: "",
  startDate: "",
  endDate: "",
  current: false,
  responsibilities: "",
};

/** `profiles` row to the shape the profile form renders. */
export function rowToFormValues(row: ProfileRow): ProfileFormValues {
  const roles = z.array(storedRoleSchema).catch([]).parse(row.work_experience);

  return {
    fullName: row.full_name ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    location: row.location ?? "",
    linkedinUrl: row.linkedin_url ?? "",
    portfolioUrl: row.portfolio_url ?? "",
    workAuthorization: row.work_authorization ?? "",
    currentTitle: row.current_title ?? "",
    experienceLevel: row.experience_level ?? "",
    yearsExperience: row.years_experience === null ? "" : String(row.years_experience),
    skills: row.skills,
    industries: row.industries,
    // The form always shows at least one role card, even for a brand-new profile.
    workExperience: roles.length > 0 ? roles : [BLANK_ROLE],
    education: storedEducationSchema.catch(BLANK_EDUCATION).parse(row.education),
    jobTitlesSeeking: joinList(row.job_titles_seeking),
    remotePreference: row.remote_preference ?? "",
    salaryExpectation: row.salary_expectation ?? "",
    preferredLocations: joinList(row.preferred_locations),
  };
}

const orNull = (value: string): string | null => (value === "" ? null : value);

/**
 * Validated form input to a `profiles` update. Email, id, resume and cover-letter tone are left out on
 * purpose: the form does not own them.
 */
export function inputToRowUpdate(values: ProfileInput, completion: ProfileCompletion) {
  return {
    full_name: orNull(values.fullName),
    phone: orNull(values.phone),
    location: orNull(values.location),
    linkedin_url: orNull(values.linkedinUrl),
    portfolio_url: orNull(values.portfolioUrl),
    work_authorization: orNull(values.workAuthorization),
    current_title: orNull(values.currentTitle),
    experience_level: orNull(values.experienceLevel),
    years_experience: values.yearsExperience === "" ? null : Number(values.yearsExperience),
    skills: values.skills,
    industries: values.industries,
    work_experience: values.workExperience,
    education: values.education,
    job_titles_seeking: splitList(values.jobTitlesSeeking),
    remote_preference: orNull(values.remotePreference),
    preferred_locations: splitList(values.preferredLocations),
    salary_expectation: orNull(values.salaryExpectation),
    is_complete: completion.isComplete,
    completion_percentage: completion.percentage,
    missing_fields: completion.missingFields,
  };
}
