import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@insforge/sdk/ssr/middleware";

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
  if (pathname === "/login" && accessToken) {
    return redirectKeepingSession(new URL("/dashboard", request.url), response);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
