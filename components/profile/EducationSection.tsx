import { FormField } from "@/components/profile/FormField";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { SelectInput } from "@/components/profile/SelectInput";
import { inputClass, raisedInputClass } from "@/components/profile/fieldStyles";
import type { EducationEntry } from "@/types";

const DEGREE_OPTIONS = [
  { value: "high_school", label: "High School" },
  { value: "associate", label: "Associate's Degree" },
  { value: "bachelor", label: "Bachelor's Degree" },
  { value: "master", label: "Master's Degree" },
  { value: "doctorate", label: "Doctorate" },
  { value: "other", label: "Other" },
];

type Props = {
  education: EducationEntry;
  flagged: boolean;
};

export function EducationSection({ education, flagged }: Props) {
  const textInputClass = flagged ? raisedInputClass : inputClass;

  return (
    <ProfileSection title="Education" fieldPrefixes={["education."]}>
      <div className="grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2">
        <FormField label="Highest Degree" htmlFor="degree" name="education.degree">
          <SelectInput id="degree" name="education.degree" options={DEGREE_OPTIONS} defaultValue={education.degree} placeholder="Select degree" />
        </FormField>
        <FormField label="Field of Study" htmlFor="fieldOfStudy" name="education.field">
          <input id="fieldOfStudy" name="education.field" type="text" placeholder="E.g. Computer Science" defaultValue={education.field} className={textInputClass} />
        </FormField>
        <FormField label="Institution Name" htmlFor="institution" name="education.institution">
          <input id="institution" name="education.institution" type="text" placeholder="E.g. State University" defaultValue={education.institution} className={textInputClass} />
        </FormField>
        <FormField label="Graduation Year" htmlFor="graduationYear" name="education.graduationYear">
          <input id="graduationYear" name="education.graduationYear" type="text" inputMode="numeric" maxLength={4} placeholder="YYYY" defaultValue={education.graduationYear} className={textInputClass} />
        </FormField>
      </div>
    </ProfileSection>
  );
}
