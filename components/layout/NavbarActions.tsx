import { TrackedLink } from "@/components/analytics/TrackedLink";
import { Suspense } from "react";
import { getUser } from "@/lib/insforge/server";
import { SIGNED_IN_HOME } from "@/lib/routes";

const button =
  "whitespace-nowrap rounded-md bg-overlay px-3 py-2 text-sm font-medium text-accent-foreground hover:bg-overlay-dark sm:px-4";

function SignedOut() {
  return (
    <TrackedLink location="navbar" href="/login" className={button}>
      Start for free
    </TrackedLink>
  );
}

async function SessionActions() {
  if (!(await getUser())) return <SignedOut />;

  return (
    <TrackedLink location="navbar" href={SIGNED_IN_HOME.href} className={button}>
      {SIGNED_IN_HOME.label}
    </TrackedLink>
  );
}

/** Streams the session-aware navbar actions; the signed-out button is the static fallback. */
export function NavbarActions() {
  return (
    <Suspense fallback={<SignedOut />}>
      <SessionActions />
    </Suspense>
  );
}
