"use client";

import { useRef, useState } from "react";
import { FilledFieldsProvider } from "@/components/profile/FilledFieldsContext";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ResumeUpload } from "@/components/profile/ResumeUpload";
import { readFormValues } from "@/lib/profileFormData";
import { mergeExtractedValues } from "@/lib/profileMerge";
import type { ExtractedProfile, ProfileFormValues } from "@/types";

type Props = {
  hasResume: boolean;
  values: ProfileFormValues;
  missingFields: string[];
  userId: string;
};

/** Holds the resume card and the profile form together so extracted data can flow from one into the other. */
export function ProfileEditor({ hasResume, values, missingFields, userId }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [formValues, setFormValues] = useState(values);
  // The form's inputs are uncontrolled, so new values only show up when the form remounts under a new key.
  const [formKey, setFormKey] = useState(0);
  // Input names whose value came from the resume; each is dropped when the user edits it, all on a successful save.
  const [filledFields, setFilledFields] = useState<ReadonlySet<string>>(new Set());

  const clearField = (name: string) =>
    setFilledFields((fields) => {
      if (!fields.has(name)) return fields;
      const next = new Set(fields);
      next.delete(name);
      return next;
    });

  const applyExtraction = (extracted: ExtractedProfile): number => {
    // Start from what is typed right now, so unsaved edits to fields the resume doesn't cover survive.
    const current = formRef.current ? readFormValues(new FormData(formRef.current)) : formValues;
    const { values: merged, filledCount, filledFields: filled } = mergeExtractedValues(current, extracted);
    setFormValues(merged);
    setFilledFields(new Set(filled));
    setFormKey((key) => key + 1);
    return filledCount;
  };

  return (
    <>
      <ResumeUpload hasResume={hasResume} onExtracted={applyExtraction} />
      <FilledFieldsProvider fields={filledFields}>
        <ProfileForm
          key={formKey}
          formRef={formRef}
          values={formValues}
          missingFields={missingFields}
          userId={userId}
          onFieldEdited={clearField}
          onSaved={() => setFilledFields(new Set())}
        />
      </FilledFieldsProvider>
    </>
  );
}
