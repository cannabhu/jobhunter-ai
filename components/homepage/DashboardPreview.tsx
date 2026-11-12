import Image from "next/image";

export function DashboardPreview() {
  return (
    <>
      <section className="border-b border-border bg-surface-muted px-6 pt-10 pb-12">
        <Image
          src="/images/dashboard-demo.png"
          alt="JobPilot dashboard showing job stats, recent activity and company research chart"
          width={4788}
          height={2416}
          sizes="(max-width: 1280px) 100vw, 1000px"
          className="mx-auto h-auto w-full max-w-[1000px]"
        />
      </section>
      <div className="h-10 border-b border-border bg-surface" aria-hidden />
    </>
  );
}
