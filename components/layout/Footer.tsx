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
      <div className="flex items-center justify-between px-6 py-10">
        <Image src="/logo.png" alt="JobPilot" width={496} height={168} className="h-8 w-auto" />
        <nav className="flex items-center gap-6">
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
