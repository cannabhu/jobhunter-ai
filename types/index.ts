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

/** Response of `POST /api/resume/generate`. */
export type GenerateResumeResponse = { success: true } | { success: false; error: string };

/** One row of the Find Jobs table. `foundLabel` is already human readable ("2 hours ago"). */
export type JobListItem = {
  id: string;
  company: string;
  title: string;
  matchScore: number;
  salary: string | null;
  foundLabel: string;
};

/** GPT-4o's verdict on one job, after `normalizeJobScore` has made it safe to store. */
export type JobScore = {
  /** Integer 0 to 100. */
  matchScore: number;
  matchReason: string;
  matchedSkills: string[];
  missingSkills: string[];
};

/** What one Find Jobs search reports back. Counts cover every Adzuna result, new or already saved. */
export type FindJobsResult = {
  message: string;
  found: number;
  newCount: number;
  strongMatches: number;
};

/** Response of `POST /api/agent/find`. */
export type FindJobsResponse = { success: true; data: FindJobsResult } | { success: false; error: string };

/** Which saved jobs the Find Jobs table shows, by score against `MATCH_THRESHOLD`. */
export type MatchFilter = "all" | "high" | "low";

/** How the Find Jobs table is ordered. */
export type JobSort = "match" | "newest" | "oldest";

/** The Find Jobs filter, sort and page, as kept in the URL (`q`, `match`, `sort`, `page`). */
export type JobsQuery = {
  /** Case-insensitive text matched against company and title; empty means no text filter. */
  query: string;
  match: MatchFilter;
  sort: JobSort;
  /** 1-based. */
  page: number;
};

/** A page of saved jobs for the Find Jobs table. `total` counts every job matching the filters, not just this page. */
export type JobListPage = {
  jobs: JobListItem[];
  total: number;
  /** The page actually returned: the requested one, or the last page when it asked for one past the end. */
  page: number;
};

/** A page button in the jobs pagination; `ellipsis` stands for the skipped pages. */
export type PaginationItem = number | "ellipsis";
