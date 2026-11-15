/** Row shape of public.profiles — mirrors db/migrations/001_initial_schema.sql. */
export type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  current_title: string | null;
  experience_level: "junior" | "mid" | "senior" | "lead" | null;
  years_experience: number | null;
  skills: string[];
  industries: string[];
  work_experience: unknown[];
  education: Record<string, unknown>;
  job_titles_seeking: string[];
  remote_preference: "remote" | "onsite" | "hybrid" | "any" | null;
  preferred_locations: string[];
  salary_expectation: string | null;
  cover_letter_tone: "formal" | "casual" | "enthusiastic" | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  work_authorization: "citizen" | "permanent_resident" | "visa_required" | null;
  resume_pdf_url: string | null;
  is_complete: boolean;
  completion_percentage: number;
  missing_fields: string[];
  created_at: string;
  updated_at: string;
};

export type WorkExperienceEntry = {
  company: string;
  title: string;
  /** `YYYY-MM`, the value format of `<input type="month">`. */
  startDate: string;
  endDate: string;
  current: boolean;
  responsibilities: string;
};

export type EducationEntry = {
  degree: string;
  field: string;
  institution: string;
  graduationYear: string;
};

/** Profile page form state. Free-text list fields are comma-separated strings, matching the inputs. */
export type ProfileFormValues = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  portfolioUrl: string;
  workAuthorization: NonNullable<ProfileRow["work_authorization"]> | "";
  currentTitle: string;
  experienceLevel: NonNullable<ProfileRow["experience_level"]> | "";
  yearsExperience: string;
  skills: string[];
  industries: string[];
  workExperience: WorkExperienceEntry[];
  education: EducationEntry;
  jobTitlesSeeking: string;
  remotePreference: NonNullable<ProfileRow["remote_preference"]> | "";
  salaryExpectation: string;
  preferredLocations: string;
};

/** What a Save Profile submit carries. Email is excluded: it always comes from the auth session. */
export type ProfileInput = Omit<ProfileFormValues, "email">;

/** Result of the `saveProfile` Server Action. `fieldErrors` is keyed by the form input name. */
export type SaveProfileResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  /** True when this save moved the profile from incomplete to complete. */
  justCompleted?: boolean;
};

/** The form fields a resume can fill. Blank strings and empty lists mean "the resume didn't say". */
export type ExtractedProfile = Pick<
  ProfileFormValues,
  | "fullName"
  | "phone"
  | "location"
  | "linkedinUrl"
  | "portfolioUrl"
  | "currentTitle"
  | "experienceLevel"
  | "yearsExperience"
  | "skills"
  | "industries"
  | "workExperience"
  | "education"
>;

/** Response of `POST /api/resume/extract`. */
export type ExtractResumeResponse = { success: true; data: ExtractedProfile } | { success: false; error: string };
