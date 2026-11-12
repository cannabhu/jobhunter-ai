import Image from "next/image";

export function Testimonial() {
  return (
    <section className="border-b border-border bg-surface px-6 py-20 text-center">
      <p className="text-xs font-medium uppercase tracking-wider text-accent">Success Stories</p>
      <blockquote className="mx-auto mt-5 max-w-2xl text-2xl font-medium leading-9 text-text-dark">
        &ldquo;I used to spend my evenings copy-pasting resumes. Now I open my dashboard to see interviews waiting. It feels like cheating. Had 3 offers on the table simultaneously.&rdquo;
      </blockquote>
      <div className="mt-6 flex items-center justify-center gap-3 text-left">
        <Image src="/images/user-icon.png" alt="Tom Wilson" width={192} height={192} className="size-9 rounded-md" />
        <div>
          <p className="text-xs font-semibold text-text-primary">Tom Wilson</p>
          <p className="text-xs text-text-secondary">Junior Developer</p>
        </div>
      </div>
    </section>
  );
}
