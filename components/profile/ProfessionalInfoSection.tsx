import { FormField } from "@/components/profile/FormField";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { SelectInput } from "@/components/profile/SelectInput";
import { TagInput } from "@/components/profile/TagInput";
import { inputClass } from "@/components/profile/fieldStyles";
import type { ProfileFormValues } from "@/types";

const EXPERIENCE_LEVEL_OPTIONS = [
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid-level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
];

type Props = {
  values: ProfileFormValues;
};

export function ProfessionalInfoSection({ values }: Props) {
  return (
    <ProfileSection title="Professional Info">
      <div className="flex flex-col gap-6">
        <FormField label="Current/Recent Job Title" htmlFor="currentTitle">
          <input id="currentTitle" name="currentTitle" type="text" placeholder="E.g. Frontend Engineer" defaultValue={values.currentTitle} className={inputClass} />
        </FormField>
        <div className="grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2">
          <FormField label="Experience Level" htmlFor="experienceLevel">
            <SelectInput id="experienceLevel" name="experienceLevel" options={EXPERIENCE_LEVEL_OPTIONS} defaultValue={values.experienceLevel} placeholder="Select level" />
          </FormField>
          <FormField label="Years of Experience" htmlFor="yearsExperience">
            <input id="yearsExperience" name="yearsExperience" type="number" min={0} max={60} inputMode="numeric" placeholder="E.g. 3" defaultValue={values.yearsExperience} className={inputClass} />
          </FormField>
        </div>
        <TagInput label="Skills" name="skills" placeholder="Add a skill" initialTags={values.skills} />
        <TagInput label="Industries Worked In (Optional)" name="industries" placeholder="E.g. FinTech, Healthcare" initialTags={values.industries} />
      </div>
    </ProfileSection>
  );
}
