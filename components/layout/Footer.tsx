import Image from "next/image";
import Link from "next/link";

const FOOTER_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Condition", href: "/terms" },
];

export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-[1280px] border-x border-t border-border bg-surface">
      <div className="flex flex-col items-center gap-6 px-6 py-10 sm:flex-row sm:justify-between">
        <Image src="/logo.png" alt="JobPilot" width={496} height={168} className="h-8 w-auto" />
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.label} href={link.href} className="text-xs font-medium text-text-dark hover:text-text-primary">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
