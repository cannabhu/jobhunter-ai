import { PostHog } from "posthog-node";

/**
 * Server-side PostHog client. Create one per request, capture, then `await posthog.shutdown()` in the same
 * function: Next.js functions are short-lived, so anything not flushed by then is lost.
 */
export const createPostHogServer = () =>
  new PostHog(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
    flushAt: 1,
    flushInterval: 0,
  });
