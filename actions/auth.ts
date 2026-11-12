"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAuthActions } from "@insforge/sdk/ssr";

const VERIFIER_COOKIE = "insforge_code_verifier";

// These actions end in a redirect (to the provider, or back to /login on failure), so they
// don't return the usual { success, error } object — failures are signalled via ?error=oauth.
async function startOAuth(provider: "google" | "github"): Promise<void> {
  let providerUrl: string | null = null;

  try {
    const cookieStore = await cookies();
    const auth = createAuthActions({ cookies: cookieStore });

    const { data, error } = await auth.signInWithOAuth(provider, {
      redirectTo: new URL("/api/auth/callback", process.env.NEXT_PUBLIC_APP_URL).toString(),
      skipBrowserRedirect: true,
    });

    if (error || !data?.url || !data.codeVerifier) {
      console.error("[actions/auth]", error?.message ?? "OAuth init returned no URL or verifier");
    } else {
      cookieStore.set(VERIFIER_COOKIE, data.codeVerifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 10,
      });
      providerUrl = data.url;
    }
  } catch (error) {
    console.error("[actions/auth]", error);
  }

  // redirect() works by throwing, so it must stay outside the try/catch.
  redirect(providerUrl ?? "/login?error=oauth");
}

export async function signInWithGoogle(): Promise<void> {
  await startOAuth("google");
}

export async function signInWithGitHub(): Promise<void> {
  await startOAuth("github");
}
