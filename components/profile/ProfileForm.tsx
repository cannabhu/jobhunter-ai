"use client";

import { Sparkles } from "lucide-react";
import posthog from "posthog-js";
import { useState, useTransition, type FormEvent, type Ref } from "react";
import { saveProfile } from "@/actions/profile";
import { useFilledFields } from "@/components/profile/FilledFieldsContext";
import { EducationSection } from "@/components/profile/EducationSection";
import { JobPreferencesSection } from "@/components/profile/JobPreferencesSection";
import { PersonalInfoSection } from "@/components/profile/PersonalInfoSection";
import { ProfessionalInfoSection } from "@/components/profile/ProfessionalInfoSection";
import { WorkExperienceSection } from "@/components/profile/WorkExperienceSection";
import type { ProfileFormValues, SaveProfileResult } from "@/types";

type Props = {
  values: ProfileFormValues;
  missingFields: string[];
  userId: string;
  /** Lets the parent read what is currently typed in the form. */
  formRef?: Ref<HTMLFormElement>;
  /** Called with the input name when the user edits a field, so its "from resume" highlight can clear. */
  onFieldEdited?: (name: string) => void;
  /** Called after a successful save, when nothing is waiting for review any more. */
  onSaved?: () => void;
};

export function ProfileForm({ values, missingFields, userId, formRef, onFieldEdited, onSaved }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<SaveProfileResult | null>(null);
  const hasResumeFields = useFilledFields().size > 0;

  // Not <form action>: React 19 resets uncontrolled fields after an action, which would wipe the user's input on a validation error.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const response = await saveProfile(formData);
      setResult(response);
      if (response.success) onSaved?.();
      if (response.success && response.justCompleted) {
        posthog.capture("profile_completed", { userId });
      }
    });
  };

  const fieldErrors = result?.fieldErrors ? Object.values(result.fieldErrors) : [];

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      onChange={(event) => {
        setResult((current) => (current?.success ? null : current));
        const target: EventTarget = event.target;
        if (
          (target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) &&
          target.name
        ) {
          onFieldEdited?.(target.name);
        }
      }}
      className="rounded-xl border border-border bg-surface p-8 shadow-card"
    >
      <header className="pb-5">
        <h2 className="text-xl font-semibold text-text-primary">Profile Information</h2>
        <p className="mt-1 text-sm text-text-secondary">
          This context is used to accurately represent you in agent interactions.
        </p>
      </header>
      {hasResumeFields ? (
        <div role="note" className="mb-2 flex items-start gap-3 rounded-md border border-accent-light bg-accent-muted px-4 py-3 text-sm text-text-dark">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
          <p>
            <span className="font-semibold text-accent">Filled from your resume.</span> Highlighted fields came from your resume. Check
            them, edit anything that&apos;s off, then click Save Profile. A highlight clears once you edit that field.
          </p>
        </div>
      ) : null}
      <PersonalInfoSection values={values} />
      <ProfessionalInfoSection values={values} />
      <WorkExperienceSection initialRoles={values.workExperience} />
      <EducationSection education={values.education} flagged={missingFields.includes("education")} />
      <JobPreferencesSection values={values} />
      <div className="border-t border-border pt-8">
        {result && !result.success ? (
          <div role="alert" className="mb-4 rounded-md border border-error-light bg-error-lightest px-4 py-3 text-sm text-text-dark">
            <p className="font-semibold text-error">{result.error}</p>
            {fieldErrors.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {fieldErrors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        {result?.success ? (
          <p role="status" className="mb-4 rounded-md border border-success-light bg-success-lightest px-4 py-3 text-sm font-medium text-success-foreground">
            Profile saved.
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className="w-full rounded-md bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent-dark disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save Profile"}
        </button>
      </div>
    </form>
  );
}
