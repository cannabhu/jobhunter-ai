import { insforge } from "@/lib/insforge/client";
import posthog from "posthog-js";

// Keep in sync with app/api/auth/callback/route.ts.
const JUST_SIGNED_IN_COOKIE = "jp_just_signed_in";

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (token && host) {
  posthog.init(token, {
    api_host: host,
    defaults: "2026-08-30",
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
  });

  void insforge.auth
    .getCurrentUser()
    .then(({ data }) => {
      const user = data.user;
      if (!user) return;

      posthog.identify(user.id, {
        email: user.email,
        ...(user.profile?.name ? { name: user.profile.name } : {}),
      });

      // /api/auth/callback sets this one-shot cookie after a successful OAuth exchange, so the event
      // fires once per real sign-in — not on new devices, cleared storage, or ordinary page loads.
      if (document.cookie.split("; ").includes(`${JUST_SIGNED_IN_COOKIE}=1`)) {
        document.cookie = `${JUST_SIGNED_IN_COOKIE}=; path=/; max-age=0`;
        posthog.capture("user_signed_in");
      }
    })
    .catch(() => {});
} else if (process.env.NODE_ENV === "development") {
  const missingVariable = token
    ? "NEXT_PUBLIC_POSTHOG_HOST"
    : "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN";

  console.error(
    `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
  );
}
