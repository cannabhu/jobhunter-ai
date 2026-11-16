import { FormField } from "@/components/profile/FormField";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { SelectInput } from "@/components/profile/SelectInput";
import { inputClass } from "@/components/profile/fieldStyles";
import type { ProfileFormValues } from "@/types";

const REMOTE_PREFERENCE_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

const COVER_LETTER_TONE_OPTIONS = [
  { value: "formal", label: "Formal" },
  { value: "casual", label: "Casual" },
  { value: "enthusiastic", label: "Enthusiastic" },
];

type Props = {
  values: ProfileFormValues;
};

export function JobPreferencesSection({ values }: Props) {
  return (
    <ProfileSection title="Job Preferences">
      <div className="flex flex-col gap-6">
        <FormField label="Job Titles Seeking" htmlFor="jobTitlesSeeking">
          <input id="jobTitlesSeeking" name="jobTitlesSeeking" type="text" placeholder="E.g. Frontend Engineer, React Developer" defaultValue={values.jobTitlesSeeking} className={inputClass} />
        </FormField>
        <div className="grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2">
          <FormField label="Remote Preference" htmlFor="remotePreference">
            <SelectInput id="remotePreference" name="remotePreference" options={REMOTE_PREFERENCE_OPTIONS} defaultValue={values.remotePreference} />
          </FormField>
          <FormField label="Salary Expectation (Optional)" htmlFor="salaryExpectation">
            <input id="salaryExpectation" name="salaryExpectation" type="text" placeholder="E.g. $120k+" defaultValue={values.salaryExpectation} className={inputClass} />
          </FormField>
        </div>
        <FormField label="Preferred Locations (Optional)" htmlFor="preferredLocations">
          <input id="preferredLocations" name="preferredLocations" type="text" placeholder="E.g. New York, London" defaultValue={values.preferredLocations} className={inputClass} />
        </FormField>
        {/* Feature 18 is the control only: nothing reads or saves this field until feature 19. */}
        <FormField label="Cover Letter Tone (Optional)" htmlFor="coverLetterTone">
          <SelectInput id="coverLetterTone" name="coverLetterTone" options={COVER_LETTER_TONE_OPTIONS} placeholder="Choose a tone" />
        </FormField>
      </div>
    </ProfileSection>
  );
}
