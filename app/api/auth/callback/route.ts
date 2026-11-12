import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createAuthActions } from "@insforge/sdk/ssr";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const failure = NextResponse.redirect(new URL("/login?error=oauth", request.url));

  try {
    const code = request.nextUrl.searchParams.get("insforge_code");
    const verifier = (await cookies()).get("insforge_code_verifier")?.value;
    if (!code || !verifier) return failure;

    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    const auth = createAuthActions({
      requestCookies: request.cookies,
      responseCookies: response.cookies,
    });

    const { error } = await auth.exchangeOAuthCode(code, verifier);
    if (error) {
      console.error("[api/auth/callback]", error.message);
      return failure;
    }

    // PostHog identify hooks in here in feature 03.
    response.cookies.delete("insforge_code_verifier");
    return response;
  } catch (error) {
    console.error("[api/auth/callback]", error);
    return failure;
  }
}
