import Image from "next/image";
import Link from "next/link";

export default function SignOutPage() {
  return (
    <main className="bg-hero-gradient flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 text-center shadow-card">
        <Link href="/" aria-label="JobPilot home" className="flex justify-center">
          <Image src="/logo.png" alt="JobPilot" width={496} height={168} className="h-9 w-auto" preload />
        </Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-text-slate">Sign out of JobPilot?</h1>
        <p className="mt-2 text-sm text-text-secondary">
          You&apos;ll need to sign in again to access your dashboard and saved jobs.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <form action="/api/auth/sign-out" method="post">
            <button
              type="submit"
              className="w-full rounded-md bg-overlay px-5 py-2.5 text-sm font-medium text-accent-foreground shadow-card hover:bg-overlay-dark"
            >
              Sign out
            </button>
          </form>
          <Link
            href="/dashboard"
            className="w-full rounded-md border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text-primary shadow-card hover:bg-surface-secondary"
          >
            Cancel
          </Link>
        </div>
      </div>
    </main>
  );
}
