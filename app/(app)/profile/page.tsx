import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CompletionIndicator } from "@/components/profile/CompletionIndicator";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ResumeUpload } from "@/components/profile/ResumeUpload";
import { getUser } from "@/lib/insforge/server";
import {
  MOCK_COMPLETION_PERCENTAGE,
  MOCK_MISSING_FIELDS,
  MOCK_PROFILE_VALUES,
} from "./mockProfile";

export const metadata: Metadata = {
  title: "Profile — JobPilot",
};

async function ProfileContent() {
  if (!(await getUser())) redirect("/login?error=session");

  return (
    <div className="flex flex-col gap-8">
      <CompletionIndicator percentage={MOCK_COMPLETION_PERCENTAGE} missingFields={MOCK_MISSING_FIELDS} />
      <ResumeUpload />
      <ProfileForm values={MOCK_PROFILE_VALUES} missingFields={MOCK_MISSING_FIELDS} />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="mx-auto w-full max-w-[932px] px-4 py-8 sm:px-6">
      <Suspense fallback={null}>
        <ProfileContent />
      </Suspense>
    </div>
  );
}
