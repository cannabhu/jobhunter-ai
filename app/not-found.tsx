import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SIGNED_IN_HOME } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Page not found — JobPilot",
};

export default function NotFound() {
  return (
    <main className="bg-hero-gradient flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 text-center shadow-card">
        <Link href="/" aria-label="JobPilot home" className="flex justify-center">
          <Image src="/logo.png" alt="JobPilot" width={496} height={168} className="h-9 w-auto" preload />
        </Link>
        <p className="mt-6 text-sm font-semibold text-accent">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text-slate">Page not found</h1>
        <p className="mt-2 text-sm text-text-secondary">
          This page doesn&apos;t exist yet, or the link is out of date.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/"
            className="w-full rounded-md bg-overlay px-5 py-2.5 text-sm font-medium text-accent-foreground shadow-card hover:bg-overlay-dark"
          >
            Back to home
          </Link>
          <Link
            href={SIGNED_IN_HOME.href}
            className="w-full rounded-md border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text-primary shadow-card hover:bg-surface-secondary"
          >
            {SIGNED_IN_HOME.label}
          </Link>
        </div>
      </div>
    </main>
  );
}
