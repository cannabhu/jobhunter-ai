import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CompletionIndicator } from "@/components/profile/CompletionIndicator";
import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import { getProfile } from "@/lib/insforge/profile";
import { getUser } from "@/lib/insforge/server";
import { rowToFormValues } from "@/lib/profileMapping";

export const metadata: Metadata = {
  title: "Profile — JobPilot",
};

async function ProfileContent() {
  const user = await getUser();
  if (!user) redirect("/login?error=session");

  const profile = await getProfile();
  if (!profile) {
    return (
      <section role="alert" className="rounded-xl border border-error-light bg-error-lightest p-8 shadow-card">
        <h2 className="text-xl font-semibold text-text-primary">We couldn&apos;t load your profile</h2>
        <p className="mt-2 text-sm text-text-dark">Please refresh the page. If this keeps happening, try again in a few minutes.</p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {profile.is_complete ? null : (
        <CompletionIndicator percentage={profile.completion_percentage} missingFields={profile.missing_fields} />
      )}
      <ProfileEditor
        hasResume={Boolean(profile.resume_pdf_url)}
        values={rowToFormValues(profile)}
        missingFields={profile.missing_fields}
        userId={user.id}
      />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="mx-auto w-full max-w-[932px] px-4 py-8 sm:px-6">
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent />
      </Suspense>
    </div>
  );
}
