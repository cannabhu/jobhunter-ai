import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@insforge/sdk/ssr/middleware";
import { SIGNED_IN_HOME } from "@/lib/routes";

const PROTECTED = ["/dashboard", "/profile", "/find-jobs", "/sign-out"];

/** Redirects while carrying over any session cookies `updateSession` just refreshed. */
function redirectKeepingSession(url: URL, response: NextResponse) {
  const redirect = NextResponse.redirect(url);
  for (const cookie of response.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
}

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const { accessToken } = await updateSession({
    requestCookies: request.cookies,
    responseCookies: response.cookies,
  });

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isProtected && !accessToken) {
    return redirectKeepingSession(new URL("/login", request.url), response);
  }
  // ?error means a page just rejected this session (revoked or forged token); without this
  // exception the redirect from that page back to /login would bounce straight into a loop.
  if (pathname === "/login" && accessToken && !request.nextUrl.searchParams.has("error")) {
    return redirectKeepingSession(new URL(SIGNED_IN_HOME.href, request.url), response);
  }

  return response;
}

// The session cookie expires with its access token and only this proxy can refresh it, so it must run
// on every API route that calls getUser(). /api/auth/* is skipped: those routes manage the session themselves.
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
