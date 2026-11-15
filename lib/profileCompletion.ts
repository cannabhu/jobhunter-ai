import { splitList } from "@/lib/profileFormData";
import type { ProfileInput } from "@/types";

type RequiredField = {
  /** Lowercase label stored in `profiles.missing_fields`; the banner shows it uppercased. */
  slug: string;
  isFilled: (values: ProfileInput) => boolean;
};

/** Listed in form order so the banner tags read top to bottom. */
const REQUIRED_FIELDS: RequiredField[] = [
  { slug: "full name", isFilled: (v) => v.fullName !== "" },
  { slug: "phone", isFilled: (v) => v.phone !== "" },
  { slug: "location", isFilled: (v) => v.location !== "" },
  { slug: "work authorization", isFilled: (v) => v.workAuthorization !== "" },
  { slug: "current title", isFilled: (v) => v.currentTitle !== "" },
  { slug: "experience level", isFilled: (v) => v.experienceLevel !== "" },
  { slug: "years of experience", isFilled: (v) => v.yearsExperience !== "" },
  { slug: "skills", isFilled: (v) => v.skills.length > 0 },
  { slug: "work experience", isFilled: (v) => v.workExperience.some((role) => role.company !== "" && role.title !== "") },
  { slug: "education", isFilled: (v) => v.education.degree !== "" && v.education.institution !== "" },
  { slug: "job titles seeking", isFilled: (v) => splitList(v.jobTitlesSeeking).length > 0 },
];

export type ProfileCompletion = {
  percentage: number;
  missingFields: string[];
  isComplete: boolean;
};

export function calculateCompletion(values: ProfileInput): ProfileCompletion {
  const missingFields = REQUIRED_FIELDS.filter((field) => !field.isFilled(values)).map((field) => field.slug);
  const filledCount = REQUIRED_FIELDS.length - missingFields.length;
  return {
    percentage: Math.round((filledCount / REQUIRED_FIELDS.length) * 100),
    missingFields,
    isComplete: missingFields.length === 0,
  };
}
