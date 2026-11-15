import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { signInWithGitHub, signInWithGoogle } from "@/actions/auth";
import { SignInFailedTracker } from "@/components/analytics/SignInFailedTracker";
import { OAuthSignInButtons } from "@/components/auth/OAuthSignInButtons";

async function ErrorNotice({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { error } = await searchParams;
  if (!error) return null;

  const sessionExpired = error === "session";

  return (
    <>
      {sessionExpired ? null : <SignInFailedTracker />}
      <p role="alert" className="mt-6 rounded-md border border-error px-3 py-2 text-xs text-error">
        {sessionExpired ? "Your session has expired. Please sign in again." : "Sign-in didn\u2019t complete. Please try again."}
      </p>
    </>
  );
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="bg-hero-gradient flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 shadow-card">
        <Link href="/" aria-label="JobPilot home" className="flex justify-center">
          <Image src="/logo.png" alt="JobPilot" width={496} height={168} className="h-9 w-auto" preload />
        </Link>
        <h1 className="mt-6 text-center text-2xl font-semibold tracking-tight text-text-slate">Welcome to JobPilot</h1>
        <p className="mt-2 text-center text-sm text-text-secondary">Sign in to find and research your next role.</p>

        <Suspense>
          <ErrorNotice searchParams={searchParams} />
        </Suspense>

        <OAuthSignInButtons signInWithGoogle={signInWithGoogle} signInWithGitHub={signInWithGitHub} />
      </div>
    </main>
  );
}
