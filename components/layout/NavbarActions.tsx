import Link from "next/link";
import { Suspense } from "react";
import { getUser } from "@/lib/insforge/server";

const button =
  "rounded-md bg-overlay px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-overlay-dark";

function SignedOut() {
  return (
    <Link href="/login" className={button}>
      Start for free
    </Link>
  );
}

async function SessionActions() {
  if (!(await getUser())) return <SignedOut />;

  return (
    <Link href="/dashboard" className={button}>
      Go to Dashboard
    </Link>
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
