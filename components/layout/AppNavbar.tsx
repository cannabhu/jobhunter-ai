"use client";

import { usePathname } from "next/navigation";
import { AppNavbarBar } from "@/components/layout/AppNavbarBar";

export function AppNavbar() {
  return <AppNavbarBar pathname={usePathname()} />;
}
