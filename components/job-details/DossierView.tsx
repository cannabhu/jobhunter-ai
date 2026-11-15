import type { ReactNode } from "react";
import type { CompanyDossier } from "@/types";

type Props = {
  dossier: CompanyDossier;
  researchedLabel: string | null;
};

const labelClass = "text-xs font-semibold tracking-wide text-text-secondary uppercase";
const bulletsClass = "mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-text-primary marker:text-text-muted";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className={labelClass}>{title}</h3>
      {children}
    </div>
  );
}

function BulletSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <Section title={title}>
      <ul className={bulletsClass}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Section>
  );
}

/** "https://stripe.com/about" becomes "stripe.com/about" for the sources line. */
function sourceLabel(url: string): string {
  const { hostname, pathname } = new URL(url);
  return `${hostname.replace(/^www\./, "")}${pathname === "/" ? "" : pathname}`;
}

/** The saved company briefing. Every value was normalized when it was saved and again when it was read. */
export function DossierView({ dossier, researchedLabel }: Props) {
  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      <Section title="Company Overview">
        <p className="mt-2 text-sm leading-6 text-text-primary">{dossier.companyOverview}</p>
      </Section>

      {dossier.techStack.length > 0 ? (
        <Section title="Tech Stack">
          <ul className="mt-2 flex flex-wrap gap-2">
            {dossier.techStack.map((tech) => (
              <li key={tech} className="rounded-full bg-info-lightest px-3 py-1 text-xs font-medium text-info-foreground">
                {tech}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <BulletSection title="Culture" items={dossier.culture} />

      {dossier.whyThisRole !== "" ? (
        <Section title="Why This Role">
          <p className="mt-2 text-sm leading-6 text-text-primary">{dossier.whyThisRole}</p>
        </Section>
      ) : null}

      {dossier.yourEdge.length > 0 ? (
        <div className="rounded-lg border border-accent-light bg-accent-muted p-4">
          <h3 className="text-xs font-semibold tracking-wide text-accent uppercase">Your Edge</h3>
          <ul className={bulletsClass}>
            {dossier.yourEdge.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <BulletSection title="Gaps to Address" items={dossier.gapsToAddress} />
      <BulletSection title="Smart Questions to Ask" items={dossier.smartQuestions} />
      <BulletSection title="Interview Prep" items={dossier.interviewPrep} />

      <div className="border-t border-border pt-4">
        {dossier.sources.length > 0 ? (
          <p className="text-xs leading-5 text-text-muted">
            Sources:{" "}
            {dossier.sources.map((url, index) => (
              <span key={url}>
                {index > 0 ? ", " : null}
                <a href={url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-text-secondary">
                  {sourceLabel(url)}
                </a>
              </span>
            ))}
          </p>
        ) : (
          <p className="text-xs leading-5 text-text-muted">
            We couldn&apos;t read the company&apos;s website, so this briefing comes from the job post and your profile only.
          </p>
        )}
        {researchedLabel ? <p className="mt-1 text-xs text-text-muted">Researched {researchedLabel}</p> : null}
      </div>
    </div>
  );
}
