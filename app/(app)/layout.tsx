import { Suspense } from "react";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { AppNavbarBar } from "@/components/layout/AppNavbarBar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {/* On a route with a param only known at request time (/find-jobs/[id]) the pathname suspends; the fallback is the
          same bar with no active item, so the header never jumps. */}
      <Suspense fallback={<AppNavbarBar pathname={null} />}>
        <AppNavbar />
      </Suspense>
      <main className="flex-1">{children}</main>
    </>
  );
}
