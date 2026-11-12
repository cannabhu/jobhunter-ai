import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { BottomCta } from "@/components/homepage/BottomCta";
import { DashboardPreview } from "@/components/homepage/DashboardPreview";
import { Features } from "@/components/homepage/Features";
import { Hero } from "@/components/homepage/Hero";
import { Testimonial } from "@/components/homepage/Testimonial";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-[1280px] border-x border-border bg-surface">
        <Hero />
        <DashboardPreview />
        <Features />
        <Testimonial />
        <BottomCta />
      </main>
      <Footer />
    </>
  );
}
