import { AuthCtaButtons } from "@/components/homepage/AuthCtaButtons";

export function Hero() {
  return (
    <section className="bg-hero-gradient border-b border-border px-6 py-24 text-center">
      <h1 className="mx-auto max-w-3xl text-5xl font-semibold leading-[1.1] tracking-tight text-text-slate md:text-6xl">
        Job hunting is hard. Your tools shouldn&apos;t be.
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-sm leading-6 text-text-secondary">
        Stop applying blind. JobPilot finds the jobs, researches the companies, and gives you everything you need to stand out.
      </p>
      <div className="mt-8">
        <AuthCtaButtons />
      </div>
    </section>
  );
}
