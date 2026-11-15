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
