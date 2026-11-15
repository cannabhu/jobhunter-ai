import { AppNavbar } from "@/components/layout/AppNavbar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <AppNavbar />
      <main className="flex-1">{children}</main>
    </>
  );
}
