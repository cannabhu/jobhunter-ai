import { AuthCtaButtons } from "@/components/homepage/AuthCtaButtons";

export function BottomCta() {
  return (
    <>
      <section className="bg-hero-gradient border-b border-border px-6 py-24 text-center">
        <h2 className="mx-auto max-w-2xl text-4xl font-semibold leading-[1.15] tracking-tight text-text-slate md:text-5xl">
          Your next job search can feel a lot less overwhelming
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-sm leading-6 text-text-secondary">
          Set up your profile, upload your resume, and start finding matches in minutes.
        </p>
        <div className="mt-8">
          <AuthCtaButtons />
        </div>
      </section>
      <div className="h-10 bg-surface" aria-hidden />
    </>
  );
}
