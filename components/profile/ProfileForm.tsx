"use client";

import { EducationSection } from "@/components/profile/EducationSection";
import { JobPreferencesSection } from "@/components/profile/JobPreferencesSection";
import { PersonalInfoSection } from "@/components/profile/PersonalInfoSection";
import { ProfessionalInfoSection } from "@/components/profile/ProfessionalInfoSection";
import { WorkExperienceSection } from "@/components/profile/WorkExperienceSection";
import type { ProfileFormValues } from "@/types";

type Props = {
  values: ProfileFormValues;
  missingFields: string[];
};

export function ProfileForm({ values, missingFields }: Props) {
  return (
    <form
      onSubmit={(event) => event.preventDefault()}
      className="rounded-xl border border-border bg-surface p-8 shadow-card"
    >
      <header className="pb-5">
        <h2 className="text-xl font-semibold text-text-primary">Profile Information</h2>
        <p className="mt-1 text-sm text-text-secondary">
          This context is used to accurately represent you in agent interactions.
        </p>
      </header>
      <PersonalInfoSection values={values} />
      <ProfessionalInfoSection values={values} />
      <WorkExperienceSection initialRoles={values.workExperience} />
      <EducationSection education={values.education} flagged={missingFields.includes("education")} />
      <JobPreferencesSection values={values} />
      <div className="border-t border-border pt-8">
        <button
          type="submit"
          className="w-full rounded-md bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent-dark"
        >
          Save Profile
        </button>
      </div>
    </form>
  );
}
