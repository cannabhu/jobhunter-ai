import { Suspense } from "react";
import { CtaButtons } from "@/components/homepage/CtaButtons";
import { getUser } from "@/lib/insforge/server";

async function SessionCtaButtons({ location }: { location: string }) {
  return <CtaButtons isAuthed={Boolean(await getUser())} location={location} />;
}

/** Streams the session-aware CTAs; the signed-out version is the static fallback. */
export function AuthCtaButtons({ location }: { location: string }) {
  return (
    <Suspense fallback={<CtaButtons isAuthed={false} location={location} />}>
      <SessionCtaButtons location={location} />
    </Suspense>
  );
}
