import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { signInWithGitHub, signInWithGoogle } from "@/actions/auth";

const providerButton =
  "flex w-full items-center justify-center gap-3 rounded-md border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text-primary shadow-card hover:bg-surface-secondary";

async function ErrorNotice({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { error } = await searchParams;
  if (!error) return null;

  return (
    <p role="alert" className="mt-6 rounded-md border border-error px-3 py-2 text-xs text-error">
      Sign-in didn&apos;t complete. Please try again.
    </p>
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

        <div className="mt-6 flex flex-col gap-3">
          <form action={signInWithGoogle}>
            <button type="submit" className={providerButton}>
              <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="currentColor">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.07 1.07-2.74 2.24-5.66 2.24-4.52 0-8.06-3.65-8.06-8.17s3.54-8.17 8.06-8.17c2.43 0 4.22.96 5.53 2.2l2.31-2.31C18.8 1.04 16.37 0 12.48 0 5.87 0 .31 5.39.31 12s5.56 12 12.17 12c3.57 0 6.26-1.17 8.36-3.36 2.16-2.16 2.84-5.21 2.84-7.67 0-.76-.05-1.46-.18-2.05H12.48z" />
              </svg>
              Continue with Google
            </button>
          </form>
          <form action={signInWithGitHub}>
            <button type="submit" className={providerButton}>
              <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="currentColor">
                <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />
              </svg>
              Continue with GitHub
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
