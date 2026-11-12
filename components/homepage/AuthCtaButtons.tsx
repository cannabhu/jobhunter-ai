import { Suspense } from "react";
import { CtaButtons } from "@/components/homepage/CtaButtons";
import { getUser } from "@/lib/insforge/server";

async function SessionCtaButtons() {
  return <CtaButtons isAuthed={Boolean(await getUser())} />;
}

/** Streams the session-aware CTAs; the signed-out version is the static fallback. */
export function AuthCtaButtons() {
  return (
    <Suspense fallback={<CtaButtons isAuthed={false} />}>
      <SessionCtaButtons />
    </Suspense>
  );
}
