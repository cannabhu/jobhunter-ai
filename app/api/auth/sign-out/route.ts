import { after, NextResponse, type NextRequest } from "next/server";
import { clearAuthCookies, createAuthActions } from "@insforge/sdk/ssr";
import { loggerProvider, posthogLogger, SeverityNumber } from "@/instrumentation";

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 303 so the browser follows the redirect with GET after a form POST.
  const response = NextResponse.redirect(new URL("/", request.url), 303);

  try {
    const auth = createAuthActions({
      requestCookies: request.cookies,
      responseCookies: response.cookies,
    });
    const { error } = await auth.signOut();
    if (error) console.error("[api/auth/sign-out]", error.message);
  } catch (error) {
    console.error("[api/auth/sign-out]", error);
  }

  // Whatever happened upstream, the user must end up signed out locally.
  clearAuthCookies(response.cookies);
  posthogLogger?.emit({
    body: "sign_out_completed",
    severityNumber: SeverityNumber.INFO,
    attributes: { outcome: "completed" },
  });
  after(() => loggerProvider?.forceFlush().catch(() => {}));
  return response;
}
