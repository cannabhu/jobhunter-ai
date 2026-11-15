import type { ProfileFormValues } from "@/types";

/** Placeholder data for feature 05. Feature 06 replaces it with `getProfile()`. */
export const MOCK_COMPLETION_PERCENTAGE = 70;

export const MOCK_MISSING_FIELDS = ["phone", "location", "education"];

export const MOCK_PROFILE_VALUES: ProfileFormValues = {
  fullName: "Faizan Ali",
  email: "faizan@jsmastery.pro",
  phone: "",
  location: "",
  linkedinUrl: "https://linkedin.com/in/faizan",
  portfolioUrl: "https://github.com/jsmastery",
  workAuthorization: "citizen",
  currentTitle: "Frontend Engineer",
  experienceLevel: "junior",
  yearsExperience: "4",
  skills: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
  industries: [],
  workExperience: [
    {
      company: "Vercel",
      title: "Frontend Engineer",
      startDate: "2022-01",
      endDate: "",
      current: true,
      responsibilities: "Built Next.js features and optimized web vitals. Led a team of 3 developers.",
    },
  ],
  education: {
    degree: "high_school",
    field: "Computer Science",
    institution: "",
    graduationYear: "",
  },
  jobTitlesSeeking: "Frontend Engineer, React Developer",
  remotePreference: "any",
  salaryExpectation: "",
  preferredLocations: "",
};
