import { MAX_TAGS } from "@/lib/profileConstants";
import { uniqueIgnoringCase } from "@/lib/profileFormData";
import type { ExtractedProfile, ProfileFormValues } from "@/types";

const SCALAR_FIELDS = [
  "fullName",
  "phone",
  "location",
  "linkedinUrl",
  "portfolioUrl",
  "currentTitle",
  "experienceLevel",
  "yearsExperience",
] as const;

export type MergeResult = {
  values: ProfileFormValues;
  /** How many form fields or sections the resume supplied a value for. */
  filledCount: number;
  /**
   * Form input names whose value now comes from the resume, for highlighting: scalar field names, `skills` /
   * `industries` plus `skills:{lowercase tag}`, `education.{field}` and `workExperience.{index}.{field}`.
   */
  filledFields: string[];
};

const ROLE_TEXT_FIELDS = ["company", "title", "startDate", "endDate", "responsibilities"] as const;
const EDUCATION_FIELDS = ["degree", "field", "institution", "graduationYear"] as const;

/**
 * Lays resume data over the current form values: the resume wins where it has a value, blanks leave the
 * current value alone, skills and industries are unioned, and work roles / education are replaced as blocks.
 */
export function mergeExtractedValues(current: ProfileFormValues, extracted: ExtractedProfile): MergeResult {
  const values: ProfileFormValues = { ...current };
  let filledCount = 0;
  const filledFields: string[] = [];

  for (const field of SCALAR_FIELDS) {
    if (extracted[field] === "") continue;
    Object.assign(values, { [field]: extracted[field] });
    filledCount += 1;
    filledFields.push(field);
  }

  for (const field of ["skills", "industries"] as const) {
    if (extracted[field].length === 0) continue;
    values[field] = uniqueIgnoringCase([...current[field], ...extracted[field]]).slice(0, MAX_TAGS);
    filledCount += 1;
    filledFields.push(field, ...extracted[field].map((tag) => `${field}:${tag.toLowerCase()}`));
  }

  if (extracted.workExperience.length > 0) {
    values.workExperience = extracted.workExperience;
    filledCount += 1;
    extracted.workExperience.forEach((role, index) => {
      for (const roleField of ROLE_TEXT_FIELDS) {
        if (role[roleField] !== "") filledFields.push(`workExperience.${index}.${roleField}`);
      }
    });
  }

  const { degree, field, institution, graduationYear } = extracted.education;
  if (degree || field || institution || graduationYear) {
    values.education = extracted.education;
    filledCount += 1;
    for (const educationField of EDUCATION_FIELDS) {
      if (extracted.education[educationField] !== "") filledFields.push(`education.${educationField}`);
    }
  }

  return { values, filledCount, filledFields };
}
