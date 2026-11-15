"use client";

import { LayoutDashboard, Search, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/layout/SignOutButton";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Find Jobs", href: "/find-jobs", icon: Search },
  { label: "Profile", href: "/profile", icon: User },
];

export function AppNavbar() {
  const pathname = usePathname();

  return (
    <header className="w-full border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="JobPilot home">
          <Image src="/logo.png" alt="JobPilot" width={496} height={168} className="h-9 w-auto" preload />
        </Link>
        <div className="flex h-full items-center gap-1 sm:gap-2">
          <nav aria-label="Main" className="flex h-full items-stretch gap-1 sm:gap-2">
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 border-b-2 px-2 text-sm font-medium sm:px-4 ${
                    active
                      ? "border-accent text-accent"
                      : "border-transparent text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  <span className="max-sm:sr-only">{label}</span>
                </Link>
              );
            })}
          </nav>
          <span aria-hidden="true" className="h-5 w-px bg-border" />
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
