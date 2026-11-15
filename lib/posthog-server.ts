import { PostHog } from "posthog-node";

/**
 * Server-side PostHog client. Create one per request, capture, then `await posthog.shutdown()` in the same
 * function: Next.js functions are short-lived, so anything not flushed by then is lost.
 *
 * A missing token or host is reported loudly and the client is created disabled. Without a host, posthog-node
 * falls back to its US endpoint and every event is rejected, and analytics must never break a finished request.
 */
export const createPostHogServer = () => {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!token || !host) {
    const missing = [!token && "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", !host && "NEXT_PUBLIC_POSTHOG_HOST"].filter(Boolean).join(", ");
    console.error(`[posthog-server] ${missing} is missing, so server-side events are not being sent. Check .env.local.`);
    return new PostHog(token ?? "missing-token", { host, disabled: true });
  }

  return new PostHog(token, { host, flushAt: 1, flushInterval: 0 });
};
