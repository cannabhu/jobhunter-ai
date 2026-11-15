"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

/** Mounted only when /login shows the sign-in error notice. */
export function SignInFailedTracker() {
  useEffect(() => {
    posthog.capture("sign_in_failed", { reason: "oauth" });

    // Drop ?error from the URL so a reload doesn't count the same failure again.
    // The notice stays visible until the next navigation.
    const url = new URL(window.location.href);
    if (url.searchParams.delete("error")) {
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);

  return null;
}
