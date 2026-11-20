"use client";

import { ChevronRight, LayoutDashboard, Menu, Search, User, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Find Jobs", href: "/find-jobs", icon: Search },
  { label: "Profile", href: "/profile", icon: User },
];

const MENU_ID = "landing-mobile-menu";

export function Navbar({ actions }: { actions: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const linkClass = (href: string) => (pathname.startsWith(href) ? "text-accent" : "text-text-dark hover:text-text-primary");

  return (
    <header className="relative w-full border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 md:grid md:grid-cols-[1fr_auto_1fr]">
        <Link href="/" aria-label="JobPilot home" className="justify-self-start">
          <Image src="/logo.png" alt="JobPilot" width={496} height={168} className="h-9 w-auto" preload />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={`text-sm font-medium ${linkClass(item.href)}`}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 justify-self-end">
          {actions}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls={MENU_ID}
            onClick={() => setOpen((value) => !value)}
            className={`-mr-2 flex size-11 cursor-pointer items-center justify-center rounded-md hover:text-text-primary md:hidden ${
              open ? "text-accent" : "text-text-dark"
            }`}
          >
            {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden">
          {/* Dims the page and closes the menu on a tap outside it. */}
          <div aria-hidden="true" onClick={() => setOpen(false)} className="absolute inset-x-0 top-full z-40 h-dvh bg-overlay/30" />
          <nav
            id={MENU_ID}
            aria-label="Main"
            className="absolute inset-x-0 top-full z-50 mx-3 mt-2 flex flex-col gap-1 rounded-xl border border-border bg-linear-to-br from-accent-muted via-surface to-info-lightest p-2 shadow-card motion-safe:animate-menu-in"
          >
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`flex h-14 items-center gap-3 rounded-lg px-3 text-sm font-medium active:bg-surface/80 ${
                    active ? "bg-surface/70 text-accent" : "text-text-dark hover:bg-surface/60"
                  }`}
                >
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface ${
                      active ? "text-accent" : "text-text-secondary"
                    }`}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="flex-1">{label}</span>
                  <ChevronRight className="size-4 text-text-muted" aria-hidden="true" />
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
