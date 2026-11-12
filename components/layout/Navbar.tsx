"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Find Jobs", href: "/find-jobs" },
  { label: "Profile", href: "/profile" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="w-full border-b border-border bg-surface">
      <div className="mx-auto grid h-16 max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center px-6">
        <Link href="/" aria-label="JobPilot home" className="justify-self-start">
          <Image src="/logo.png" alt="JobPilot" width={496} height={168} className="h-9 w-auto" preload />
        </Link>
        <nav className="flex items-center gap-8">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium ${active ? "text-accent" : "text-text-dark hover:text-text-primary"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/login"
          className="justify-self-end rounded-md bg-overlay px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-overlay-dark"
        >
          Start for free
        </Link>
      </div>
    </header>
  );
}
