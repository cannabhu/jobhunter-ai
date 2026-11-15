// Limits and allowed values shared by Save validation (profileSchema) and resume extraction. No imports, so client code can use it.

export const MAX_ROLES = 3;
export const MAX_TAGS = 50;
export const MAX_TAG_LENGTH = 60;
export const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
export const FIRST_GRADUATION_YEAR = 1950;
export const GRADUATION_YEARS_AHEAD = 10;
export const MAX_YEARS_EXPERIENCE = 60;

export const DEGREE_VALUES = ["high_school", "associate", "bachelor", "master", "doctorate", "other"] as const;
export const EXPERIENCE_LEVEL_VALUES = ["junior", "mid", "senior", "lead"] as const;
export const WORK_AUTHORIZATION_VALUES = ["citizen", "permanent_resident", "visa_required"] as const;
export const REMOTE_PREFERENCE_VALUES = ["remote", "onsite", "hybrid", "any"] as const;

export const FIELD_LIMITS = {
  fullName: 120,
  phone: 40,
  location: 120,
  url: 300,
  currentTitle: 120,
  company: 120,
  roleTitle: 120,
  responsibilities: 2000,
  fieldOfStudy: 120,
  institution: 120,
} as const;
