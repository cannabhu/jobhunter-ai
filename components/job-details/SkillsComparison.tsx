import { Check, X } from "lucide-react";

type Props = {
  matched: string[];
  missing: string[];
};

const chipClass = "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium";

export function SkillsComparison({ matched, missing }: Props) {
  return (
    <section className="rounded-xl border border-border bg-surface p-6 shadow-card">
      <h2 className="text-xs font-semibold tracking-wide text-text-secondary uppercase">Required Skills vs Your Profile</h2>

      <h3 className="mt-4 text-xs text-text-muted">You have</h3>
      {matched.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-2">
          {matched.map((skill) => (
            <li key={skill} className={`${chipClass} bg-success-lightest text-success-foreground`}>
              <Check className="size-3" aria-hidden="true" />
              {skill}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-text-muted">None of the required skills match your profile yet.</p>
      )}

      <h3 className="mt-3 text-xs text-text-muted">Gap skills</h3>
      {missing.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-2">
          {missing.map((skill) => (
            <li key={skill} className={`${chipClass} bg-accent-muted text-accent`}>
              <X className="size-3" aria-hidden="true" />
              {skill}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-text-muted">No skill gaps found.</p>
      )}
    </section>
  );
}
