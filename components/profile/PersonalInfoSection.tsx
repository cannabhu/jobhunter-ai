import { FormField } from "@/components/profile/FormField";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { SelectInput } from "@/components/profile/SelectInput";
import { inputClass } from "@/components/profile/fieldStyles";
import type { ProfileFormValues } from "@/types";

const WORK_AUTHORIZATION_OPTIONS = [
  { value: "citizen", label: "Citizen" },
  { value: "permanent_resident", label: "Permanent Resident" },
  { value: "visa_required", label: "Visa Required" },
];

type Props = {
  values: ProfileFormValues;
};

export function PersonalInfoSection({ values }: Props) {
  return (
    <ProfileSection title="Personal Info">
      <div className="grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2">
        <FormField label="Full Name" htmlFor="fullName">
          <input id="fullName" name="fullName" type="text" autoComplete="name" placeholder="Your full name" defaultValue={values.fullName} className={inputClass} />
        </FormField>
        <FormField label="Email" htmlFor="email">
          <input id="email" name="email" type="email" readOnly placeholder="you@example.com" defaultValue={values.email} className={inputClass} />
        </FormField>
        <FormField label="Phone Number" htmlFor="phone">
          <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+1 (555) 000-0000" defaultValue={values.phone} className={inputClass} />
        </FormField>
        <FormField label="Location" htmlFor="location">
          <input id="location" name="location" type="text" autoComplete="address-level2" placeholder="City, Country" defaultValue={values.location} className={inputClass} />
        </FormField>
        <FormField label="LinkedIn URL" htmlFor="linkedinUrl">
          <input id="linkedinUrl" name="linkedinUrl" type="url" placeholder="https://linkedin.com/in/username" defaultValue={values.linkedinUrl} className={inputClass} />
        </FormField>
        <FormField label="Portfolio / GitHub" htmlFor="portfolioUrl">
          <input id="portfolioUrl" name="portfolioUrl" type="url" placeholder="https://github.com/username" defaultValue={values.portfolioUrl} className={inputClass} />
        </FormField>
        <FormField label="Work Authorization" htmlFor="workAuthorization">
          <SelectInput id="workAuthorization" name="workAuthorization" options={WORK_AUTHORIZATION_OPTIONS} defaultValue={values.workAuthorization} placeholder="Select authorization" />
        </FormField>
      </div>
    </ProfileSection>
  );
}
