import { cookies } from "next/headers";
import { after, NextResponse, type NextRequest } from "next/server";
import { createAuthActions } from "@insforge/sdk/ssr";
import { loggerProvider, posthogLogger, SeverityNumber } from "@/instrumentation";
import { SIGNED_IN_HOME } from "@/lib/routes";

const JUST_SIGNED_IN_COOKIE = "jp_just_signed_in";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const failure = NextResponse.redirect(new URL("/login?error=oauth", request.url));

  try {
    const code = request.nextUrl.searchParams.get("insforge_code");
    const verifier = (await cookies()).get("insforge_code_verifier")?.value;
    if (!code || !verifier) return failure;

    const response = NextResponse.redirect(new URL(SIGNED_IN_HOME.href, request.url));
    const auth = createAuthActions({
      requestCookies: request.cookies,
      responseCookies: response.cookies,
    });

    const { error } = await auth.exchangeOAuthCode(code, verifier);
    if (error) {
      console.error("[api/auth/callback]", error.message);
      return failure;
    }

    response.cookies.delete("insforge_code_verifier");
    // One-shot signal for the browser to capture `user_signed_in` (read + cleared in instrumentation-client.ts).
    // Deliberately not httpOnly: posthog-js must read it. It carries no user data.
    response.cookies.set(JUST_SIGNED_IN_COOKIE, "1", {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60,
    });
    posthogLogger?.emit({
      body: "oauth_callback_completed",
      severityNumber: SeverityNumber.INFO,
      attributes: { outcome: "success" },
    });
    after(() => loggerProvider?.forceFlush().catch(() => {}));
    return response;
  } catch (error) {
    console.error("[api/auth/callback]", error);
    return failure;
  }
}
