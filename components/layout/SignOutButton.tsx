"use client";

import { LogOut } from "lucide-react";
import posthog from "posthog-js";

/**
 * Looks like a navbar link but is a form submit: signing out changes state, so it must be a POST, not a GET
 * link that prefetching or crawlers could trigger. One click, no confirmation; the route redirects home.
 */
export function SignOutButton() {
  const handleSubmit = () => {
    posthog.capture("user_signed_out");
    posthog.reset();
  };

  return (
    <form action="/api/auth/sign-out" method="post" onSubmit={handleSubmit} className="flex h-full">
      <button
        type="submit"
        className="flex h-full cursor-pointer items-center gap-2 border-b-2 border-transparent px-2 text-sm font-medium text-text-secondary hover:text-text-primary sm:px-4"
      >
        <LogOut className="size-4" aria-hidden="true" />
        <span className="max-sm:sr-only">Sign out</span>
      </button>
    </form>
  );
}
